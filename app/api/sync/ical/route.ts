import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchAndParseIcal, toDateString } from '@/lib/ical/parser'

// Vercel Cron: dipanggil setiap 30 menit via GET
export async function GET(request: Request) {
  const authHeader = request.headers.get('authorization')
  if (
    process.env.CRON_SECRET &&
    authHeader !== `Bearer ${process.env.CRON_SECRET}`
  ) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const supabase = createServiceClient()

  const { data: sources, error: sourcesError } = await supabase
    .from('ical_sources')
    .select('*, rooms(property_id)')
    .eq('is_active', true)

  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (sources ?? []).map((source) => syncSource(supabase, source))
  )

  const summary = results.map((r, i) => ({
    source_id: sources![i].id,
    ...(r.status === 'fulfilled' ? r.value : { events_found: 0, events_inserted: 0, events_updated: 0, error: String((r as PromiseRejectedResult).reason) }),
  }))

  return NextResponse.json({ synced: summary.length, summary })
}

// Manual sync: dipanggil oleh admin via tombol "Sync Sekarang"
export async function POST(request: Request) {
  try {
    const authSupabase = createClient()
    const { data: { user } } = await authSupabase.auth.getUser()
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

    const body = await request.json().catch(() => ({}))
    const source_id = typeof body.source_id === 'string' ? body.source_id : undefined

    const supabase = createServiceClient()

    // Build query — avoid let reassignment to keep types stable
    const sourcesQuery = source_id
      ? supabase.from('ical_sources').select('*, rooms(property_id)').eq('is_active', true).eq('id', source_id)
      : supabase.from('ical_sources').select('*, rooms(property_id)').eq('is_active', true)

    const { data: sources, error: sourcesError } = await sourcesQuery
    if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 })

    const results = await Promise.allSettled(
      (sources ?? []).map((source) => syncSource(supabase, source))
    )

    const summary = (sources ?? []).map((source, i) => {
      const r = results[i]
      return {
        source_id: source.id,
        ...(r.status === 'fulfilled' ? r.value : {
          events_found: 0, events_inserted: 0, events_updated: 0,
          error: String((r as PromiseRejectedResult).reason),
        }),
      }
    })

    return NextResponse.json({ synced: summary.length, summary })
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error('[POST /api/sync/ical]', message)
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

interface SyncResult {
  events_found: number
  events_inserted: number
  events_updated: number
  error: string | null
}

async function syncSource(
  supabase: ReturnType<typeof createServiceClient>,
  source: any,
): Promise<SyncResult> {
  let eventsFound = 0
  let eventsInserted = 0
  let eventsUpdated = 0
  let syncError: string | null = null

  try {
    const events = await fetchAndParseIcal(source.ical_url)
    eventsFound = events.length

    for (const event of events) {
      const checkIn  = toDateString(event.start)
      const checkOut = toDateString(event.end)

      const { data: existing } = await supabase
        .from('bookings')
        .select('id, check_in, check_out')
        .eq('property_id', source.property_id)
        .eq('external_uid', event.uid)
        .maybeSingle()

      if (!existing) {
        await supabase.from('bookings').insert({
          property_id: source.property_id,
          room_id: source.room_id,
          check_in: checkIn,
          check_out: checkOut,
          source: source.platform === 'other' ? 'direct' : source.platform,
          external_uid: event.uid,
          status: 'confirmed',
          notes: event.summary,
        })
        eventsInserted++
      } else if (existing.check_in !== checkIn || existing.check_out !== checkOut) {
        await supabase
          .from('bookings')
          .update({ check_in: checkIn, check_out: checkOut })
          .eq('id', existing.id)
        eventsUpdated++
      }
    }

    await supabase
      .from('ical_sources')
      .update({ last_synced_at: new Date().toISOString() })
      .eq('id', source.id)
  } catch (err) {
    syncError = err instanceof Error ? err.message : String(err)
  }

  await supabase.from('sync_logs').insert({
    property_id: source.property_id,
    source_id: source.id,
    events_found: eventsFound,
    events_inserted: eventsInserted,
    events_updated: eventsUpdated,
    error: syncError,
  })

  return { events_found: eventsFound, events_inserted: eventsInserted, events_updated: eventsUpdated, error: syncError }
}
