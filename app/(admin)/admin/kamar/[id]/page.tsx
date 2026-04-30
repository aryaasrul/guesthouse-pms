import { createClient } from '@/lib/supabase/server'
import { notFound } from 'next/navigation'
import KamarEditForm from '@/components/admin/KamarEditForm'
import Link from 'next/link'

export default async function KamarEditPage({ params }: { params: { id: string } }) {
  const supabase = createClient()

  const { data: room, error } = await supabase
    .from('rooms')
    .select('*')
    .eq('id', params.id)
    .single()

  if (error || !room) notFound()

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>
            Edit Paket — {room.room_type}
          </h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Kode: {room.room_number}</p>
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
        <KamarEditForm room={room} />
      </div>
    </div>
  )
}
