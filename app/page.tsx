import Link from 'next/link'
import Image from 'next/image'
import { createClient } from '@/lib/supabase/server'
import AvailabilityWidget, { type RentalPackage } from '@/components/public/AvailabilityWidget'
import AnimatedHeader from '@/components/public/AnimatedHeader'
import ScrollReveal from '@/components/public/ScrollReveal'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const AMENITY_ICONS: Record<string, React.ReactNode> = {
  wifi: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M5 12.55a11 11 0 0114.08 0M1.42 9a16 16 0 0121.16 0M8.53 16.11a6 6 0 016.95 0M12 20h.01" />
    </svg>
  ),
  ac: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="8" rx="2"/><path d="M7 11v4M12 11v6M17 11v4M5 15c0 2 2 4 7 4s7-2 7-4"/>
    </svg>
  ),
  dapur: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M3 11l19-9-9 19-2-8-8-2z"/>
    </svg>
  ),
  parkir: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="1" y="3" width="15" height="13" rx="2"/><path d="M16 8h4l3 4v4h-7V8zM5.5 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3zM18.5 20a1.5 1.5 0 100-3 1.5 1.5 0 000 3z"/>
    </svg>
  ),
  smart_tv: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="20" height="14" rx="2"/><path d="M8 21h8M12 17v4"/>
    </svg>
  ),
  cctv: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M15 8h.01M2 6l5 10 5-5 5 5 5-10M12 8a4 4 0 100-8 4 4 0 000 8z" />
    </svg>
  ),
  air_panas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10 10-4.5 10-10S17.5 2 12 2z"/><path d="M12 6v6l4 2"/>
    </svg>
  ),
  kulkas: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="5" y="2" width="14" height="20" rx="2"/><path d="M5 10h14M10 6v2M10 14v4"/>
    </svg>
  ),
  mesin_cuci: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="2" width="20" height="20" rx="2"/><circle cx="12" cy="13" r="4"/><path d="M7 6h.01M11 6h.01"/>
    </svg>
  ),
  kolam_renang: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 20c2-2 4-2 6 0s4 2 6 0 4-2 6 0M2 16c2-2 4-2 6 0s4 2 6 0 4-2 6 0M4 8l4-4 4 4M12 4v8"/>
    </svg>
  ),
  bbq: (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M4 11h16M12 11V5M5 19l2-4M19 19l-2-4M12 15v4M8 19h8"/>
    </svg>
  ),
}

const AMENITY_LABELS: Record<string, string> = {
  wifi: 'WiFi', ac: 'AC', dapur: 'Dapur Lengkap', parkir: 'Parkir Luas',
  smart_tv: 'Smart TV', cctv: 'CCTV', air_panas: 'Air Panas',
  kulkas: 'Kulkas', mesin_cuci: 'Mesin Cuci', kolam_renang: 'Kolam Renang', bbq: 'Area BBQ',
}

function PhotoGallery({ photos }: { photos: string[] }) {
  if (photos.length === 0) {
    return (
      <div style={{
        height: 400, background: 'var(--surface)', borderRadius: 'var(--radius-lg)',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        border: '1px solid var(--border)', position: 'relative', overflow: 'hidden',
      }}>
        <svg width="100%" height="100%" style={{ position: 'absolute', inset: 0 }}>
          {Array.from({ length: 20 }).map((_, i) => (
            <rect key={i} x={`${i * 5}%`} y="0" width="2.5%" height="100%"
              fill={i % 2 === 0 ? '#EAE6DF' : '#E2DDD5'} />
          ))}
        </svg>
        <span style={{
          fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)',
          position: 'relative', background: 'var(--surface)', padding: '4px 12px',
          borderRadius: 4,
        }}>
          Belum ada foto — upload melalui Admin → Properti
        </span>
      </div>
    )
  }

  if (photos.length === 1) {
    return (
      <div className="photo-img-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 400 }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="Foto properti" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
    )
  }

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: photos.length >= 3 ? '1fr 1fr' : '1fr 1fr',
      gridTemplateRows: '200px 200px',
      gap: 8, borderRadius: 'var(--radius-lg)', overflow: 'hidden',
    }}>
      {/* Big photo */}
      <div className="photo-img-wrapper" style={{ gridRow: '1 / 3', overflow: 'hidden' }}>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={photos[0]} alt="Foto utama" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      </div>
      {/* Right side: up to 4 more photos */}
      {photos.slice(1, 5).map((url, i) => (
        <div key={url} className="photo-img-wrapper" style={{ overflow: 'hidden' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={url} alt={`Foto ${i + 2}`} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
        </div>
      ))}
      {/* Fill empty slots with surface color */}
      {photos.slice(1, 5).length < 4 && Array.from({ length: 4 - Math.min(photos.length - 1, 4) }).map((_, i) => (
        <div key={`empty-${i}`} style={{ background: 'var(--surface)' }} />
      ))}
    </div>
  )
}

export default async function LandingPage() {
  const supabase = createClient()

  const { data: property } = await supabase
    .from('properties').select('*').eq('slug', 'guesthouse-terang').single()

  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, price_weekday, price_weekend')
    .eq('property_id', property?.id ?? '')
    .eq('status', 'active')
    .order('room_number')

  const packages: RentalPackage[] = rooms ?? []

  const amenities: string[] = property?.amenities ?? []
  const photos: string[] = property?.photos ?? []

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      {/* Sticky Header — glassmorphism on scroll */}
      <AnimatedHeader>
        <Image src="/logo.png" alt="Guesthouse of Terang" width={120} height={36} style={{ objectFit: 'contain' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          {property?.address && (
            <span style={{ fontSize: 12, color: 'var(--text-3)', display: 'none' }} className="hide-mobile">
              {property.address}
            </span>
          )}
          <Link href="/masuk" style={{
            padding: '6px 14px', borderRadius: 'var(--radius)',
            border: '1px solid var(--border)', background: 'var(--surface)',
            color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
          }}>
            Admin
          </Link>
        </div>
      </AnimatedHeader>

      <main style={{ maxWidth: 1080, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Photo Gallery — fade-up on load + hover zoom */}
        <div className="hero-gallery">
          <PhotoGallery photos={photos} />
        </div>

        {/* Title + Meta — fade-up after gallery */}
        <div className="hero-title" style={{ marginTop: 28, marginBottom: 28 }}>
          <h1 style={{
            fontSize: 26, fontWeight: 600, color: 'var(--text-1)',
            letterSpacing: '-0.02em', lineHeight: 1.25, marginBottom: 8,
          }}>
            {property?.name ?? 'Guesthouse of Terang'}
          </h1>
          {property?.address && (
            <p style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {property.address}
            </p>
          )}
          {/* Info chips — hover lift + tint */}
          <div style={{ display: 'flex', gap: 16, flexWrap: 'wrap' }}>
            {([
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>,
                label: `Maks. ${property?.max_guests ?? 8} orang`,
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2 4v16"/><path d="M2 8h18a2 2 0 0 1 2 2v10H2"/><path d="M6 8V4"/><path d="M2 12h20"/></svg>,
                label: `${property?.bedroom_count ?? 2} kamar tidur`,
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 12a8 8 0 0 1 16 0"/><path d="M12 12v9"/><path d="M5 15H3"/><path d="M21 15h-2"/><path d="M8 18H3"/><path d="M21 18h-5"/></svg>,
                label: `${property?.bathroom_count ?? 1} kamar mandi`,
              },
              {
                icon: <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>,
                label: 'Sewa 1 rumah penuh',
              },
            ] as { icon: React.ReactNode; label: string }[]).map(({ icon, label }) => (
              <div key={label} className="info-chip" style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius-pill)', padding: '5px 14px',
                fontSize: 13, color: 'var(--text-2)',
              }}>
                <span style={{ display: 'flex', color: 'var(--text-3)' }}>{icon}</span>
                <span>{label}</span>
              </div>
            ))}
          </div>
        </div>

        {/* 2-column layout: Info left, Booking widget right */}
        <div className="landing-main-grid" style={{ display: 'grid', gridTemplateColumns: '1fr 380px', gap: 48, alignItems: 'start' }}>

          {/* LEFT — Property info */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Description */}
            {property?.description && (
              <ScrollReveal>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>
                    Tentang Properti
                  </h2>
                  <p style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.8, whiteSpace: 'pre-wrap' }}>
                    {property.description}
                  </p>
                </div>
              </ScrollReveal>
            )}

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Amenities — cards with hover lift */}
            {amenities.length > 0 && (
              <ScrollReveal delay={60}>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16, letterSpacing: '-0.01em' }}>
                    Fasilitas
                  </h2>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                    {amenities.map((id) => (
                      <div key={id} className="amenity-card" style={{
                        display: 'flex', alignItems: 'center', gap: 12,
                        padding: '12px 14px', background: '#fff',
                        border: '1px solid var(--border)', borderRadius: 'var(--radius)',
                      }}>
                        <span style={{ color: 'var(--accent)', flexShrink: 0 }}>
                          {AMENITY_ICONS[id] ?? <span style={{ fontSize: 18 }}>✓</span>}
                        </span>
                        <span style={{ fontSize: 13, color: 'var(--text-1)', fontWeight: 500 }}>
                          {AMENITY_LABELS[id] ?? id}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              </ScrollReveal>
            )}

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* House Rules */}
            <ScrollReveal delay={40}>
              <div>
                <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 16, letterSpacing: '-0.01em' }}>
                  Aturan Menginap
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {([
                    {
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,
                      label: 'Check-in', value: `Mulai pukul ${property?.check_in_time ?? '14:00'} WIB`,
                    },
                    {
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 8 14"/></svg>,
                      label: 'Check-out', value: `Sebelum pukul ${property?.check_out_time ?? '12:00'} WIB`,
                    },
                    {
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
                      label: 'Merokok', value: 'Tidak diizinkan di dalam rumah',
                    },
                    {
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg>,
                      label: 'Hewan peliharaan', value: 'Tidak diizinkan',
                    },
                    {
                      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>,
                      label: 'Pesta', value: 'Izin terlebih dahulu',
                    },
                  ] as { icon: React.ReactNode; label: string; value: string }[]).map(({ icon, label, value }) => (
                    <div key={label} style={{ display: 'flex', gap: 14, alignItems: 'flex-start' }}>
                      <span style={{ display: 'flex', color: 'var(--text-3)', flexShrink: 0, marginTop: 2 }}>{icon}</span>
                      <div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{label}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-3)', marginTop: 1 }}>{value}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </ScrollReveal>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            {/* Location */}
            {property?.address && (
              <ScrollReveal>
                <div>
                  <h2 style={{ fontSize: 16, fontWeight: 600, color: 'var(--text-1)', marginBottom: 12, letterSpacing: '-0.01em' }}>
                    Lokasi
                  </h2>
                  <div style={{
                    background: 'var(--surface)', border: '1px solid var(--border)',
                    borderRadius: 'var(--radius-lg)', padding: '16px 18px',
                    display: 'flex', alignItems: 'flex-start', gap: 12,
                  }}>
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <span style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6 }}>
                      {property.address}
                    </span>
                  </div>
                </div>
              </ScrollReveal>
            )}
          </div>

          {/* RIGHT — Booking Widget (sticky) */}
          <div className="landing-widget-sticky" style={{ position: 'sticky', top: 76 }}>
            <AvailabilityWidget packages={packages} />
          </div>
        </div>
      </main>

      <footer style={{
        borderTop: '1px solid var(--border-subtle)',
        padding: '24px 32px', textAlign: 'center',
        fontSize: 12, color: 'var(--text-3)',
      }}>
        &copy; {new Date().getFullYear()} {property?.name ?? 'Guesthouse of Terang'} · Ponorogo, Jawa Timur
      </footer>
    </div>
  )
}
