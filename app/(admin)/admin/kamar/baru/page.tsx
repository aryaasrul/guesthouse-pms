import { createClient } from '@/lib/supabase/server'
import KamarBaruForm from '@/components/admin/KamarBaruForm'
import Link from 'next/link'

export default async function KamarBaruPage() {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Tambah Paket Sewa</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Buat paket baru yang bisa dipesan tamu</p>
        </div>
        <Link href="/admin/kamar" style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          padding: '7px 14px', borderRadius: 'var(--radius)',
          background: 'var(--surface)', color: 'var(--text-1)',
          border: '1px solid var(--border)', fontSize: 13, fontWeight: 500,
        }}>
          ← Kembali
        </Link>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <KamarBaruForm propertyId={property?.id ?? ''} />
      </div>
    </div>
  )
}
