import { createClient } from '@/lib/supabase/server'
import BookingForm from '@/components/booking/BookingForm'

export default async function BookingBaruPage() {
  const supabase = createClient()

  const { data: property } = await supabase.from('properties').select('id').single()

  const [{ data: rooms }, { data: existingBookings }] = await Promise.all([
    supabase
      .from('rooms')
      .select('id, room_number, room_type, price_weekday, price_weekend')
      .eq('property_id', property?.id ?? '')
      .eq('status', 'active')
      .order('room_number'),
    supabase
      .from('bookings')
      .select('room_id, check_in, check_out')
      .eq('property_id', property?.id ?? '')
      .neq('status', 'cancelled'),
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
          <h1 style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', lineHeight: 1.2 }}>Buat Pesanan</h1>
          <p style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 1 }}>Input manual via WhatsApp / telepon</p>
        </div>
      </div>

      <div style={{ paddingTop: 'var(--topbar-height)' }}>
        <BookingForm
          propertyId={property?.id ?? ''}
          rooms={rooms ?? []}
          existingBookings={existingBookings ?? []}
        />
      </div>
    </div>
  )
}
