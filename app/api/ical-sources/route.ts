import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

export async function POST(request: Request) {
  const body = await request.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('ical_sources')
    .insert({
      property_id: body.property_id,
      room_id: body.room_id,
      platform: body.platform,
      ical_url: body.ical_url,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await request.json()
  const { id, ical_url, is_active } = body

  if (!id) return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasUrl = typeof ical_url === 'string'
  const hasActive = typeof is_active === 'boolean'

  if (!hasUrl && !hasActive) {
    return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ical_sources')
    .update({
      ...(hasUrl ? { ical_url } : {}),
      ...(hasActive ? { is_active } : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
