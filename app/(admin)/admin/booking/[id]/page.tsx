import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import BookingActions from '@/components/booking/BookingActions'

const STATUS_LABEL: Record<string, string> = {
  available: 'Tersedia', active: 'Terisi', occupied: 'Terisi',
  checkout: 'Checkout', maintenance: 'Perawatan',
  confirmed: 'Konfirmasi', pending: 'Pending', cancelled: 'Dibatalkan', completed: 'Selesai',
}
const SOURCE_LABEL: Record<string, string> = {
  airbnb: 'Airbnb', agoda: 'Agoda', direct: 'Direct',
}

function formatDate(str: string) {
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function Badge({ variant, children, large }: { variant: string; children: React.ReactNode; large?: boolean }) {
  const styles: Record<string, { background: string; color: string }> = {
    active:      { background: 'var(--status-occupied-bg)',    color: 'var(--status-occupied-fg)' },
    occupied:    { background: 'var(--status-occupied-bg)',    color: 'var(--status-occupied-fg)' },
    checkout:    { background: 'var(--status-checkout-bg)',    color: 'var(--status-checkout-fg)' },
    maintenance: { background: 'var(--status-maintenance-bg)', color: 'var(--status-maintenance-fg)' },
    confirmed:   { background: 'var(--status-confirmed-bg)',   color: 'var(--status-confirmed-fg)' },
    pending:     { background: 'var(--status-pending-bg)',     color: 'var(--status-pending-fg)' },
    cancelled:   { background: 'var(--status-cancelled-bg)',   color: 'var(--status-cancelled-fg)' },
    completed:   { background: 'var(--status-available-bg)',   color: 'var(--status-available-fg)' },
    airbnb:      { background: 'var(--airbnb-bg)',             color: 'var(--airbnb-fg)' },
    agoda:       { background: 'var(--agoda-bg)',              color: 'var(--agoda-fg)' },
    direct:      { background: 'var(--direct-bg)',             color: 'var(--direct-fg)' },
  }
  const s = styles[variant] ?? { background: 'var(--surface)', color: 'var(--text-2)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: large ? '4px 12px' : '2px 8px',
      borderRadius: 'var(--radius-pill)',
      fontSize: large ? 13 : 12, fontWeight: 500, lineHeight: '18px',
      whiteSpace: 'nowrap', ...s,
    }}>
      {children}
    </span>
  )
}

function DetailRow({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
      <span style={{ fontSize: 11, color: 'var(--text-3)', fontWeight: 500, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
        {label}
      </span>
      {children}
    </div>
  )
}

export default async function BookingDetailPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: booking, error } = await supabase
    .from('bookings')
    .select('*, rooms(*), guests(*)')
    .eq('id', params.id)
    .single()

  if (error || !booking) notFound()

  const room = booking.rooms as any
  const guest = booking.guests as any
  const shortId = booking.id.slice(0, 8).toUpperCase()

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 24 }}>
      {/* TopBar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)',
        margin: '-28px -32px 0', padding: '0 32px',
        height: 'var(--topbar-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Detail Pemesanan</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
            {shortId} · {guest?.name ?? 'Tamu ' + SOURCE_LABEL[booking.source]}
          </p>
        </div>
        <Link href="/admin/booking/baru" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 'var(--radius)',
          background: 'var(--surface)', color: 'var(--text-1)',
          border: '1px solid var(--border)', fontSize: 13, fontWeight: 500,
        }}>
          + Buat Pesanan
        </Link>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)', display: 'flex', flexDirection: 'column', gap: 24 }}>
        {/* Breadcrumb */}
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-3)' }}>
          <Link href="/admin" style={{ cursor: 'pointer', color: 'var(--text-2)' }}>Beranda</Link>
          <span>›</span>
          <Link href="/admin/booking" style={{ cursor: 'pointer', color: 'var(--text-2)' }}>Pemesanan</Link>
          <span>›</span>
          <span style={{ fontFamily: 'var(--font-mono)' }}>{shortId}</span>
        </div>

        {/* Two-column layout */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20, alignItems: 'start' }}>
          {/* Left — Booking info */}
          <div style={{
            background: '#fff', border: '1px solid var(--border)',
            borderRadius: 'var(--radius-lg)', padding: 24,
            display: 'flex', flexDirection: 'column', gap: 20,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <Badge variant={booking.status} large>{STATUS_LABEL[booking.status] ?? booking.status}</Badge>
              <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-3)' }}>{shortId}</span>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <DetailRow label="Kamar">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 20, fontWeight: 500, color: 'var(--text-1)' }}>
                    {room?.room_number}
                  </span>
                  <span style={{ fontSize: 14, color: 'var(--text-2)' }}>{room?.room_type}</span>
                </div>
              </DetailRow>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DetailRow label="Check-in">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>
                    {formatDate(booking.check_in)}
                  </span>
                </DetailRow>
                <DetailRow label="Check-out">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>
                    {formatDate(booking.check_out)}
                  </span>
                </DetailRow>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <DetailRow label="Durasi">
                  <span style={{ fontSize: 14, color: 'var(--text-1)' }}>{booking.nights} malam</span>
                </DetailRow>
                <DetailRow label="Total Harga">
                  <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--accent)' }}>
                    {booking.total_price ? formatRupiah(booking.total_price) : '—'}
                  </span>
                </DetailRow>
              </div>

              <DetailRow label="Sumber">
                <Badge variant={booking.source}>{SOURCE_LABEL[booking.source] ?? booking.source}</Badge>
              </DetailRow>
            </div>

            <div style={{ height: 1, background: 'var(--border-subtle)' }} />

            <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Catatan</label>
              <div style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: 'var(--radius)', padding: '8px 10px',
                fontSize: 13, color: booking.notes ? 'var(--text-1)' : 'var(--text-3)',
                minHeight: 72, lineHeight: 1.5,
              }}>
                {booking.notes || 'Tidak ada catatan.'}
              </div>
            </div>
          </div>

          {/* Right — Guest info + Payment */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Guest info */}
            <div style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 24,
              display: 'flex', flexDirection: 'column', gap: 20,
            }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Data Tamu</span>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />

              {!guest ? (
                <div style={{
                  background: 'var(--surface)', borderRadius: 'var(--radius)',
                  padding: 16, display: 'flex', flexDirection: 'column',
                  gap: 8, alignItems: 'center', textAlign: 'center',
                }}>
                  <span style={{ fontSize: 13, color: 'var(--text-2)' }}>Data tamu belum diisi</span>
                  <span style={{ fontSize: 12, color: 'var(--text-3)' }}>
                    Pesanan dari {SOURCE_LABEL[booking.source]} — lengkapi data secara manual jika diperlukan.
                  </span>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    { label: 'Nama Lengkap', value: guest.name, mono: false },
                    { label: 'Nomor HP', value: guest.phone ?? '—', mono: true },
                    { label: 'Email', value: guest.email ?? '—', mono: false },
                    { label: 'Nomor KTP / Identitas', value: guest.id_number ?? '—', mono: true },
                  ].map(({ label, value, mono }) => (
                    <div key={label} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>{label}</label>
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '7px 10px',
                        fontSize: 13, color: value === '—' ? 'var(--text-3)' : 'var(--text-1)',
                        fontFamily: mono ? 'var(--font-mono)' : 'var(--font-sans)',
                      }}>
                        {value}
                      </div>
                    </div>
                  ))}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Dewasa</label>
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '7px 10px',
                        fontSize: 13, color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
                      }}>
                        {booking.adult_count} orang
                      </div>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Anak-anak</label>
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '7px 10px',
                        fontSize: 13, color: 'var(--text-1)', fontFamily: 'var(--font-mono)',
                      }}>
                        {booking.child_count} orang
                      </div>
                    </div>
                  </div>
                  {booking.source_referral && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                      <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Mengetahui dari</label>
                      <div style={{
                        background: 'var(--surface)', border: '1px solid var(--border)',
                        borderRadius: 'var(--radius)', padding: '7px 10px',
                        fontSize: 13, color: 'var(--text-1)',
                      }}>
                        {booking.source_referral}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Payment info */}
            <div style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: 24,
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Pembayaran</span>
                <span style={{
                  display: 'inline-flex', alignItems: 'center',
                  padding: '2px 8px', borderRadius: 'var(--radius-pill)',
                  fontSize: 12, fontWeight: 500,
                  background: booking.payment_status === 'paid'
                    ? 'var(--status-available-bg)' : 'var(--status-pending-bg)',
                  color: booking.payment_status === 'paid'
                    ? 'var(--status-available-fg)' : 'var(--status-pending-fg)',
                }}>
                  {booking.payment_status === 'paid' ? 'Lunas' : booking.payment_status === 'dp_paid' ? 'DP Dibayar' : 'Belum Bayar'}
                </span>
              </div>
              <div style={{ height: 1, background: 'var(--border-subtle)' }} />
              {booking.payment_proof_url ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <label style={{ fontSize: 12, color: 'var(--text-2)', fontWeight: 500 }}>Bukti Transfer</label>
                  <a
                    href={booking.payment_proof_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      display: 'inline-flex', alignItems: 'center', gap: 6,
                      padding: '7px 12px', borderRadius: 'var(--radius)',
                      border: '1px solid var(--border)', background: 'var(--surface)',
                      fontSize: 12, color: 'var(--accent)', fontWeight: 500,
                      width: 'fit-content',
                    }}
                  >
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3" />
                    </svg>
                    Lihat Bukti
                  </a>
                </div>
              ) : (
                <p style={{ fontSize: 13, color: 'var(--text-3)', margin: 0 }}>Belum ada bukti pembayaran.</p>
              )}
            </div>
          </div>
        </div>

        <BookingActions booking={booking} />
      </div>
    </div>
  )
}
