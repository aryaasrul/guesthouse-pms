import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

// GET /api/bookings?property_id=xxx&status=confirmed&source=airbnb
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('property_id')
  const status = searchParams.get('status')
  const source = searchParams.get('source')

  if (!propertyId) {
    return NextResponse.json({ error: 'property_id wajib diisi' }, { status: 400 })
  }

  const supabase = createClient()
  let query = supabase
    .from('bookings')
    .select('*, rooms(room_number, room_type), guests(name, phone)')
    .eq('property_id', propertyId)
    .order('check_in', { ascending: false })

  if (status) query = query.eq('status', status as any)
  if (source) query = query.eq('source', source as any)

  const { data, error } = await query
  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}

// POST /api/bookings — buat booking baru
export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: property } = await supabase.from('properties').select('id').single()
  if (!property) return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })

  const { data, error } = await supabase
    .from('bookings')
    .insert({
      property_id: property.id,
      room_id: body.room_id,
      guest_id: body.guest_id ?? null,
      check_in: body.check_in,
      check_out: body.check_out,
      source: body.source ?? 'direct',
      status: body.status ?? 'confirmed',
      total_price: body.total_price ?? null,
      notes: body.notes ?? null,
      adult_count: body.adult_count ?? 1,
      child_count: body.child_count ?? 0,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}
