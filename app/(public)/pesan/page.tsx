import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import PublicBookingForm from '@/components/booking/PublicBookingForm'

function fmt(n: number) {
  return 'Rp ' + n.toLocaleString('id-ID')
}

function fmtDate(str: string) {
  if (!str) return '—'
  return new Date(str).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })
}

interface SearchParams {
  room_id?: string
  check_in?: string
  check_out?: string
  adults?: string
}

export default async function PesanPage({ searchParams }: { searchParams: SearchParams }) {
  const supabase = createClient()

  if (!searchParams.room_id) redirect('/')

  const { data: room } = await supabase
    .from('rooms')
    .select('id, room_number, room_type, capacity, price_weekday, price_weekend, property_id')
    .eq('id', searchParams.room_id)
    .eq('status', 'active')
    .single()

  if (!room) redirect('/')

  const { data: property } = await supabase
    .from('properties')
    .select('id, name, check_in_time, check_out_time')
    .eq('id', room.property_id)
    .single()

  if (!property) redirect('/')

  const checkIn  = searchParams.check_in  ?? ''
  const checkOut = searchParams.check_out ?? ''

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', fontFamily: 'var(--font-sans)' }}>
      {/* Header */}
      <header style={{
        borderBottom: '1px solid var(--border)',
        padding: '0 32px', height: 56,
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--bg)', position: 'sticky', top: 0, zIndex: 10,
      }}>
        <Link href="/" style={{
          fontSize: 14, fontWeight: 600, color: 'var(--text-1)',
          letterSpacing: '-0.01em', textDecoration: 'none',
        }}>
          {property.name}
        </Link>
        <Link href="/" style={{ fontSize: 13, color: 'var(--text-3)', textDecoration: 'none' }}>
          ← Kembali
        </Link>
      </header>

      <main style={{ maxWidth: 600, margin: '0 auto', padding: '32px 24px 80px' }}>

        {/* Ringkasan paket yang dipilih */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '16px 20px',
          marginBottom: 24,
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 16,
        }}>
          <div>
            <div style={{ fontSize: 15, fontWeight: 500, color: 'var(--text-1)', marginBottom: 3 }}>
              {room.room_type}
            </div>
            <div style={{ fontSize: 12, color: 'var(--text-3)' }}>
              {property.name}
              {checkIn && checkOut && (
                <> · {fmtDate(checkIn)} – {fmtDate(checkOut)}</>
              )}
            </div>
          </div>
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div style={{
              fontFamily: 'var(--font-mono)', fontSize: 15,
              fontWeight: 500, color: 'var(--text-1)',
            }}>
              {fmt(room.price_weekday)}
            </div>
            <div style={{ fontSize: 11, color: 'var(--text-3)' }}>/malam</div>
          </div>
        </div>

        {/* Form booking */}
        <div style={{
          background: '#fff', border: '1px solid var(--border)',
          borderRadius: 'var(--radius-lg)', padding: '24px',
        }}>
          <div style={{ marginBottom: 20 }}>
            <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--text-1)' }}>Form Pemesanan</div>
            <div style={{ fontSize: 12, color: 'var(--text-3)', marginTop: 2 }}>
              Isi data dengan benar sesuai KTP
            </div>
          </div>
          <PublicBookingForm
            roomId={room.id}
            propertyId={room.property_id}
            priceWeekday={room.price_weekday}
            priceWeekend={room.price_weekend}
            roomNumber={room.room_type}
            capacity={room.capacity}
            initialCheckIn={checkIn}
            initialCheckOut={checkOut}
          />
        </div>
      </main>
    </div>
  )
}
