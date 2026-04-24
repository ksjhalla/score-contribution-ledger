ALTER TABLE public.demo_requests
  ADD COLUMN IF NOT EXISTS name text,
  ADD COLUMN IF NOT EXISTS organisation text,
  ADD COLUMN IF NOT EXISTS use_case text,
  ADD COLUMN IF NOT EXISTS message text;