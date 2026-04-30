import { createClient } from '@/lib/supabase/server'
import Link from 'next/link'

function formatRupiah(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function Badge({ variant, children }: { variant: string; children: React.ReactNode }) {
  const styles: Record<string, { background: string; color: string }> = {
    active:      { background: 'var(--status-available-bg)',   color: 'var(--status-available-fg)' },
    maintenance: { background: 'var(--status-maintenance-bg)', color: 'var(--status-maintenance-fg)' },
    inactive:    { background: 'var(--status-cancelled-bg)',   color: 'var(--status-cancelled-fg)' },
  }
  const s = styles[variant] ?? { background: 'var(--surface)', color: 'var(--text-2)' }
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center',
      padding: '2px 8px', borderRadius: 'var(--radius-pill)',
      fontSize: 12, fontWeight: 500, lineHeight: '18px', ...s,
    }}>{children}</span>
  )
}

const STATUS_LABEL: Record<string, string> = {
  active: 'Aktif', maintenance: 'Perawatan', inactive: 'Nonaktif',
}

export default async function KamarPage() {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()
  const { data: rooms } = await supabase
    .from('rooms').select('*')
    .eq('property_id', property?.id ?? '').order('room_number')

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Paket Sewa</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{rooms?.length ?? 0} paket terdaftar</p>
        </div>
        <Link href="/admin/kamar/baru" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 'var(--radius)',
          background: 'var(--accent)', color: '#fff',
          border: 'none', fontSize: 13, fontWeight: 500,
        }}>
          + Tambah Paket
        </Link>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Kode', 'Nama Paket', 'Maks. Tamu', 'Harga Weekday', 'Harga Weekend', 'Status', ''].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!rooms || rooms.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Belum ada paket. Tambah paket sewa pertama.
                  </td>
                </tr>
              ) : (
                rooms.map((room, i) => (
                  <tr key={room.id}
                    className="table-row-hover"
                    style={{ background: i % 2 !== 0 ? 'rgba(242,240,236,0.5)' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 14, fontWeight: 500, color: 'var(--text-1)' }}>
                      {room.room_number}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{room.room_type}</td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>{room.capacity} orang</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {formatRupiah(room.price_weekday)}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {formatRupiah(room.price_weekend)}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Badge variant={room.status}>{STATUS_LABEL[room.status] ?? room.status}</Badge>
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <Link href={`/admin/kamar/${room.id}`} style={{ fontSize: 12, color: 'var(--accent)' }}>
                        Edit →
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
