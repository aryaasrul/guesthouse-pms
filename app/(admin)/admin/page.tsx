import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

const STATUS_LABEL: Record<string, string> = {
  available: 'Tersedia', occupied: 'Terisi', active: 'Terisi',
  checkout: 'Checkout', maintenance: 'Perawatan',
  confirmed: 'Konfirmasi', pending: 'Pending', cancelled: 'Dibatalkan',
}

const SOURCE_LABEL: Record<string, string> = {
  airbnb: 'Airbnb', agoda: 'Agoda', direct: 'Direct',
}

function formatDateShort(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
}

function formatDate(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    available:   { background: 'var(--status-available-bg)',   color: 'var(--status-available-fg)' },
    occupied:    { background: 'var(--status-occupied-bg)',    color: 'var(--status-occupied-fg)' },
    active:      { background: 'var(--status-occupied-bg)',    color: 'var(--status-occupied-fg)' },
    checkout:    { background: 'var(--status-checkout-bg)',    color: 'var(--status-checkout-fg)' },
    maintenance: { background: 'var(--status-maintenance-bg)', color: 'var(--status-maintenance-fg)' },
    confirmed:   { background: 'var(--status-confirmed-bg)',   color: 'var(--status-confirmed-fg)' },
    pending:     { background: 'var(--status-pending-bg)',     color: 'var(--status-pending-fg)' },
    cancelled:   { background: 'var(--status-cancelled-bg)',   color: 'var(--status-cancelled-fg)' },
    airbnb:      { background: 'var(--airbnb-bg)',             color: 'var(--airbnb-fg)' },
    agoda:       { background: 'var(--agoda-bg)',              color: 'var(--agoda-fg)' },
    direct:      { background: 'var(--direct-bg)',             color: 'var(--direct-fg)' },
  }
  const s = styles[variant] ?? { background: 'var(--surface)', color: 'var(--text-2)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 500, lineHeight: '18px',
      whiteSpace: 'nowrap', ...s,
    }}>
      {children}
    </span>
  )
}

function StatusDot({ status }: { status: string }) {
  const colors: Record<string, string> = {
    available: 'var(--status-available-fg)',
    occupied:  'var(--status-occupied-fg)',
    active:    'var(--status-occupied-fg)',
    checkout:  'var(--status-checkout-fg)',
    confirmed: 'var(--status-confirmed-fg)',
    pending:   'var(--status-pending-fg)',
    maintenance:'var(--status-maintenance-fg)',
  }
  return (
    <span style={{
      display: 'inline-block', width: 7, height: 7,
      borderRadius: '50%', background: colors[status] ?? 'var(--text-3)',
      flexShrink: 0,
    }} />
  )
}

export default async function DashboardPage() {
  const supabase = createClient()

  const { data: property } = await supabase.from('properties').select('*').single()
  const today = new Date().toISOString().split('T')[0]

  const [{ data: rooms }, { data: allBookings }, { data: syncSources }] = await Promise.all([
    supabase
      .from('rooms').select('*')
      .eq('property_id', property?.id ?? '').eq('status', 'active').order('room_number'),
    supabase
      .from('bookings')
      .select('*, rooms(room_number, room_type), guests(name)')
      .eq('property_id', property?.id ?? '')
      .neq('status', 'cancelled')
      .order('check_in'),
    supabase
      .from('ical_sources').select('platform, last_synced_at, is_active')
      .eq('property_id', property?.id ?? ''),
  ])

  // Derive room statuses
  const roomStatuses: Record<string, { status: string; guestName: string | null; checkOut: string | null }> = {}
  for (const room of rooms ?? []) {
    const booking = (allBookings ?? []).find(
      (b: any) => b.room_id === room.id && b.check_in <= today && b.check_out > today
    )
    if (!booking) {
      roomStatuses[room.id] = { status: 'available', guestName: null, checkOut: null }
    } else {
      const status = booking.check_out === today ? 'checkout' : (booking.status === 'active' ? 'occupied' : booking.status)
      roomStatuses[room.id] = {
        status,
        guestName: booking.guests?.name ?? null,
        checkOut: booking.check_out,
      }
    }
  }

  const totalRooms = rooms?.length ?? 0
  const occupied = Object.values(roomStatuses).filter(r => r.status === 'occupied').length
  const checkoutToday = Object.values(roomStatuses).filter(r => r.status === 'checkout').length
  const available = Object.values(roomStatuses).filter(r => r.status === 'available').length

  const thisMonth = today.slice(0, 7)
  const monthRevenue = (allBookings ?? [])
    .filter((b: any) => b.check_in?.startsWith(thisMonth))
    .reduce((s: number, b: any) => s + (b.total_price ?? 0), 0)

  const recentBookings = (allBookings ?? []).slice(0, 6)

  const airbnbSource = syncSources?.find(s => s.platform === 'airbnb')
  const agodaSource  = syncSources?.find(s => s.platform === 'agoda')

  const roomBgMap: Record<string, string> = {
    available:   'var(--bg)',
    occupied:    'var(--status-occupied-bg)',
    checkout:    'var(--status-checkout-bg)',
    confirmed:   'var(--status-confirmed-bg)',
    maintenance: 'var(--status-maintenance-bg)',
  }

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* TopBar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)',
        margin: '-28px -32px 0', padding: '0 32px',
        height: 'var(--topbar-height)',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
      }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Beranda</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
            {formatDate(today)}
          </p>
        </div>
        <Link
          href="/admin/booking/baru"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 14px', borderRadius: 'var(--radius)',
            background: 'var(--surface)', color: 'var(--text-1)',
            border: '1px solid var(--border)', fontSize: 13, fontWeight: 500,
            cursor: 'pointer', transition: 'background 120ms ease',
          }}
        >
          + Buat Pesanan
        </Link>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)', display: 'flex', flexDirection: 'column', gap: 28 }}>
        {/* Stat cards */}
        <div style={{ display: 'flex', gap: 14 }}>
          {[
            { label: 'Kamar Tersedia', value: available, sub: `dari ${totalRooms} total kamar`, accent: false },
            { label: 'Kamar Terisi', value: occupied, sub: 'tamu aktif hari ini', accent: true },
            { label: 'Checkout Hari Ini', value: checkoutToday, sub: 'perlu konfirmasi', accent: false },
            { label: 'Pendapatan Bulan Ini', value: formatRupiah(monthRevenue), sub: 'bulan berjalan', accent: false },
          ].map(({ label, value, sub, accent }) => (
            <div key={label} style={{
              background: '#fff', border: '1px solid var(--border)',
              borderRadius: 'var(--radius-lg)', padding: '20px 22px',
              flex: 1, minWidth: 180,
            }}>
              <div style={{ fontSize: 12, color: 'var(--text-3)', fontWeight: 500, letterSpacing: '0.01em', textTransform: 'uppercase', marginBottom: 10 }}>
                {label}
              </div>
              <div style={{
                fontSize: 26, fontWeight: 500, lineHeight: 1,
                color: accent ? 'var(--accent)' : 'var(--text-1)',
                fontFamily: 'var(--font-mono)', letterSpacing: '-0.02em',
              }}>
                {value}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 6 }}>{sub}</div>
            </div>
          ))}
        </div>

        {/* Room grid */}
        <div>
          <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.03em' }}>
            Status Kamar
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(155px, 1fr))', gap: 10 }}>
            {(rooms ?? []).map((room: any) => {
              const rs = roomStatuses[room.id]
              return (
                <div key={room.id} style={{
                  background: roomBgMap[rs?.status ?? 'available'] ?? 'var(--bg)',
                  border: '1px solid var(--border)',
                  borderRadius: 'var(--radius)',
                  padding: '12px 14px',
                  minHeight: 88,
                  cursor: 'pointer',
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <span style={{ fontFamily: 'var(--font-mono)', fontSize: 15, fontWeight: 500, color: 'var(--text-1)' }}>
                      {room.room_number}
                    </span>
                    <StatusDot status={rs?.status ?? 'available'} />
                  </div>
                  <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, marginBottom: 8 }}>{room.room_type}</div>
                  {rs?.guestName ? (
                    <>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-1)' }}>{rs.guestName}</div>
                      <div style={{ fontSize: 11, color: 'var(--text-3)', marginTop: 2, fontFamily: 'var(--font-mono)' }}>
                        s/d {formatDateShort(rs.checkOut ?? '')}
                      </div>
                    </>
                  ) : (
                    <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
                      {STATUS_LABEL[rs?.status ?? 'available']}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        {/* Booking table */}
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <h2 style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-2)', textTransform: 'uppercase', letterSpacing: '0.03em' }}>
              Pemesanan Mendatang
            </h2>
            <Link href="/admin/booking" style={{
              fontSize: 13, color: 'var(--text-2)', background: 'transparent',
              border: '1px solid transparent', padding: '5px 10px',
              borderRadius: 'var(--radius)', cursor: 'pointer',
            }}>
              Lihat semua →
            </Link>
          </div>

          <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                  {['Nama Tamu', 'Kamar', 'Masuk', 'Keluar', 'Sumber', 'Status'].map((h) => (
                    <th key={h} style={{
                      padding: '10px 14px', textAlign: 'left',
                      fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
                      textTransform: 'uppercase', letterSpacing: '0.04em', whiteSpace: 'nowrap',
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recentBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} style={{ padding: '32px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                      Belum ada pemesanan.
                    </td>
                  </tr>
                ) : (
                  recentBookings.map((b: any, i: number) => (
                    <tr
                      key={b.id}
                      style={{
                        background: i % 2 !== 0 ? 'rgba(242,240,236,0.5)' : 'transparent',
                      }}
                    >
                      <td style={{ padding: '10px 14px', fontSize: 13 }}>
                        <Link href={`/admin/booking/${b.id}`} style={{ display: 'block', color: 'inherit' }}>
                          {b.guests?.name ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                        </Link>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                          {b.rooms?.room_number}{' '}
                          <span style={{ color: 'var(--text-3)' }}>·</span>{' '}
                          {b.rooms?.room_type}
                        </span>
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                        {formatDateShort(b.check_in)}
                      </td>
                      <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                        {formatDateShort(b.check_out)}
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge variant={b.source}>{SOURCE_LABEL[b.source] ?? b.source}</Badge>
                      </td>
                      <td style={{ padding: '10px 14px' }}>
                        <Badge variant={b.status}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Footer: sync status */}
            <div style={{
              borderTop: '1px solid var(--border-subtle)',
              padding: '12px 14px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, fontSize: 12, color: 'var(--text-3)' }}>
                <span>iCal sync</span>
                {airbnbSource && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusDot status={airbnbSource.is_active ? 'available' : 'cancelled'} />
                    <span style={{ color: 'var(--text-2)' }}>Airbnb</span>
                  </span>
                )}
                {agodaSource && (
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <StatusDot status={agodaSource.is_active ? 'available' : 'cancelled'} />
                    <span style={{ color: 'var(--text-2)' }}>Agoda</span>
                  </span>
                )}
              </div>
              <Link href="/admin/sinkronisasi" style={{
                fontSize: 13, color: 'var(--text-2)', background: 'transparent',
                border: '1px solid transparent', padding: '5px 10px',
                borderRadius: 'var(--radius)', cursor: 'pointer',
              }}>
                Pengaturan sync
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
