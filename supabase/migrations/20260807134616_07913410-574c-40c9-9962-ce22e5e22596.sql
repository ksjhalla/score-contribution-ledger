DROP POLICY IF EXISTS "Signer, contract owner, or contract attestor can read sign-offs" ON public.evidence_sign_offs;

CREATE POLICY "Signer or contract owner can read sign-offs"
ON public.evidence_sign_offs
FOR SELECT
TO authenticated
USING (
  signer_user_id = auth.uid()
  OR (
    contract_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.contracts c
      WHERE c.id = evidence_sign_offs.contract_id
        AND c.user_id = auth.uid()
    )
  )
);