-- Rollback subscription tier updates
-- Restores original tier constraint

BEGIN;

-- Check if any users have new tier values that would be lost
DO $$
DECLARE
  new_tier_count integer;
BEGIN
  SELECT COUNT(*) INTO new_tier_count
  FROM public.users
  WHERE subscription_tier IN ('professional', 'enterprise');

  IF new_tier_count > 0 THEN
    RAISE WARNING 'Warning: % users have new tier values that will be lost during rollback', new_tier_count;
  END IF;
END $$;

-- Drop current constraint
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

-- Restore original constraint (only free, pro, enterprise)
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'enterprise'));

-- Remove migration record
DELETE FROM public.schema_migrations WHERE version = '002';

COMMIT;