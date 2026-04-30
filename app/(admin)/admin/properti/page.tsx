import { createClient } from '@/lib/supabase/server'
import PropertyEditForm from '@/components/admin/PropertyEditForm'

export default async function PropertiPage() {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('*').single()

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Properti</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>
            Info & foto yang ditampilkan di halaman publik
          </p>
        </div>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        {property ? (
          <PropertyEditForm property={property} />
        ) : (
          <p style={{ fontSize: 13, color: 'var(--text-3)' }}>Properti tidak ditemukan.</p>
        )}
      </div>
    </div>
  )
}
