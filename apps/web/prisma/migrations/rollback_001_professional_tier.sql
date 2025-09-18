-- Rollback Migration: Remove Professional Tier Schema Extensions
-- Story 11.1: Professional Tier Database Schema Extension - ROLLBACK
-- Created: September 17, 2025
-- Description: Safely removes Professional tier extensions while preserving basic tier data

-- IMPORTANT: This rollback script will permanently delete Professional tier data
-- Ensure you have a backup before running this script

-- Step 1: Drop triggers and functions
DROP TRIGGER IF EXISTS trigger_audit_professional_data_changes ON business_evaluations;
DROP FUNCTION IF EXISTS audit_professional_data_changes();
DROP FUNCTION IF EXISTS get_professional_tier_metrics();

-- Step 2: Drop views
DROP VIEW IF EXISTS business_evaluations_with_tier_access;

-- Step 3: Drop indexes (CONCURRENTLY for production safety)
DROP INDEX CONCURRENTLY IF EXISTS idx_business_evaluations_user_tier;
DROP INDEX CONCURRENTLY IF EXISTS idx_business_evaluations_tier_created;
DROP INDEX CONCURRENTLY IF EXISTS idx_business_evaluations_status_tier;
DROP INDEX CONCURRENTLY IF EXISTS idx_business_evaluations_professional_gin;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_financial_metrics;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_customer_analytics;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_market_intelligence;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_data_audit_business_eval;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_data_audit_user_timestamp;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_data_audit_timestamp;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_data_audit_change_type;
DROP INDEX CONCURRENTLY IF EXISTS idx_professional_data_audit_session;

-- Step 4: Drop audit table (this will permanently delete audit logs)
DROP TABLE IF EXISTS professional_data_audit;

-- Step 5: Remove constraints
ALTER TABLE business_evaluations
DROP CONSTRAINT IF EXISTS business_evaluations_subscription_tier_check;

ALTER TABLE business_evaluations
DROP CONSTRAINT IF EXISTS business_evaluations_analysis_depth_check;

-- Step 6: Create backup of professional data before removal (optional)
-- Uncomment the following lines if you want to create a backup table
/*
CREATE TABLE professional_data_backup AS
SELECT
  id,
  user_id,
  professional_data,
  subscription_tier,
  analysis_depth,
  data_version,
  created_at,
  updated_at
FROM business_evaluations
WHERE professional_data IS NOT NULL;

COMMENT ON TABLE professional_data_backup IS
'Backup of professional tier data before rollback - created on ' || NOW()::TEXT;
*/

-- Step 7: Remove Professional tier columns
-- WARNING: This will permanently delete all Professional tier data
ALTER TABLE business_evaluations
DROP COLUMN IF EXISTS professional_data,
DROP COLUMN IF EXISTS subscription_tier,
DROP COLUMN IF EXISTS analysis_depth,
DROP COLUMN IF EXISTS data_version;

-- Step 8: Verification queries
-- Run these to ensure rollback was successful

-- Verify columns were removed
SELECT
  column_name,
  data_type
FROM information_schema.columns
WHERE table_name = 'business_evaluations'
  AND column_name IN ('professional_data', 'subscription_tier', 'analysis_depth', 'data_version');

-- Should return no rows if rollback was successful

-- Verify indexes were removed
SELECT
  indexname
FROM pg_indexes
WHERE tablename = 'business_evaluations'
  AND indexname LIKE 'idx_%tier%';

-- Should return no rows if rollback was successful

-- Verify audit table was removed
SELECT EXISTS (
  SELECT 1
  FROM information_schema.tables
  WHERE table_name = 'professional_data_audit'
);

-- Should return 'f' (false) if rollback was successful

-- Verify basic tier functionality still works
SELECT
  id,
  user_id,
  business_data,
  valuations,
  health_score,
  confidence_score,
  status,
  created_at
FROM business_evaluations
WHERE deleted_at IS NULL
LIMIT 5;

-- Should return basic evaluation data without Professional tier fields

-- Final validation: Ensure no orphaned constraints or references
SELECT
  constraint_name,
  table_name
FROM information_schema.table_constraints
WHERE constraint_name LIKE '%professional%'
   OR constraint_name LIKE '%tier%';

-- Should return no rows if rollback was complete

COMMENT ON TABLE business_evaluations IS
'Business evaluations table - Professional tier extensions rolled back on ' || NOW()::TEXT;