-- RPC: kamar tersedia untuk rentang tanggal tertentu
create or replace function get_available_rooms(
  p_property_id uuid,
  p_check_in    date,
  p_check_out   date
)
returns setof rooms
language sql
security definer
as $$
  select r.*
  from rooms r
  where r.property_id = p_property_id
    and r.status = 'active'
    and r.id not in (
      select room_id from bookings
      where property_id = p_property_id
        and status not in ('cancelled')
        and check_in  < p_check_out
        and check_out > p_check_in
    )
    and r.id not in (
      select room_id from availability_blocks
      where property_id = p_property_id
        and start_date < p_check_out
        and end_date   > p_check_in
    )
  order by r.room_number;
$$;
