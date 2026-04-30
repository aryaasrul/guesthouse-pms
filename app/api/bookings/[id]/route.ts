import { NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { checkExtendConflict } from '@/lib/availability/check'

// GET /api/bookings/[id]
export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('bookings')
    .select('*, rooms(*), guests(*)')
    .eq('id', params.id)
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 404 })
  return NextResponse.json(data)
}

// PATCH /api/bookings/[id] — update status / extend checkout
export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  const body = await request.json()
  const supabase = createClient()

  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  // Jika extend check_out, cek konflik dulu
  if (body.check_out) {
    const { data: booking } = await supabase
      .from('bookings')
      .select('room_id, property_id')
      .eq('id', params.id)
      .single()

    if (booking) {
      const conflicts = await checkExtendConflict(
        supabase,
        params.id,
        booking.room_id,
        booking.property_id,
        body.check_out
      )
      if (conflicts.length > 0) {
        return NextResponse.json(
          { error: 'Konflik dengan booking lain', conflicts },
          { status: 409 }
        )
      }
    }
  }

  const { data, error } = await supabase
    .from('bookings')
    .update(body)
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}

// DELETE /api/bookings/[id] — cancel (soft delete via status)
export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const supabase = createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const { data, error } = await supabase
    .from('bookings')
    .update({ status: 'cancelled' })
    .eq('id', params.id)
    .select()
    .single()

  if (error) return NextResponse.json({ error: error.message }, { status: 400 })
  return NextResponse.json(data)
}
