CREATE TABLE public.evidence_anchors (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chain TEXT NOT NULL DEFAULT 'Polygon',
  batch_root_hash TEXT NOT NULL,
  anchor_reference TEXT NOT NULL,
  anchored_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.evidence
  ADD COLUMN anchor_id UUID REFERENCES public.evidence_anchors(id) ON DELETE SET NULL;

CREATE INDEX idx_evidence_anchor ON public.evidence(anchor_id);

ALTER TABLE public.evidence_anchors ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view evidence anchors"
  ON public.evidence_anchors FOR SELECT
  TO authenticated
  USING (true);

GRANT SELECT ON public.evidence_anchors TO authenticated;
GRANT ALL ON public.evidence_anchors TO service_role;