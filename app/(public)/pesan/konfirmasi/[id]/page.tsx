import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import Link from 'next/link'

function fmt(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function fmtDate(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

function Row({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      padding: '8px 0', borderBottom: '1px solid var(--border-subtle)',
    }}>
      <span style={{ fontSize: 12, color: 'var(--text-3)' }}>{label}</span>
      <span style={{
        fontSize: 13, color: 'var(--text-1)', fontWeight: 400,
        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
      }}>
        {value}
      </span>
    </div>
  )
}

export default async function KonfirmasiPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, rooms(room_number, room_type), guests(name, phone), properties(name, check_in_time, check_out_time)')
    .eq('id', params.id)
    .single()

  if (error || !booking) notFound()

  const room = booking.rooms as any
  const guest = booking.guests as any
  const property = booking.properties as any
  const total = booking.total_price as number | null
  const dp = total ? Math.ceil(total / 2) : null

  return (
    <div style={{
      minHeight: '100vh', background: 'var(--bg)',
      fontFamily: 'var(--font-sans)',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      padding: '40px 16px 80px',
    }}>
      {/* Card */}
      <div style={{
        background: '#fff', border: '1px solid var(--border)',
        borderRadius: 'var(--radius-lg)', width: '100%', maxWidth: 440,
        overflow: 'hidden',
        boxShadow: '0 1px 8px rgba(26,25,22,0.06)',
      }}>
        {/* Header card */}
        <div style={{
          background: 'var(--accent)', padding: '24px 24px 20px',
          textAlign: 'center',
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: '50%',
            background: 'rgba(255,255,255,0.15)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            margin: '0 auto 12px',
          }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="#fff" strokeWidth={2.5} strokeLinecap="round" strokeLinejoin="round">
              <polyline points="20 6 9 17 4 12" />
            </svg>
          </div>
          <div style={{ fontSize: 15, fontWeight: 600, color: '#fff', marginBottom: 4 }}>
            Pesanan Diterima!
          </div>
          <div style={{ fontSize: 12, color: 'rgba(255,255,255,0.75)' }}>
            {property?.name ?? 'Guesthouse of Terang'}
          </div>
        </div>

        {/* Detail */}
        <div style={{ padding: '20px 24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <Row label="Nama Tamu" value={guest?.name ?? '—'} />
            <Row label="No. WhatsApp" value={guest?.phone ?? '—'} mono />
            <Row label="Kamar" value={`${room?.room_number} — ${room?.room_type}`} />
            <Row label="Check-in" value={`${fmtDate(booking.check_in)} · ${property?.check_in_time ?? '14:00'}`} />
            <Row label="Check-out" value={`${fmtDate(booking.check_out)} · ${property?.check_out_time ?? '12:00'}`} />
            <Row label="Durasi" value={`${booking.nights} malam`} />
            {total && <Row label="Total Biaya" value={fmt(total)} />}
            {dp && <Row label="DP (50%) — sudah dibayar" value={fmt(dp)} />}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '8px 0',
            }}>
              <span style={{ fontSize: 12, color: 'var(--text-3)' }}>No. Booking</span>
              <span style={{
                fontFamily: 'var(--font-mono)', fontSize: 12,
                color: 'var(--text-1)', fontWeight: 500, letterSpacing: '0.05em',
              }}>
                {booking.id.slice(0, 8).toUpperCase()}
              </span>
            </div>
          </div>

          {/* Status menunggu */}
          <div style={{
            marginTop: 16, padding: '12px 14px',
            background: 'var(--status-pending-bg)',
            borderRadius: 'var(--radius)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <div style={{
              width: 18, height: 18, borderRadius: '50%',
              background: 'var(--status-pending-fg)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0, marginTop: 1,
            }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#fff' }} />
            </div>
            <div>
              <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--status-pending-fg)' }}>
                Menunggu Konfirmasi
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-2)', marginTop: 3, lineHeight: 1.6 }}>
                Kami akan mengonfirmasi pesanan via WhatsApp setelah pembayaran DP diverifikasi.
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div style={{
          borderTop: '1px solid var(--border-subtle)',
          padding: '16px 24px', textAlign: 'center',
        }}>
          <Link href="/" style={{
            fontSize: 13, color: 'var(--accent)',
            fontWeight: 500, textDecoration: 'none',
          }}>
            ← Kembali ke Beranda
          </Link>
        </div>
      </div>

      <p style={{ marginTop: 20, fontSize: 12, color: 'var(--text-3)', textAlign: 'center' }}>
        Simpan nomor booking kamu. Hubungi kami jika ada pertanyaan.
      </p>
    </div>
  )
}
