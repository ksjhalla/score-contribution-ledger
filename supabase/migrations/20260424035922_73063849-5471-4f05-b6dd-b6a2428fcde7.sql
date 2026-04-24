ALTER TABLE public.evidence
  ADD COLUMN execution_id uuid REFERENCES public.executions(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_evidence_execution_id ON public.evidence(execution_id);
CREATE INDEX IF NOT EXISTS idx_evidence_contract_id ON public.evidence(contract_id);