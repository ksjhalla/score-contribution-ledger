-- Anon needs USAGE on the schema and EXECUTE on the 4 public-flow functions.
GRANT USAGE ON SCHEMA app_private TO anon, authenticated;

GRANT EXECUTE ON FUNCTION app_private.validate_invite_code(text, text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_public_passport(text) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_attestation_by_token(uuid) TO anon, authenticated;
GRANT EXECUTE ON FUNCTION app_private.submit_attestation(uuid, text, text) TO anon, authenticated;

-- Authenticated-only inner functions: grant EXECUTE so the SECURITY INVOKER wrappers can call them.
GRANT EXECUTE ON FUNCTION app_private.has_role(uuid, app_role) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_admin_stats() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.get_admin_user_list() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.complete_profile_with_contributor_id(text, text, text, sector_type) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_user_has_redeemed_invite() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.redeem_invite_code(text, uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.soft_delete_account() TO authenticated;
GRANT EXECUTE ON FUNCTION app_private.current_signer_role() TO authenticated;