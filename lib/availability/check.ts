import type { SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '@/types/database'

type Client = SupabaseClient<Database>

export async function getAvailableRooms(
  supabase: Client,
  propertyId: string,
  checkIn: string,
  checkOut: string
) {
  const { data, error } = await supabase.rpc('get_available_rooms', {
    p_property_id: propertyId,
    p_check_in: checkIn,
    p_check_out: checkOut,
  })

  if (error) throw error
  return data
}

/** Cek apakah extend checkout akan konflik dengan booking lain */
export async function checkExtendConflict(
  supabase: Client,
  bookingId: string,
  roomId: string,
  propertyId: string,
  newCheckOut: string
) {
  const { data, error } = await supabase
    .from('bookings')
    .select('id, guest_id, check_in, check_out, guests(name)')
    .eq('room_id', roomId)
    .eq('property_id', propertyId)
    .neq('id', bookingId)
    .neq('status', 'cancelled')
    .lt('check_in', newCheckOut)
    .returns<Array<{ id: string; check_in: string; check_out: string; guests: { name: string } | null }>>()

  if (error) throw error
  return data ?? []
}
