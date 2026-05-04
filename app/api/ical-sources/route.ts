import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'

function isHttpsUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false
  try {
    return new URL(value).protocol === 'https:'
  } catch {
    return false
  }
}

async function parseBody(request: Request): Promise<Record<string, unknown> | null> {
  try {
    return await request.json()
  } catch {
    return null
  }
}

export async function POST(request: Request) {
  const body = await parseBody(request)
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { property_id, room_id, platform, ical_url } = body

  if (!property_id || !room_id || !platform) {
    return NextResponse.json({ error: 'property_id, room_id, dan platform wajib diisi' }, { status: 400 })
  }

  if (!isHttpsUrl(ical_url)) {
    return NextResponse.json({ error: 'ical_url harus berupa URL HTTPS yang valid' }, { status: 400 })
  }

  const validPlatforms = ['airbnb', 'agoda', 'other']
  if (!validPlatforms.includes(platform as string)) {
    return NextResponse.json({ error: 'platform harus airbnb, agoda, atau other' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ical_sources')
    .insert({
      property_id: property_id as string,
      room_id: room_id as string,
      platform: platform as 'airbnb' | 'agoda' | 'other',
      ical_url: ical_url as string,
    })
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data, { status: 201 })
}

export async function PATCH(request: Request) {
  const body = await parseBody(request)
  if (!body) return NextResponse.json({ error: 'Body tidak valid' }, { status: 400 })

  const { id, ical_url, is_active } = body

  if (!id || typeof id !== 'string') {
    return NextResponse.json({ error: 'id wajib diisi' }, { status: 400 })
  }

  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const hasUrl    = typeof ical_url === 'string'
  const hasActive = typeof is_active === 'boolean'

  if (!hasUrl && !hasActive) {
    return NextResponse.json({ error: 'Tidak ada field yang diupdate' }, { status: 400 })
  }

  if (hasUrl && !isHttpsUrl(ical_url)) {
    return NextResponse.json({ error: 'ical_url harus berupa URL HTTPS yang valid' }, { status: 400 })
  }

  const { data, error } = await supabase
    .from('ical_sources')
    .update({
      ...(hasUrl    ? { ical_url: ical_url as string } : {}),
      ...(hasActive ? { is_active: is_active as boolean } : {}),
    })
    .eq('id', id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
