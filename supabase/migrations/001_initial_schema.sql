-- ============================================================
-- Migration 001: Initial Schema — Guesthouse PMS
-- ============================================================

-- Extensions
create extension if not exists "uuid-ossp";

-- ============================================================
-- ENUMS
-- ============================================================

create type room_status as enum ('active', 'maintenance', 'inactive');
create type booking_source as enum ('direct', 'airbnb', 'agoda');
create type booking_status as enum ('pending', 'confirmed', 'active', 'completed', 'cancelled');
create type ical_platform as enum ('airbnb', 'agoda', 'other');

-- ============================================================
-- TABLES
-- ============================================================

-- Properties (inti multi-tenancy)
create table properties (
  id            uuid primary key default uuid_generate_v4(),
  name          text not null,
  slug          text not null unique,
  owner_id      uuid not null references auth.users(id) on delete cascade,
  timezone      text not null default 'Asia/Jakarta',
  check_in_time time not null default '14:00',
  check_out_time time not null default '12:00',
  created_at    timestamptz not null default now()
);

-- Rooms
create table rooms (
  id              uuid primary key default uuid_generate_v4(),
  property_id     uuid not null references properties(id) on delete cascade,
  room_number     text not null,
  room_type       text not null default 'Standard',
  capacity        int not null default 2,
  price_weekday   numeric(10,2) not null default 0,
  price_weekend   numeric(10,2) not null default 0,
  status          room_status not null default 'active',
  created_at      timestamptz not null default now(),
  unique (property_id, room_number)
);

-- Guests
create table guests (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  name        text not null,
  phone       text,
  email       text,
  id_number   text,
  created_at  timestamptz not null default now()
);

-- Bookings
create table bookings (
  id           uuid primary key default uuid_generate_v4(),
  property_id  uuid not null references properties(id) on delete cascade,
  room_id      uuid not null references rooms(id) on delete restrict,
  guest_id     uuid references guests(id) on delete set null,
  check_in     date not null,
  check_out    date not null,
  source       booking_source not null default 'direct',
  external_uid text,
  status       booking_status not null default 'pending',
  nights       int generated always as (check_out - check_in) stored,
  total_price  numeric(10,2),
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  constraint check_dates check (check_out > check_in),
  unique (property_id, external_uid)
);

-- Overlap constraint: tidak boleh dua booking aktif di kamar + tanggal yang sama
-- Di-enforce via function + trigger
create or replace function check_booking_overlap()
returns trigger as $$
begin
  if exists (
    select 1 from bookings
    where room_id = new.room_id
      and id != new.id
      and status not in ('cancelled')
      and check_in  < new.check_out
      and check_out > new.check_in
  ) then
    raise exception 'Booking overlap: kamar sudah terpesan pada tanggal tersebut.';
  end if;
  return new;
end;
$$ language plpgsql;

create trigger trg_booking_overlap
  before insert or update on bookings
  for each row execute function check_booking_overlap();

-- Auto-update updated_at
create or replace function set_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger trg_bookings_updated_at
  before update on bookings
  for each row execute function set_updated_at();

-- Availability blocks
create table availability_blocks (
  id          uuid primary key default uuid_generate_v4(),
  property_id uuid not null references properties(id) on delete cascade,
  room_id     uuid not null references rooms(id) on delete cascade,
  start_date  date not null,
  end_date    date not null,
  reason      text,
  constraint check_block_dates check (end_date > start_date)
);

-- iCal sources
create table ical_sources (
  id             uuid primary key default uuid_generate_v4(),
  property_id    uuid not null references properties(id) on delete cascade,
  room_id        uuid not null references rooms(id) on delete cascade,
  platform       ical_platform not null,
  ical_url       text not null,
  is_active      boolean not null default true,
  last_synced_at timestamptz
);

-- Sync logs
create table sync_logs (
  id               uuid primary key default uuid_generate_v4(),
  property_id      uuid not null references properties(id) on delete cascade,
  source_id        uuid not null references ical_sources(id) on delete cascade,
  synced_at        timestamptz not null default now(),
  events_found     int not null default 0,
  events_inserted  int not null default 0,
  events_updated   int not null default 0,
  error            text
);

-- ============================================================
-- INDEXES
-- ============================================================

create index idx_rooms_property on rooms(property_id);
create index idx_bookings_property on bookings(property_id);
create index idx_bookings_room on bookings(room_id);
create index idx_bookings_dates on bookings(check_in, check_out);
create index idx_bookings_external_uid on bookings(external_uid) where external_uid is not null;
create index idx_guests_property on guests(property_id);
create index idx_ical_sources_active on ical_sources(property_id) where is_active = true;
create index idx_availability_blocks_room on availability_blocks(room_id, start_date, end_date);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

alter table properties         enable row level security;
alter table rooms              enable row level security;
alter table guests             enable row level security;
alter table bookings           enable row level security;
alter table availability_blocks enable row level security;
alter table ical_sources        enable row level security;
alter table sync_logs           enable row level security;

-- Helper: apakah user adalah owner properti ini?
create or replace function is_property_owner(pid uuid)
returns boolean as $$
  select exists (
    select 1 from properties
    where id = pid and owner_id = auth.uid()
  );
$$ language sql security definer;

-- Properties: owner bisa CRUD propertinya
create policy "owner can manage own property"
  on properties for all
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

-- Rooms: owner properti bisa CRUD
create policy "owner can manage rooms"
  on rooms for all
  using (is_property_owner(property_id))
  with check (is_property_owner(property_id));

-- Guests
create policy "owner can manage guests"
  on guests for all
  using (is_property_owner(property_id))
  with check (is_property_owner(property_id));

-- Bookings
create policy "owner can manage bookings"
  on bookings for all
  using (is_property_owner(property_id))
  with check (is_property_owner(property_id));

-- Availability blocks
create policy "owner can manage availability blocks"
  on availability_blocks for all
  using (is_property_owner(property_id))
  with check (is_property_owner(property_id));

-- iCal sources
create policy "owner can manage ical sources"
  on ical_sources for all
  using (is_property_owner(property_id))
  with check (is_property_owner(property_id));

-- Sync logs
create policy "owner can read sync logs"
  on sync_logs for select
  using (is_property_owner(property_id));

-- Service role (cron job) bisa baca semua ical_sources dan insert sync_logs
-- Ini ditangani via service_role key di API route (melewati RLS)
