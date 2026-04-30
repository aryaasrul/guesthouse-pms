import { createClient } from '@/lib/supabase/server'
import SyncManager from '@/components/admin/SyncManager'

export default async function SinkronisasiPage() {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()

  const [{ data: sources }, { data: logs }, { data: rooms }] = await Promise.all([
    supabase
      .from('ical_sources')
      .select('*, rooms(room_number, room_type)')
      .eq('property_id', property?.id ?? '')
      .order('platform'),
    supabase
      .from('sync_logs')
      .select('*, ical_sources(platform, room_id, rooms(room_number))')
      .eq('property_id', property?.id ?? '')
      .order('synced_at', { ascending: false })
      .limit(20),
    supabase
      .from('rooms')
      .select('id, room_number, room_type')
      .eq('property_id', property?.id ?? '')
      .eq('status', 'active')
      .order('room_number'),
  ])

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Sinkronisasi</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Kelola koneksi Airbnb &amp; Agoda</p>
        </div>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <SyncManager
          propertyId={property?.id ?? ''}
          sources={sources ?? []}
          logs={logs ?? []}
          rooms={rooms ?? []}
        />
      </div>
    </div>
  )
}
