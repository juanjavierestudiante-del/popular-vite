-- Menú de degustación de Popular Cocina Boliviana
-- Precio único: Bs. 89 por persona (entrada + plato fuerte + postre).

begin;

insert into public.menu (nombre, descripcion, precio, categoria, disponible, imagen_url)
select
  v.nombre, v.descripcion, v.precio, v.categoria, v.disponible, v.imagen_url
from (values
  ('Tucumana de Papalisa',
   'Ahogado de papalisa con ají amarillo y llajwa tradicional.',
   89.00, 'Entradas', true,
   'https://images.unsplash.com/photo-1547592166-23ac45744acd?auto=format&fit=crop&w=1200&q=80'),

  ('Anticucho de Corazón',
   'Cortes de corazón de res a la parrilla con salsa de maní ahumada y papas nativas.',
   89.00, 'Entradas', true,
   'https://images.unsplash.com/photo-1603360946369-dc9bb6258143?auto=format&fit=crop&w=1200&q=80'),

  ('Kalapurka de la Casa',
   'Guiso precolombino espeso de harina de maíz, servido hirviendo con piedra volcánica.',
   89.00, 'Platos Fuertes', true,
   'https://images.unsplash.com/photo-1476718406336-bb5a9690ee2a?auto=format&fit=crop&w=1200&q=80'),

  ('Paiche Amazónico',
   'Filete de paiche sellado a la mantequilla con guarniciones amazónicas.',
   89.00, 'Platos Fuertes', true,
   'https://images.unsplash.com/photo-1519708227418-c8fd9a32b7a2?auto=format&fit=crop&w=1200&q=80'),

  ('Helado de Bicervecina',
   'Helado artesanal de malta boliviana con pera a la canela.',
   89.00, 'Postres', true,
   'https://images.unsplash.com/photo-1563805042-7684c019e1cb?auto=format&fit=crop&w=1200&q=80'),

  ('Texturas de Copoazú',
   'Mousse de fruta amazónica contrastado con chocolate boliviano al 70%.',
   89.00, 'Postres', true,
   'https://images.unsplash.com/photo-1551024506-0bccd828d307?auto=format&fit=crop&w=1200&q=80')
) as v(nombre, descripcion, precio, categoria, disponible, imagen_url)
where not exists (
  select 1 from public.menu m
  where lower(m.nombre) = lower(v.nombre)
);

-- Oculta la carta anterior sin borrar el historial de pedidos.
update public.menu
set disponible = false
where lower(nombre) not in (
  'tucumana de papalisa',
  'anticucho de corazón',
  'kalapurka de la casa',
  'paiche amazónico',
  'helado de bicervecina',
  'texturas de copoazú'
);

commit;

select id, nombre, categoria, precio, disponible
from public.menu
where disponible = true
order by categoria, nombre;
