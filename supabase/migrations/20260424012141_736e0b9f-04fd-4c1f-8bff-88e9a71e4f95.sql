-- Work entries table for the Log Work feature
CREATE TABLE public.work_entries (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  work_date DATE NOT NULL DEFAULT CURRENT_DATE,
  hours NUMERIC(6,2),
  category TEXT,
  reference_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.work_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own work entries"
  ON public.work_entries FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own work entries"
  ON public.work_entries FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own work entries"
  ON public.work_entries FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own work entries"
  ON public.work_entries FOR DELETE
  USING (auth.uid() = user_id);

CREATE INDEX idx_work_entries_user_date
  ON public.work_entries (user_id, work_date DESC);

CREATE TRIGGER work_entries_touch_updated_at
  BEFORE UPDATE ON public.work_entries
  FOR EACH ROW
  EXECUTE FUNCTION public.touch_updated_at();