CREATE TABLE public.nandi_cooperatives (
  key text PRIMARY KEY,
  name text NOT NULL,
  county text NOT NULL DEFAULT 'Nandi',
  member_count int,
  value_tracked_ksh numeric,
  traceability_pct numeric,
  is_pilot boolean NOT NULL DEFAULT false,
  note text,
  sort_order int NOT NULL
);

GRANT SELECT ON public.nandi_cooperatives TO anon;
GRANT SELECT ON public.nandi_cooperatives TO authenticated;
GRANT ALL ON public.nandi_cooperatives TO service_role;

ALTER TABLE public.nandi_cooperatives ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Nandi cooperatives are publicly readable"
ON public.nandi_cooperatives FOR SELECT USING (true);

INSERT INTO public.nandi_cooperatives (key, name, county, member_count, value_tracked_ksh, traceability_pct, is_pilot, note, sort_order) VALUES
('kaptumo', 'Kaptumo Cooperative', 'Nandi', 600, 53400000, 78, true, 'Active pilot cooperative — the only one with instrumented trigger-level evidence. Cooperative-wide totals are illustrative.', 1),
('kabiyet', 'Kabiyet Cooperative', 'Nandi', 520, NULL, 71, false, 'Illustrative — not yet onboarded. Included to show cooperative-to-cooperative comparison at scale.', 2),
('kapsabet', 'Kapsabet Cooperative', 'Nandi', 480, NULL, 63, false, 'Illustrative — not yet onboarded. Included to show cooperative-to-cooperative comparison at scale.', 3),
('chepterwai', 'Chepterwai Cooperative', 'Nandi', 415, NULL, 57, false, 'Illustrative — not yet onboarded. Included to show cooperative-to-cooperative comparison at scale.', 4);