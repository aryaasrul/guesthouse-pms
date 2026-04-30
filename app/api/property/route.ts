import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function GET() {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('properties')
    .select('*')
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: property } = await supabase.from('properties').select('id').single()
  if (!property) return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })

  const { data, error } = await supabase
    .from('properties')
    .update({
      name:           body.name,
      description:    body.description ?? null,
      address:        body.address ?? null,
      amenities:      Array.isArray(body.amenities) ? body.amenities : [],
      bedroom_count:  body.bedroom_count,
      bathroom_count: body.bathroom_count,
      max_guests:     body.max_guests,
      check_in_time:  body.check_in_time,
      check_out_time: body.check_out_time,
      photos:         Array.isArray(body.photos) ? body.photos : [],
      price_weekday:  body.price_weekday,
      price_weekend:  body.price_weekend,
    })
    .eq('id', property.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
