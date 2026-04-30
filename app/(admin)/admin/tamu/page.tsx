import { createClient } from '@/lib/supabase/server'

function formatDate(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export default async function TamuPage() {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()
  const { data: guests } = await supabase
    .from('guests').select('*')
    .eq('property_id', property?.id ?? '').order('name')

  return (
    <div style={{ padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>
      {/* TopBar */}
      <div style={{
        position: 'sticky', top: 0, zIndex: 10,
        background: 'var(--bg)', borderBottom: '1px solid var(--border-subtle)',
        margin: '-28px -32px 0', padding: '0 32px',
        height: 'var(--topbar-height)',
        display: 'flex', alignItems: 'center',
      }}>
        <div>
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Tamu</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>{guests?.length ?? 0} tamu terdaftar</p>
        </div>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <div style={{ background: '#fff', border: '1px solid var(--border)', borderRadius: 'var(--radius-lg)', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                {['Nama', 'No. HP', 'Email', 'No. KTP', 'Terdaftar'].map((h, i) => (
                  <th key={i} style={{
                    padding: '10px 14px', textAlign: 'left',
                    fontSize: 11, fontWeight: 500, color: 'var(--text-3)',
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {!guests || guests.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '48px 14px', textAlign: 'center', fontSize: 13, color: 'var(--text-3)' }}>
                    Belum ada data tamu.
                  </td>
                </tr>
              ) : (
                guests.map((g, i) => (
                  <tr key={g.id}
                    className="table-row-hover"
                    style={{ background: i % 2 !== 0 ? 'rgba(242,240,236,0.5)' : 'transparent' }}
                  >
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>{g.name}</td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 12, color: 'var(--text-2)' }}>
                      {g.phone ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, color: 'var(--text-2)' }}>
                      {g.email ?? <span style={{ color: 'var(--text-3)' }}>—</span>}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'var(--font-mono)', fontSize: 11, color: 'var(--text-3)' }}>
                      {g.id_number ?? '—'}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 12, color: 'var(--text-3)' }}>
                      {formatDate(g.created_at)}
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
