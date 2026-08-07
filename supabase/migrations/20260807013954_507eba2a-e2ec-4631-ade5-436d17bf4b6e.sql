CREATE TABLE public.nandi_farmers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  cooperative_key text NOT NULL DEFAULT 'kaptumo',
  name text NOT NULL,
  initials text NOT NULL,
  note text,
  sort_order int NOT NULL
);
GRANT SELECT ON public.nandi_farmers TO anon, authenticated;
GRANT ALL ON public.nandi_farmers TO service_role;
ALTER TABLE public.nandi_farmers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Nandi farmers are publicly readable" ON public.nandi_farmers FOR SELECT USING (true);

ALTER TABLE public.nandi_contributions ADD COLUMN farmer_id uuid REFERENCES public.nandi_farmers(id);