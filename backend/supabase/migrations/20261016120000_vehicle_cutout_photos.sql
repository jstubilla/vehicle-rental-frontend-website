-- The vehicle photos are now transparent cutouts (frontend/public/images/vehicles/<slug>-front.webp), all at
-- the same size and ground line; the website draws the backdrop behind them. Points each vehicle's photo at its
-- cutout. Only the original "<slug>-front.jpg" path is changed, so a photo staff have replaced is left alone.
-- The .jpg originals stay in the repository, so this can be undone by swapping the two names back.

update public.vehicles
set images = replace(
  images::text,
  format('"/images/vehicles/%s-front.jpg"', slug),
  format('"/images/vehicles/%s-front.webp"', slug)
)::jsonb
where images::text like format('%%"/images/vehicles/%s-front.jpg"%%', slug);
