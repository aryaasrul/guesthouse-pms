-- Move pricing from rooms to property level (whole-house rental model)
alter table properties
  add column if not exists price_weekday int not null default 0,
  add column if not exists price_weekend int not null default 0;

-- Seed from existing room data if present
update properties p
set
  price_weekday = coalesce((
    select r.price_weekday from rooms r
    where r.property_id = p.id and r.status = 'active'
    order by r.room_number limit 1
  ), 0),
  price_weekend = coalesce((
    select r.price_weekend from rooms r
    where r.property_id = p.id and r.status = 'active'
    order by r.room_number limit 1
  ), 0)
where price_weekday = 0;
