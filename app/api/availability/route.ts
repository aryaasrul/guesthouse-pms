import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/availability?property_id=xxx&check_in=2026-05-01&check_out=2026-05-03
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('property_id')
  const checkIn = searchParams.get('check_in')
  const checkOut = searchParams.get('check_out')

  if (!propertyId || !checkIn || !checkOut) {
    return NextResponse.json({ error: 'property_id, check_in, check_out wajib diisi' }, { status: 400 })
  }

  const supabase = createClient()
  const { data, error } = await supabase.rpc('get_available_rooms', {
    p_property_id: propertyId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
