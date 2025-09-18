-- Professional Tier Schema Rollback
-- Safely removes professional tier tables and related structures

BEGIN;

-- Drop helper functions first
DROP FUNCTION IF EXISTS public.get_professional_evaluation_summary(uuid);
DROP FUNCTION IF EXISTS public.validate_professional_tier_completeness(uuid);

-- Drop extended tables (in reverse dependency order)
DROP TABLE IF EXISTS public.compliance_data CASCADE;
DROP TABLE IF EXISTS public.financial_planning CASCADE;
DROP TABLE IF EXISTS public.market_intelligence CASCADE;
DROP TABLE IF EXISTS public.operational_efficiency CASCADE;
DROP TABLE IF EXISTS public.customer_analytics CASCADE;
DROP TABLE IF EXISTS public.financial_metrics_extended CASCADE;

-- Drop main professional evaluations table
DROP TABLE IF EXISTS public.professional_evaluations CASCADE;

-- Note: We don't drop the original tables (users, businesses, business_evaluations)
-- as they may contain existing data that should be preserved

COMMIT;