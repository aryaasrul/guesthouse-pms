-- ============================================================
-- Migration 003: Public booking fields + RLS untuk akses publik
-- ============================================================

-- Kolom baru di guests
alter table guests
  add column if not exists address       text,
  add column if not exists ktp_photo_url text;

-- Kolom baru di bookings
alter table bookings
  add column if not exists adult_count       int  not null default 1,
  add column if not exists child_count       int  not null default 0,
  add column if not exists source_referral   text,
  add column if not exists payment_proof_url text,
  add column if not exists payment_status    text not null default 'pending';

-- ============================================================
-- RLS: izinkan anon membaca properties + rooms (untuk halaman publik)
-- ============================================================

create policy "public can read properties"
  on properties for select
  using (true);

create policy "public can read active rooms"
  on rooms for select
  using (status = 'active');

-- Izinkan anon membaca bookings (dibutuhkan halaman konfirmasi)
-- Insert tetap lewat service role di API route
create policy "public can read bookings"
  on bookings for select
  using (true);
