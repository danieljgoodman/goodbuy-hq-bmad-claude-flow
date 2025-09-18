-- Update subscription tiers to include new professional and enterprise options
-- Maintains backward compatibility with existing free/pro tiers

BEGIN;

-- Drop existing constraint on subscription_tier
ALTER TABLE public.users DROP CONSTRAINT IF EXISTS users_subscription_tier_check;

-- Add new constraint with expanded tier options
ALTER TABLE public.users ADD CONSTRAINT users_subscription_tier_check
  CHECK (subscription_tier IN ('free', 'pro', 'professional', 'enterprise'));

-- Update default value (keeping 'free' as default for backward compatibility)
ALTER TABLE public.users ALTER COLUMN subscription_tier SET DEFAULT 'free';

-- Add migration tracking
CREATE TABLE IF NOT EXISTS public.schema_migrations (
  version text PRIMARY KEY,
  applied_at timestamp with time zone DEFAULT now(),
  description text
);

-- Record this migration
INSERT INTO public.schema_migrations (version, description)
VALUES ('002', 'Update subscription tiers to include professional and enterprise options')
ON CONFLICT (version) DO NOTHING;

COMMIT;