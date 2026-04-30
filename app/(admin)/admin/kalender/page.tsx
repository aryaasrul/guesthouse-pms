import Link from 'next/link'
import { createClient } from '@/lib/supabase/server'
import KalenderView from '@/components/calendar/KalenderView'

export default async function KalenderPage({
  searchParams,
}: {
  searchParams: { month?: string; year?: string }
}) {
  const supabase = createClient()
  const { data: property } = await supabase.from('properties').select('id').single()

  const now = new Date()
  const month = parseInt(searchParams.month ?? String(now.getMonth() + 1))
  const year  = parseInt(searchParams.year  ?? String(now.getFullYear()))

  const startDate = `${year}-${String(month).padStart(2, '0')}-01`
  const endDate = new Date(year, month, 1).toISOString().split('T')[0]

  const [{ data: rooms }, { data: bookings }] = await Promise.all([
    supabase.from('rooms').select('*').eq('property_id', property?.id ?? '').eq('status', 'active').order('room_number'),
    supabase
      .from('bookings')
      .select('id, room_id, check_in, check_out, status, source, guests(name)')
      .eq('property_id', property?.id ?? '')
      .neq('status', 'cancelled')
      .lt('check_in', endDate)
      .gte('check_out', startDate),
  ])

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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Kalender</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Tampilan okupansi per kamar</p>
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

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <KalenderView rooms={rooms ?? []} bookings={bookings ?? []} month={month} year={year} />
      </div>
    </div>
  )
}
