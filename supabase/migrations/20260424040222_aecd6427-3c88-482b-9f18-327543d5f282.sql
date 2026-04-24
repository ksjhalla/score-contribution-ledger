ALTER TABLE public.executions
  ADD COLUMN IF NOT EXISTS confidence text DEFAULT 'High'
    CHECK (confidence IS NULL OR confidence IN ('High','Medium','Low')),
  ADD COLUMN IF NOT EXISTS resolver_description text,
  ADD COLUMN IF NOT EXISTS expected_resolution text;

ALTER TABLE public.triggers
  ADD COLUMN IF NOT EXISTS confidence text DEFAULT 'Medium'
    CHECK (confidence IS NULL OR confidence IN ('High','Medium','Low'));