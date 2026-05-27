-- Toasting — Seed for the pilot tenant.
-- Creates the restaurant group, the 9 venues, and the "Friends" tier (10%).
-- The 10th venue can be added later from the admin panel.

insert into tenants (slug, name)
values ('grupo-piloto', 'Grupo Piloto')
on conflict (slug) do nothing;

with t as (select id from tenants where slug = 'grupo-piloto')
insert into venues (tenant_id, slug, name)
select t.id, v.slug, v.name from t,
  (values
    ('giancarlo',       'Giancarlo'),
    ('quartinho',       'Quartinho'),
    ('dainer',          'Dainer'),
    ('pope',            'Pope'),
    ('chanchada',       'Chanchada'),
    ('guadalupe',       'Guadalupe'),
    ('cafe-18-forte',   'Café 18 do Forte'),
    ('deja-vu',         'Deja Vu'),
    ('fatchia',         'Fatchia')
  ) as v(slug, name)
on conflict do nothing;

with t as (select id from tenants where slug = 'grupo-piloto')
insert into tiers (tenant_id, slug, name, discount_percent, max_uses_per_day, color)
select t.id, 'amigos', 'Amigos', 10, 1, '#F2E5A8' from t
on conflict do nothing;
