import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

const STATUS_LABEL: Record<string, string> = {
  pending: 'Pending', confirmed: 'Konfirmasi', active: 'Terisi',
  completed: 'Selesai', cancelled: 'Dibatalkan',
}
const SOURCE_LABEL: Record<string, string> = {
  airbnb: 'Airbnb', agoda: 'Agoda', direct: 'Direct',
}

function formatDate(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    active:    { background: 'var(--status-occupied-bg)',    color: 'var(--status-occupied-fg)' },
    confirmed: { background: 'var(--status-confirmed-bg)',   color: 'var(--status-confirmed-fg)' },
    pending:   { background: 'var(--status-pending-bg)',     color: 'var(--status-pending-fg)' },
    completed: { background: 'var(--status-available-bg)',   color: 'var(--status-available-fg)' },
    cancelled: { background: 'var(--status-cancelled-bg)',   color: 'var(--status-cancelled-fg)' },
    airbnb:    { background: 'var(--airbnb-bg)',             color: 'var(--airbnb-fg)' },
    agoda:     { background: 'var(--agoda-bg)',              color: 'var(--agoda-fg)' },
    direct:    { background: 'var(--direct-bg)',             color: 'var(--direct-fg)' },
  }
  const s = styles[variant] ?? { background: 'var(--surface)', color: 'var(--text-2)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 500, lineHeight: '18px',
      whiteSpace: 'nowrap', ...s,
    }}>{children}</span>
  )
}

export default async function BookingPage({
  searchParams,
}: {
  searchParams: { status?: string; source?: string }
}) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()

  let query = supabase
    .from('bookings')
    .select('*, rooms(room_number, room_type), guests(name)')
    .eq('property_id', property?.id ?? '')
    .order('check_in', { ascending: false })

  if (searchParams.status) query = query.eq('status', searchParams.status as any)
  if (searchParams.source) query = query.eq('source', searchParams.source as any)

  const { data: bookings } = await query

  const filters = [
    { href: '/admin/booking', label: 'Semua', active: !searchParams.status && !searchParams.source },
    { href: '/admin/booking?status=pending',   label: 'Pending',     active: searchParams.status === 'pending' },
    { href: '/admin/booking?status=confirmed', label: 'Konfirmasi',  active: searchParams.status === 'confirmed' },
    { href: '/admin/booking?status=active',    label: 'Terisi',      active: searchParams.status === 'active' },
    { href: '/admin/booking?status=completed', label: 'Selesai',     active: searchParams.status === 'completed' },
    { href: '/admin/booking?status=cancelled', label: 'Dibatalkan',  active: searchParams.status === 'cancelled' },
    { href: '/admin/booking?source=airbnb',    label: 'Airbnb',      active: searchParams.source === 'airbnb' },
    { href: '/admin/booking?source=agoda',     label: 'Agoda',       active: searchParams.source === 'agoda' },
    { href: '/admin/booking?source=direct',    label: 'Direct',      active: searchParams.source === 'direct' },
  ]

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Pemesanan</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
            {bookings?.length ?? 0} pesanan
            {searchParams.status ? ` · ${STATUS_LABEL[searchParams.status] ?? searchParams.status}` : ''}
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

      <div style={{ paddingTop: 'var(--topbar-height)', display: 'flex', flexDirection: 'column', gap: 20 }}>
        {/* Filters */}
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {filters.map(f => (
            <Link key={f.href} href={f.href} style={{
              padding: '4px 12px', borderRadius: 'var(--radius-pill)',
              fontSize: 12, fontWeight: 500,
              background: f.active ? 'var(--accent)' : 'var(--surface)',
              color: f.active ? '#fff' : 'var(--text-2)',
              border: f.active ? 'none' : '1px solid var(--border)',
              transition: 'background 100ms',
            }}>
              {f.label}
            </Link>
          ))}
        </div>

        {/* Table */}
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Nama Tamu', 'Kamar', 'Check-in', 'Check-out', 'Sumber', 'Status', 'Total', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!bookings || bookings.length === 0 ? (
                <tr>
                  <td colSpan={8} style={{ padding: '48px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Tidak ada pemesanan.
                  </td>
                </tr>
              ) : (
                bookings.map((b: any, i: number) => (
                  <tr key={b.id}
                    className="table-row-hover"
                    style={{ background: i % 2 !== 0 ? 'rgba(242,240,236,0.5)' : 'transparent', cursor: 'pointer' }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>
                      {b.guests?.name ?? <span style={{ color: 'var(--text-3)', fontStyle: 'italic', fontWeight: 400 }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                        {b.rooms?.room_number} <span style={{ color: 'var(--text-3)' }}>·</span> {b.rooms?.room_type}
                      </span>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {formatDate(b.check_in)}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {formatDate(b.check_out)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={b.source}>{SOURCE_LABEL[b.source] ?? b.source}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={b.status}>{STATUS_LABEL[b.status] ?? b.status}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {b.total_price ? formatRupiah(b.total_price) : '—'}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/booking/${b.id}`} style={{ fontSize: 12, color: 'var(--accent)' }}>
                        Detail →
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
