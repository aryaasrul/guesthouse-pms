import { NextResponse } from 'next/server'
import { createServiceClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const {
    propertyId, roomId,
    guestName, guestPhone, guestAddress, ktpPhotoUrl,
    checkIn, checkOut,
    adultCount, childCount,
    specialRequests, sourceReferral, paymentProofUrl,
    totalPrice,
  } = body

  if (!propertyId || !roomId || !guestName || !guestPhone || !guestAddress || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'Data tidak lengkap' }, { status: 400 })
  }

  const supabase = createServiceClient()

  // Cek konflik booking
  const { data: bookingConflict } = await supabase
    .from('bookings')
    .select('id')
    .eq('room_id', roomId)
    .neq('status', 'cancelled')
    .lt('check_in', checkOut)
    .gt('check_out', checkIn)
    .limit(1)
    .maybeSingle()

  if (bookingConflict) {
    return NextResponse.json(
      { error: 'Kamar tidak tersedia untuk tanggal yang dipilih. Silakan pilih tanggal lain.' },
      { status: 409 }
    )
  }

  // Cek blok ketersediaan (maintenance, dll)
  const { data: blockConflict } = await supabase
    .from('availability_blocks')
    .select('id')
    .eq('room_id', roomId)
    .lt('start_date', checkOut)
    .gt('end_date', checkIn)
    .limit(1)
    .maybeSingle()

  if (blockConflict) {
    return NextResponse.json(
      { error: 'Kamar tidak tersedia untuk tanggal yang dipilih. Silakan pilih tanggal lain.' },
      { status: 409 }
    )
  }

  // Buat data tamu
  const { data: guest, error: guestError } = await supabase
    .from('guests')
    .insert({
      property_id: propertyId,
      name: guestName,
      phone: guestPhone,
      address: guestAddress,
      ktp_photo_url: ktpPhotoUrl ?? null,
    })
    .select()
    .single()

  if (guestError) {
    return NextResponse.json({ error: guestError.message }, { status: 400 })
  }

  // Buat booking
  const { data: booking, error: bookingError } = await supabase
    .from('bookings')
    .insert({
      property_id: propertyId,
      room_id: roomId,
      guest_id: guest.id,
      check_in: checkIn,
      check_out: checkOut,
      source: 'direct',
      status: 'pending',
      total_price: totalPrice ?? null,
      adult_count: adultCount ?? 1,
      child_count: childCount ?? 0,
      notes: specialRequests ?? null,
      source_referral: sourceReferral ?? null,
      payment_proof_url: paymentProofUrl ?? null,
      payment_status: 'pending',
    })
    .select()
    .single()

  if (bookingError) {
    return NextResponse.json({ error: bookingError.message }, { status: 400 })
  }

  return NextResponse.json(booking, { status: 201 })
}
