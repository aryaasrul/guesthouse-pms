import Link from 'next/link'
import Image from 'next/image'
import { cache } from 'react'
import type { Metadata } from 'next'
import { createClient } from '@/lib/supabase/server'
import AvailabilityWidget, { type RentalPackage } from '@/components/public/AvailabilityWidget'
import AnimatedHeader from '@/components/public/AnimatedHeader'
import ScrollReveal from '@/components/public/ScrollReveal'

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'https://guesthouse-pms.vercel.app'

// React cache deduplicates the DB call — generateMetadata & page share the same fetch
const getProperty = cache(async () => {
  const supabase = createClient()
  const { data } = await supabase
    .from('properties')
    .select('*')
    .eq('slug', 'guesthouse-terang')
    .single()
  return data
})

export async function generateMetadata(): Promise<Metadata> {
  const property = await getProperty()

  const name        = property?.name ?? 'Guesthouse of Terang'
  const address     = property?.address ?? 'Ponorogo, Jawa Timur'
  const priceFrom   = property?.price_weekday
    ? `Mulai Rp ${property.price_weekday.toLocaleString('id-ID')}/malam`
    : null
  const title       = priceFrom
    ? `${name} — Penginapan Murah Ponorogo | ${priceFrom}`
    : `${name} — Penginapan & Sewa Kamar Murah di Ponorogo`
  const description = [
    `${name} adalah penginapan keluarga di Ponorogo, Jawa Timur.`,
    priceFrom ? `${priceFrom}.` : null,
    'Fasilitas lengkap: WiFi, AC, dapur, parkir luas.',
    'Sewa kamar per malam atau seluruh rumah untuk keluarga & rombongan.',
    'Pesan langsung secara online.',
  ].filter(Boolean).join(' ')

  const ogImage = property?.photos?.[0] ?? '/logo.png'

  return {
    title,
    description,
    keywords: [
      'penginapan ponorogo',
      'penginapan murah ponorogo',
      'guesthouse ponorogo',
      'sewa kamar ponorogo',
      'homestay ponorogo',
      'villa ponorogo',
      'penginapan keluarga ponorogo',
      'penginapan rombongan ponorogo',
      'hotel murah ponorogo',
      name.toLowerCase(),
    ],
    alternates: {
      canonical: SITE_URL,
    },
    openGraph: {
      type: 'website',
      url: SITE_URL,
      siteName: name,
      locale: 'id_ID',
      title,
      description,
      images: [{ url: ogImage, width: 1200, height: 630, alt: `Foto ${name} — ${address}` }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

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
      <div className="photo-img-wrapper" style={{ borderRadius: 'var(--radius-lg)', overflow: 'hidden', height: 400, position: 'relative' }}>
        <Image src={photos[0]} alt="Foto properti" fill style={{ objectFit: 'cover' }} priority sizes="100vw" />
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
      {/* Big photo — LCP element, load with priority */}
      <div className="photo-img-wrapper" style={{ gridRow: '1 / 3', overflow: 'hidden', position: 'relative' }}>
        <Image src={photos[0]} alt="Foto utama" fill style={{ objectFit: 'cover' }} priority sizes="(max-width: 768px) 100vw, 50vw" />
      </div>
      {/* Right side: up to 4 more photos — lazy loaded */}
      {photos.slice(1, 5).map((url, i) => (
        <div key={url} className="photo-img-wrapper" style={{ overflow: 'hidden', position: 'relative' }}>
          <Image src={url} alt={`Foto ${i + 2}`} fill style={{ objectFit: 'cover' }} sizes="(max-width: 768px) 50vw, 25vw" />
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
  const property = await getProperty()

  const supabase = createClient()
  const { data: rooms } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, price_weekday, price_weekend')
    .eq('property_id', property?.id ?? '')
    .eq('status', 'active')
    .order('room_number')

  const packages: RentalPackage[] = rooms ?? []
  const amenities: string[] = property?.amenities ?? []
  const photos: string[] = property?.photos ?? []

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'GuestHouse',
    name: property?.name ?? 'Guesthouse of Terang',
    description: property?.description ?? 'Penginapan keluarga di Ponorogo, Jawa Timur.',
    url: SITE_URL,
    telephone: '+6285162542682',
    address: {
      '@type': 'PostalAddress',
      streetAddress: property?.address ?? '',
      addressLocality: 'Ponorogo',
      addressRegion: 'Jawa Timur',
      addressCountry: 'ID',
    },
    image: photos.slice(0, 5),
    ...(property?.price_weekday && {
      priceRange: `Rp ${property.price_weekday.toLocaleString('id-ID')} – Rp ${(property.price_weekend ?? property.price_weekday).toLocaleString('id-ID')}`,
    }),
    checkinTime: property?.check_in_time ?? '14:00',
    checkoutTime: property?.check_out_time ?? '12:00',
    numberOfRooms: property?.bedroom_count ?? undefined,
    amenityFeature: amenities.map((a) => ({
      '@type': 'LocationFeatureSpecification',
      name: AMENITY_LABELS[a] ?? a,
      value: true,
    })),
    sameAs: [
      'https://www.agoda.com',
      'https://www.airbnb.com',
    ],
  }

  return (
    <>
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
    />
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      {/* Sticky Header — glassmorphism on scroll */}
      <AnimatedHeader>
        <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text-1)', letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          Guesthouse <span style={{ fontStyle: 'italic', fontWeight: 400 }}>of</span> Terang
        </span>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <a
            href="https://wa.me/6285162542682"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '6px 14px', borderRadius: 'var(--radius)',
              border: '1px solid var(--border)', background: 'var(--surface)',
              color: 'var(--text-2)', fontSize: 13, fontWeight: 500,
            }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Chat WA
          </a>
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
            <a
              href="https://maps.app.goo.gl/CcFZf81xtJEPuuiN7"
              target="_blank"
              rel="noopener noreferrer"
              style={{ fontSize: 14, color: 'var(--text-3)', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6, textDecoration: 'none' }}
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/><circle cx="12" cy="10" r="3"/>
              </svg>
              {property.address}
            </a>
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
                  <a
                    href="https://maps.app.goo.gl/CcFZf81xtJEPuuiN7"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="location-card"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                      stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                      style={{ flexShrink: 0, marginTop: 1 }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z"/>
                      <circle cx="12" cy="10" r="3"/>
                    </svg>
                    <div>
                      <span style={{ fontSize: 14, color: 'var(--text-2)', lineHeight: 1.6, display: 'block' }}>
                        {property.address}
                      </span>
                      <span style={{ fontSize: 12, color: 'var(--accent)', marginTop: 4, display: 'block' }}>
                        Buka di Google Maps →
                      </span>
                    </div>
                  </a>
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
        <div style={{ marginBottom: 8 }}>
          <a
            href="https://wa.me/6285162542682"
            target="_blank"
            rel="noopener noreferrer"
            style={{ color: 'var(--accent)', fontWeight: 500, display: 'inline-flex', alignItems: 'center', gap: 5 }}
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
            </svg>
            Hubungi kami via WhatsApp
          </a>
        </div>
        &copy; {new Date().getFullYear()} {property?.name ?? 'Guesthouse of Terang'} · Ponorogo, Jawa Timur
      </footer>
    </div>
    </>
  )
}
