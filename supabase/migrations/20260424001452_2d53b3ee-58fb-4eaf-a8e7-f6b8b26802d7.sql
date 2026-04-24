CREATE TABLE public.demo_requests (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  email TEXT NOT NULL,
  source TEXT,
  submitted_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.demo_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can submit demo requests"
ON public.demo_requests
FOR INSERT
TO anon, authenticated
WITH CHECK (
  email IS NOT NULL 
  AND length(email) <= 255
  AND length(email) >= 3
  AND email ~* '^[^@\s]+@[^@\s]+\.[^@\s]+$'
);

CREATE POLICY "Admins view demo requests"
ON public.demo_requests
FOR SELECT
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE INDEX idx_demo_requests_submitted_at ON public.demo_requests(submitted_at DESC);