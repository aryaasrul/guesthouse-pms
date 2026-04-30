# Guesthouse of Terang — Project Brief
## Sistem Manajemen Properti (PMS) v2.0

**Dibuat:** 28 April 2026  
**Status:** Draft aktif  
**Target awal:** Guesthouse of Terang (Ponorogo)  
**Target jangka panjang:** SaaS untuk properti kecil-menengah

---

## 1. Ringkasan Proyek

Membangun Property Management System (PMS) berbasis web untuk mengelola booking dari semua platform (Airbnb, Agoda, direct) dalam satu kalender terpusat yang dinamis. Dibangun dengan arsitektur multi-tenant dari awal sehingga bisa dijual sebagai SaaS di kemudian hari.

**Tidak ada:** n8n, WA bot, Fonnte, notifikasi otomatis apapun.  
**Ada:** Supabase, Next.js, Vercel — selesai.

---

## 2. Tech Stack

| Komponen | Pilihan | Keterangan |
|---|---|---|
| Frontend + API | **Next.js 14+ (App Router)** | SSR, API routes, satu codebase |
| Database + Auth | **Supabase** | PostgreSQL, Auth, Realtime, RLS |
| Hosting | **Vercel** | Free tier, deploy otomatis dari GitHub |
| iCal Sync | **Vercel Cron Jobs** | Trigger API route setiap 30 menit, gratis |
| Bahasa | **TypeScript** | Wajib untuk proyek jangka panjang |
| Styling | **Tailwind CSS** | Utility-first, cepat, konsisten |
| State management | **Zustand** atau React Server Components | Sesuai kebutuhan per fitur |

### Biaya operasional

| Layer | Tier | Biaya |
|---|---|---|
| Vercel | Hobby (free) | Gratis — 1 cron job, bandwidth cukup |
| Supabase | Free tier | Gratis — 500MB DB, 2GB bandwidth/bulan |
| **Total** | | **Rp 0/bulan** |

> Saat scale ke SaaS dan mulai ada revenue, upgrade ke Vercel Pro ($20/bln) dan Supabase Pro ($25/bln) barulah masuk akal.

---

## 3. Arsitektur Sistem

```
┌─────────────────────────────────────┐
│           SUMBER BOOKING             │
│  Airbnb (iCal)  Agoda (iCal)  Form  │
└──────┬───────────────┬──────────┬───┘
       │               │          │
       ▼               ▼          │
┌──────────────────────────┐      │
│  Vercel Cron Job         │      │
│  (setiap 30 menit)       │      │
│  → /api/sync/ical        │      │
│  → fetch + parse .ics    │      │
│  → upsert ke Supabase    │      │
└──────────────┬───────────┘      │
               │                  │
               ▼                  ▼
       ┌───────────────────────────┐
       │        SUPABASE            │
       │  properties · rooms        │
       │  bookings · guests         │
       │  availability_blocks       │
       │  ical_sources · sync_logs  │
       └──────────────┬────────────┘
                      │
                      ▼
           ┌─────────────────────┐
           │   NEXT.JS (Vercel)   │
           │  /app — halaman web  │
           │  /api — backend      │
           └─────────────────────┘
```

---

## 4. Arsitektur Multi-Tenant (SaaS-ready)

Setiap properti = satu **tenant**. Semua tabel memiliki kolom `property_id`. Supabase Row Level Security (RLS) memastikan data satu properti tidak bisa diakses properti lain.

### Hierarki user:

```
Super Admin (kamu)
  └── Property Owner (pemilik guesthouse)
        └── Staff (opsional, di fase 2+)
```

### Tabel `properties` (inti multi-tenancy):

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `name` | text | "Guesthouse of Terang" |
| `slug` | text unique | `guesthouse-terang` (untuk URL) |
| `owner_id` | uuid FK → auth.users | |
| `timezone` | text | `Asia/Jakarta` |
| `check_in_time` | time | Default jam check-in |
| `check_out_time` | time | Default jam check-out |
| `created_at` | timestamp | |

> Semua tabel lain (`rooms`, `bookings`, dst) punya `property_id uuid FK → properties`.

---

## 5. Skema Database Lengkap

### `rooms`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `room_number` | text | "101", "Deluxe A", dsb |
| `room_type` | text | "Standard", "Deluxe", dsb |
| `capacity` | int | |
| `price_weekday` | numeric | |
| `price_weekend` | numeric | |
| `status` | enum | `active`, `maintenance`, `inactive` |
| `created_at` | timestamp | |

### `guests`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `name` | text | |
| `phone` | text | |
| `email` | text | |
| `id_number` | text | KTP/paspor |
| `created_at` | timestamp | |

### `bookings`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `room_id` | uuid FK → rooms | |
| `guest_id` | uuid FK → guests | Null jika dari iCal (belum ada data tamu) |
| `check_in` | date | |
| `check_out` | date | |
| `source` | enum | `direct`, `airbnb`, `agoda` |
| `external_uid` | text | UID dari iCal — untuk deduplikasi sync |
| `status` | enum | `pending`, `confirmed`, `active`, `completed`, `cancelled` |
| `nights` | int | Generated: `check_out - check_in` |
| `total_price` | numeric | |
| `notes` | text | Extend, request khusus, dsb |
| `created_at` | timestamp | |
| `updated_at` | timestamp | |

> **Constraint penting:** Tidak boleh ada dua booking aktif dengan `room_id` yang sama dan tanggal overlap. Di-enforce via PostgreSQL constraint + RLS.

### `availability_blocks`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `room_id` | uuid FK → rooms | |
| `start_date` | date | |
| `end_date` | date | |
| `reason` | text | "Renovasi", "Owner use", dsb |

### `ical_sources`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `room_id` | uuid FK → rooms | |
| `platform` | enum | `airbnb`, `agoda`, `other` |
| `ical_url` | text | URL iCal dari platform |
| `is_active` | boolean | |
| `last_synced_at` | timestamp | |

### `sync_logs`

| Kolom | Tipe | Keterangan |
|---|---|---|
| `id` | uuid PK | |
| `property_id` | uuid FK → properties | |
| `source_id` | uuid FK → ical_sources | |
| `synced_at` | timestamp | |
| `events_found` | int | |
| `events_inserted` | int | |
| `events_updated` | int | |
| `error` | text | Null jika sukses |

---

## 6. iCal Sync — Tanpa n8n

Sync dihandle sepenuhnya di dalam Next.js + Vercel Cron, tanpa dependency eksternal.

### Cara kerja:

**`vercel.json`** — mendefinisikan cron:
```json
{
  "crons": [
    {
      "path": "/api/sync/ical",
      "schedule": "*/30 * * * *"
    }
  ]
}
```

**`/api/sync/ical/route.ts`** — logic sync:
1. Query semua `ical_sources` yang `is_active = true`
2. Untuk setiap source: fetch URL iCal → parse `.ics` dengan library `ical.js`
3. Untuk setiap event: cek `external_uid` di `bookings`
   - Belum ada → INSERT booking baru
   - Sudah ada, tanggal berubah → UPDATE
   - Sudah ada, tidak berubah → skip
4. Upsert `last_synced_at` di `ical_sources`
5. Insert log ke `sync_logs`

> Library yang dipakai: `node-ical` atau `ical.js` — keduanya ringan, cocok untuk Vercel serverless.

---

## 7. Logika Ketersediaan Dinamis

Availability **dihitung, tidak disimpan.** Query ke Supabase menggunakan overlap check.

### Fungsi inti (dipakai di mana-mana):

```sql
-- Kamar yang tersedia untuk tanggal check_in s/d check_out
SELECT r.*
FROM rooms r
WHERE r.property_id = :property_id
  AND r.status = 'active'
  AND r.id NOT IN (
    SELECT room_id FROM bookings
    WHERE property_id = :property_id
      AND status NOT IN ('cancelled')
      AND check_in < :check_out
      AND check_out > :check_in
  )
  AND r.id NOT IN (
    SELECT room_id FROM availability_blocks
    WHERE property_id = :property_id
      AND start_date < :check_out
      AND end_date > :check_in
  );
```

### Extend checkout:

1. Admin update `check_out` di booking yang bersangkutan.
2. API route jalankan overlap check terhadap booking lain di kamar yang sama.
3. Jika ada konflik → return warning ke frontend: *"Booking [Nama] mulai [tanggal] akan terdampak."*
4. Admin bisa tetap extend (dan resolve konflik manual) atau batalkan.
5. Tidak ada yang otomatis bergeser — keputusan tetap di tangan admin.

---

## 8. Halaman Aplikasi

### Area publik (untuk tamu)

| Route | Konten |
|---|---|
| `/` | Landing page: nama properti, foto, CTA pesan |
| `/kamar` | List semua kamar dengan harga |
| `/kamar/[id]` | Detail kamar, kalender ketersediaan, form booking |
| `/pesan/konfirmasi/[id]` | Ringkasan booking setelah form disubmit |

### Area admin (login via Supabase Auth)

| Route | Konten |
|---|---|
| `/admin` | Dashboard: status kamar hari ini, ringkasan |
| `/admin/kalender` | Kalender visual per kamar, per bulan |
| `/admin/booking` | Tabel semua booking + filter sumber/status/tanggal |
| `/admin/booking/baru` | Form input booking manual (dari WA/telepon) |
| `/admin/booking/[id]` | Detail booking: edit, extend, cancel |
| `/admin/kamar` | Kelola inventaris kamar |
| `/admin/sinkronisasi` | Kelola URL iCal, status sync, log terakhir |
| `/admin/tamu` | Database tamu |

### Area SaaS (fase 2+)

| Route | Konten |
|---|---|
| `/daftar` | Registrasi properti baru |
| `/masuk` | Login |
| `/[slug]/admin` | Dashboard per properti (multi-tenant routing) |
| `/superadmin` | Kelola semua properti (khusus kamu) |

---

## 9. Struktur Project Next.js

```
/
├── app/
│   ├── (public)/          ← halaman untuk tamu
│   │   ├── page.tsx
│   │   ├── kamar/
│   │   └── pesan/
│   ├── (admin)/           ← halaman admin, layout terpisah
│   │   └── admin/
│   └── api/
│       ├── bookings/
│       ├── availability/
│       └── sync/
│           └── ical/      ← dipanggil Vercel Cron
├── components/
│   ├── ui/                ← komponen dasar (button, input, dsb)
│   ├── calendar/          ← komponen kalender custom
│   └── booking/           ← form, card, tabel booking
├── lib/
│   ├── supabase/          ← client + server Supabase helper
│   ├── ical/              ← parser iCal
│   └── availability/      ← logika cek ketersediaan
├── types/                 ← TypeScript types dari Supabase
└── vercel.json            ← konfigurasi cron
```

---

## 10. Roadmap Development

### Fase 0 — Fondasi (Minggu 1)
- [ ] Setup repo GitHub, init Next.js + TypeScript + Tailwind
- [ ] Setup Supabase project, buat semua tabel + RLS
- [ ] Konfigurasi Supabase Auth (login admin)
- [ ] Buat Supabase types otomatis (`supabase gen types`)
- [ ] Deploy ke Vercel, pastikan CI/CD dari GitHub berjalan
- [ ] Setup Vercel Cron Job + endpoint `/api/sync/ical` (tes dengan URL iCal Airbnb)

### Fase 1 — Dashboard Admin (Minggu 2–3)
- [ ] Layout admin + auth guard
- [ ] Halaman `/admin` — status kamar hari ini
- [ ] Halaman `/admin/booking` — tabel + filter
- [ ] Form booking manual
- [ ] Halaman detail booking: extend + deteksi konflik
- [ ] Halaman `/admin/kamar` — CRUD kamar
- [ ] Halaman `/admin/sinkronisasi` — kelola URL iCal, lihat log

### Fase 2 — Halaman Publik (Minggu 4)
- [ ] Landing page properti
- [ ] Halaman kamar + kalender ketersediaan
- [ ] Form booking direct → Supabase
- [ ] Halaman konfirmasi

### Fase 3 — Kalender Visual (Minggu 5)
- [ ] Tampilan kalender per kamar di admin
- [ ] Drag-to-select tanggal di form booking
- [ ] View occupancy rate bulanan

### Fase 4 — SaaS Foundation (Minggu 6+)
- [ ] Multi-tenant routing `/[slug]/admin`
- [ ] Halaman registrasi properti baru
- [ ] Superadmin dashboard
- [ ] Onboarding flow untuk properti baru

---

## 11. Keputusan Terbuka

Hal-hal yang perlu dijawab sebelum atau selama build:

1. **Jumlah dan nomor kamar** — berapa kamar? apa penomorannya?
2. **Harga** — apakah ada perbedaan weekday/weekend? atau flat?
3. **Jam check-in / check-out default**
4. **Kebijakan extend** — bisa extend H-0 atau harus request sebelum checkout?
5. **Bahasa website publik** — Indonesia saja, atau dwibahasa?
6. **Domain** — sudah punya? Atau dulu pakai domain Vercel gratis (`*.vercel.app`)?
7. **URL iCal Airbnb & Agoda** — sudah bisa diambil? (Perlu panduan cara ambilnya?)
8. **Nama SaaS** — sudah ada gambaran nama/brand untuk produk SaaS-nya nanti?

---

*Dokumen ini diperbarui seiring keputusan diambil dan scope berkembang.*
