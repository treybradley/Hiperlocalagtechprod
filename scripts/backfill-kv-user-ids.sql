-- One-time fix: attach your user id to legacy KV rows saved before user scoping.
-- Run via: npx supabase db query --linked -f scripts/backfill-kv-user-ids.sql
-- Replace USER_ID below with your id from Supabase Dashboard → Authentication → Users

UPDATE kv_store_4f58e216
SET value = jsonb_set(value, '{userId}', '"fa71a783-d035-4f8c-8b64-7a5b1f2591b4"')
WHERE (value->>'userId' IS NULL OR value->>'userId' = '')
  AND (
    key LIKE 'pln:%' OR key LIKE 'sys:%' OR key LIKE 'cyc:%'
    OR key LIKE 'log:%' OR key LIKE 'pho:%'
  );
