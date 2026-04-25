-- Revoke the anon EXECUTE grant on redeem_invite_code.
-- The function body already rejects anon callers with ERRCODE 42501 (see
-- migration 20260425131351). Revoking the grant adds a second layer of
-- defence so Postgres never even enters the function body for anon callers.
REVOKE EXECUTE ON FUNCTION public.redeem_invite_code(text, uuid) FROM anon;
