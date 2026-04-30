-- ============================================================
-- Migration 004: Property details untuk listing publik gaya villa
-- ============================================================

alter table properties
  add column if not exists description    text,
  add column if not exists amenities      text[]  not null default '{}',
  add column if not exists bedroom_count  int     not null default 2,
  add column if not exists bathroom_count int     not null default 1,
  add column if not exists max_guests     int     not null default 8,
  add column if not exists address        text,
  add column if not exists photos         text[]  not null default '{}';

-- Seed data awal untuk properti yang sudah ada
update properties set
  amenities      = array['wifi','ac','dapur','parkir','smart_tv','cctv'],
  bedroom_count  = 2,
  bathroom_count = 1,
  max_guests     = 8
where slug = 'guesthouse-terang';

-- ============================================================
-- Catatan setup Supabase Storage:
-- Buat bucket "property-photos" dengan akses Public di:
-- Supabase Dashboard → Storage → New Bucket
-- nama: property-photos
-- Public: true
-- ============================================================
