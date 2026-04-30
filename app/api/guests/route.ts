import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data: property } = await supabase.from('properties').select('id').single()
  if (!property) return NextResponse.json({ error: 'Properti tidak ditemukan' }, { status: 404 })

  const { data, error } = await supabase
    .from('guests')
    .insert({
      property_id: property.id,
      name: body.name,
      phone: body.phone ?? null,
      email: body.email ?? null,
      id_number: body.id_number ?? null,
      address: body.address ?? null,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const propertyId = searchParams.get('property_id')

  if (!propertyId) return NextResponse.json({ error: 'property_id wajib' }, { status: 400 })

  const supabase = createClient()
  const { data, error } = await supabase
    .from('guests')
    .select('*')
    .eq('property_id', propertyId)
    .order('name')

  if (error) return NextResponse.json({ error: error.message }, { status: 500 })
  return NextResponse.json(data)
}
