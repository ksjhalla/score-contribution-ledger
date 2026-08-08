DROP POLICY IF EXISTS "Nandi farmers are publicly readable" ON public.nandi_farmers;
DROP POLICY IF EXISTS "Nandi cooperatives are publicly readable" ON public.nandi_cooperatives;

REVOKE SELECT ON public.nandi_farmers FROM anon;
REVOKE SELECT ON public.nandi_cooperatives FROM anon;
GRANT SELECT ON public.nandi_farmers TO authenticated;
GRANT SELECT ON public.nandi_cooperatives TO authenticated;

CREATE POLICY "Nandi farmers readable by invited users"
ON public.nandi_farmers FOR SELECT TO authenticated
USING (public.has_nandi_access(auth.uid()));

CREATE POLICY "Nandi cooperatives readable by invited users"
ON public.nandi_cooperatives FOR SELECT TO authenticated
USING (public.has_nandi_access(auth.uid()));