import { NextResponse } from 'next/server'
import { createClient, createServiceClient } from '@/lib/supabase/server'
import { fetchAndParseIcal, toDateString } from '@/lib/ical/parser'
import type { IcalSource } from '@/types/database'

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
    .select('*')
    .eq('is_active', true)

  if (sourcesError) {
    return NextResponse.json({ error: sourcesError.message }, { status: 500 })
  }

  const results = await Promise.allSettled(
    (sources ?? []).map((source) => syncSource(supabase, source))
  )

  const summary = results.map((r, i) => ({
    source_id: sources![i].id,
    ...(r.status === 'fulfilled'
      ? r.value
      : { events_found: 0, events_inserted: 0, events_updated: 0, error: String((r as PromiseRejectedResult).reason) }),
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

    const sourcesQuery = source_id
      ? supabase.from('ical_sources').select('*').eq('is_active', true).eq('id', source_id)
      : supabase.from('ical_sources').select('*').eq('is_active', true)

    const { data: sources, error: sourcesError } = await sourcesQuery
    if (sourcesError) return NextResponse.json({ error: sourcesError.message }, { status: 500 })

    const results = await Promise.allSettled(
      (sources ?? []).map((source) => syncSource(supabase, source))
    )

    const summary = (sources ?? []).map((source, i) => {
      const r = results[i]
      return {
        source_id: source.id,
        ...(r.status === 'fulfilled'
          ? r.value
          : { events_found: 0, events_inserted: 0, events_updated: 0, error: String((r as PromiseRejectedResult).reason) }),
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
  source: IcalSource,
): Promise<SyncResult> {
  let eventsFound = 0
  let eventsInserted = 0
  let eventsUpdated = 0
  let syncError: string | null = null

  try {
    const events = await fetchAndParseIcal(source.ical_url)
    eventsFound = events.length

    if (events.length > 0) {
      // Batch lookup: 1 query instead of N queries
      const uids = events.map((e) => e.uid)
      const { data: existingBookings } = await supabase
        .from('bookings')
        .select('id, check_in, check_out, external_uid')
        .eq('property_id', source.property_id)
        .eq('room_id', source.room_id)
        .in('external_uid', uids)

      const existingMap = new Map(
        (existingBookings ?? []).map((b) => [b.external_uid!, b])
      )

      type InsertRow = {
        property_id: string; room_id: string; check_in: string; check_out: string
        source: 'direct' | 'airbnb' | 'agoda'; external_uid: string; status: 'confirmed'; notes: string | null
      }
      const toInsert: InsertRow[] = []
      const toUpdate: { id: string; check_in: string; check_out: string }[] = []

      for (const event of events) {
        const checkIn  = toDateString(event.start)
        const checkOut = toDateString(event.end)
        const existing = existingMap.get(event.uid)

        if (!existing) {
          toInsert.push({
            property_id: source.property_id,
            room_id: source.room_id,
            check_in: checkIn,
            check_out: checkOut,
            source: (source.platform === 'other' ? 'direct' : source.platform) as 'direct' | 'airbnb' | 'agoda',
            external_uid: event.uid,
            status: 'confirmed',
            notes: event.summary || null,
          })
        } else if (existing.check_in !== checkIn || existing.check_out !== checkOut) {
          toUpdate.push({ id: existing.id, check_in: checkIn, check_out: checkOut })
        }
      }

      if (toInsert.length > 0) {
        await supabase.from('bookings').insert(toInsert)
        eventsInserted = toInsert.length
      }

      if (toUpdate.length > 0) {
        await Promise.all(
          toUpdate.map((u) =>
            supabase
              .from('bookings')
              .update({ check_in: u.check_in, check_out: u.check_out })
              .eq('id', u.id)
          )
        )
        eventsUpdated = toUpdate.length
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
