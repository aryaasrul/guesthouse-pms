# Guesthouse of Terang — PMS

Property Management System untuk Guesthouse of Terang, Ponorogo. Dibangun dengan Next.js 14, Supabase, dan Vercel.

## Tech Stack

- **Next.js 14** (App Router + TypeScript)
- **Supabase** (PostgreSQL + Auth + Realtime + RLS)
- **Tailwind CSS**
- **Vercel Cron** (iCal sync setiap 30 menit)

---

## Setup

### 1. Clone & install

```bash
git clone <repo>
cd guesthouse-pms
npm install
```

### 2. Setup Supabase

1. Buat project baru di [supabase.com](https://supabase.com)
2. Jalankan migration di **SQL Editor** Supabase:
   - `supabase/migrations/001_initial_schema.sql`
   - `supabase/migrations/002_availability_rpc.sql`
3. Aktifkan **Email Auth** di Authentication → Providers
4. Buat user admin di Authentication → Users

### 3. Environment variables

```bash
cp .env.local.example .env.local
```

Isi nilai dari Supabase Dashboard → Settings → API:

| Variable | Sumber |
|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | service_role key (rahasia!) |
| `CRON_SECRET` | String acak (bebas isi) |
| `NEXT_PUBLIC_SITE_URL` | URL produksi, misal `https://guesthouse-terang.vercel.app` |

### 4. Seed data properti

Setelah registrasi admin, insert satu baris di tabel `properties`:

```sql
insert into properties (name, slug, owner_id, timezone)
values (
  'Guesthouse of Terang',
  'guesthouse-terang',
  '<user-id-dari-auth-users>',
  'Asia/Jakarta'
);
```

### 5. Run development

```bash
npm run dev
```

---

## Routes

### Area Publik

| Route | Keterangan |
|---|---|
| `/` | Landing page |
| `/kamar` | Daftar kamar |
| `/kamar/[id]` | Detail kamar + form booking |
| `/pesan/konfirmasi/[id]` | Halaman konfirmasi booking |

### Area Admin

| Route | Keterangan |
|---|---|
| `/masuk` | Login admin |
| `/admin` | Dashboard |
| `/admin/kalender` | Kalender visual per kamar |
| `/admin/booking` | Tabel semua booking |
| `/admin/booking/baru` | Form booking manual |
| `/admin/booking/[id]` | Detail + aksi booking |
| `/admin/kamar` | CRUD kamar |
| `/admin/sinkronisasi` | Kelola URL iCal + log sync |
| `/admin/tamu` | Database tamu |

### API Routes

| Route | Method | Keterangan |
|---|---|---|
| `/api/bookings` | GET, POST | List/buat booking |
| `/api/bookings/[id]` | GET, PATCH, DELETE | Detail/update/cancel |
| `/api/availability` | GET | Kamar tersedia untuk tanggal |
| `/api/rooms` | POST, PATCH | CRUD kamar |
| `/api/guests` | GET, POST | CRUD tamu |
| `/api/ical-sources` | POST | Tambah sumber iCal |
| `/api/sync/ical` | GET | Trigger sync (dipanggil Vercel Cron) |
| `/api/public/booking` | POST | Form booking publik (tanpa auth) |

---

## Deploy ke Vercel

1. Push ke GitHub
2. Import repo ke Vercel
3. Tambahkan semua environment variables di Vercel → Settings → Environment Variables
4. Tambahkan `CRON_SECRET` di Vercel agar cron job aman
5. Deploy!

Vercel Cron akan otomatis berjalan setiap 30 menit memanggil `/api/sync/ical`.

---

## Fase Pengembangan

- [x] **Fase 0** — Fondasi: Next.js + Supabase + iCal Sync + Auth
- [x] **Fase 1** — Dashboard Admin: booking, kamar, kalender, sinkronisasi
- [x] **Fase 2** — Halaman Publik: landing, kamar, form booking
- [ ] **Fase 3** — Kalender Visual (drag-to-select, occupancy rate)
- [ ] **Fase 4** — SaaS Foundation (multi-tenant routing, superadmin)
# guesthouse-pms
