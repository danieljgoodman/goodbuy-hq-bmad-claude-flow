-- Migration: Add Professional Tier Schema Extensions
-- Story 11.1: Professional Tier Database Schema Extension
-- Created: September 17, 2025
-- Description: Adds Professional tier support with backward compatibility

-- Step 1: Add new columns to business_evaluations table
-- These additions are non-breaking and maintain backward compatibility
ALTER TABLE business_evaluations
ADD COLUMN professional_data JSONB DEFAULT NULL,
ADD COLUMN subscription_tier VARCHAR(20) DEFAULT 'basic' NOT NULL,
ADD COLUMN analysis_depth VARCHAR(20) DEFAULT 'basic' NOT NULL,
ADD COLUMN data_version VARCHAR(10) DEFAULT '1.0' NOT NULL;

-- Step 2: Add constraints for data integrity
ALTER TABLE business_evaluations
ADD CONSTRAINT business_evaluations_subscription_tier_check
  CHECK (subscription_tier IN ('basic', 'professional', 'enterprise'));

ALTER TABLE business_evaluations
ADD CONSTRAINT business_evaluations_analysis_depth_check
  CHECK (analysis_depth IN ('basic', 'professional', 'enterprise'));

-- Step 3: Create Professional Data Audit table
CREATE TABLE professional_data_audit (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_evaluation_id UUID NOT NULL,
  user_id UUID NOT NULL,
  change_type VARCHAR(50) NOT NULL,
  previous_data JSONB,
  new_data JSONB,
  changed_fields TEXT[] DEFAULT '{}',
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  user_agent TEXT,
  ip_address VARCHAR(45),
  session_id VARCHAR(255),
  request_id VARCHAR(255),

  CONSTRAINT professional_data_audit_business_evaluation_fk
    FOREIGN KEY (business_evaluation_id)
    REFERENCES business_evaluations(id)
    ON DELETE CASCADE,

  CONSTRAINT professional_data_audit_user_fk
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,

  CONSTRAINT professional_data_audit_change_type_check
    CHECK (change_type IN ('created', 'updated', 'tier_upgraded', 'data_export', 'admin_access'))
);

-- Step 4: Create performance indexes for Professional tier queries
-- Primary access patterns: user + tier filtering
CREATE INDEX CONCURRENTLY idx_business_evaluations_user_tier
ON business_evaluations(user_id, subscription_tier);

-- Tier-based chronological queries for analytics
CREATE INDEX CONCURRENTLY idx_business_evaluations_tier_created
ON business_evaluations(subscription_tier, created_at);

-- Status filtering by tier for operational monitoring
CREATE INDEX CONCURRENTLY idx_business_evaluations_status_tier
ON business_evaluations(status, subscription_tier);

-- Professional data JSONB search capabilities
CREATE INDEX CONCURRENTLY idx_business_evaluations_professional_gin
ON business_evaluations USING gin(professional_data);

-- Audit trail indexes for compliance and monitoring
CREATE INDEX CONCURRENTLY idx_professional_data_audit_business_eval
ON professional_data_audit(business_evaluation_id);

CREATE INDEX CONCURRENTLY idx_professional_data_audit_user_timestamp
ON professional_data_audit(user_id, timestamp);

CREATE INDEX CONCURRENTLY idx_professional_data_audit_timestamp
ON professional_data_audit(timestamp);

CREATE INDEX CONCURRENTLY idx_professional_data_audit_change_type
ON professional_data_audit(change_type);

CREATE INDEX CONCURRENTLY idx_professional_data_audit_session
ON professional_data_audit(session_id);

-- Step 5: Create specialized indexes for Professional tier JSONB queries
-- Financial metrics access patterns
CREATE INDEX CONCURRENTLY idx_professional_financial_metrics
ON business_evaluations USING gin((professional_data->'financialMetrics'));

-- Customer analytics access patterns
CREATE INDEX CONCURRENTLY idx_professional_customer_analytics
ON business_evaluations USING gin((professional_data->'customerAnalytics'));

-- Market intelligence access patterns
CREATE INDEX CONCURRENTLY idx_professional_market_intelligence
ON business_evaluations USING gin((professional_data->'marketIntelligence'));

-- Step 6: Add comments for documentation
COMMENT ON COLUMN business_evaluations.professional_data IS
'JSONB storage for Professional tier extended data (45+ fields across 6 categories)';

COMMENT ON COLUMN business_evaluations.subscription_tier IS
'User subscription tier: basic, professional, or enterprise';

COMMENT ON COLUMN business_evaluations.analysis_depth IS
'Analysis complexity level: basic, professional, or enterprise';

COMMENT ON COLUMN business_evaluations.data_version IS
'Data schema version for migration tracking';

COMMENT ON TABLE professional_data_audit IS
'Audit trail for Professional tier data changes and access';

-- Step 7: Update existing evaluations to have proper tier metadata
-- This ensures all existing evaluations are properly categorized as 'basic'
UPDATE business_evaluations
SET
  subscription_tier = 'basic',
  analysis_depth = 'basic',
  data_version = '1.0'
WHERE subscription_tier IS NULL
   OR analysis_depth IS NULL
   OR data_version IS NULL;

-- Step 8: Create function for automatic audit logging
CREATE OR REPLACE FUNCTION audit_professional_data_changes()
RETURNS TRIGGER AS $$
BEGIN
  -- Only audit changes to professional_data column
  IF TG_OP = 'UPDATE' AND (
    OLD.professional_data IS DISTINCT FROM NEW.professional_data OR
    OLD.subscription_tier IS DISTINCT FROM NEW.subscription_tier
  ) THEN
    INSERT INTO professional_data_audit (
      business_evaluation_id,
      user_id,
      change_type,
      previous_data,
      new_data,
      changed_fields,
      timestamp
    ) VALUES (
      NEW.id,
      NEW.user_id,
      CASE
        WHEN OLD.subscription_tier != NEW.subscription_tier THEN 'tier_upgraded'
        ELSE 'updated'
      END,
      OLD.professional_data,
      NEW.professional_data,
      ARRAY['professional_data'],
      NOW()
    );
  ELSIF TG_OP = 'INSERT' AND NEW.professional_data IS NOT NULL THEN
    INSERT INTO professional_data_audit (
      business_evaluation_id,
      user_id,
      change_type,
      previous_data,
      new_data,
      changed_fields,
      timestamp
    ) VALUES (
      NEW.id,
      NEW.user_id,
      'created',
      NULL,
      NEW.professional_data,
      ARRAY['professional_data'],
      NOW()
    );
  END IF;

  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Step 9: Create trigger for automatic audit logging
CREATE TRIGGER trigger_audit_professional_data_changes
  AFTER INSERT OR UPDATE ON business_evaluations
  FOR EACH ROW
  EXECUTE FUNCTION audit_professional_data_changes();

-- Step 10: Create view for tier-aware evaluation access
CREATE OR REPLACE VIEW business_evaluations_with_tier_access AS
SELECT
  be.*,
  u.subscription_tier as user_subscription_tier,
  CASE
    WHEN u.subscription_tier = 'basic' THEN
      jsonb_build_object(
        'id', be.id,
        'userId', be.user_id,
        'businessData', be.business_data,
        'valuations', be.valuations,
        'healthScore', be.health_score,
        'confidenceScore', be.confidence_score,
        'opportunities', be.opportunities,
        'status', be.status,
        'subscriptionTier', be.subscription_tier,
        'createdAt', be.created_at,
        'updatedAt', be.updated_at
      )
    ELSE
      jsonb_build_object(
        'id', be.id,
        'userId', be.user_id,
        'businessData', be.business_data,
        'professionalData', be.professional_data,
        'valuations', be.valuations,
        'healthScore', be.health_score,
        'confidenceScore', be.confidence_score,
        'opportunities', be.opportunities,
        'status', be.status,
        'subscriptionTier', be.subscription_tier,
        'analysisDepth', be.analysis_depth,
        'dataVersion', be.data_version,
        'createdAt', be.created_at,
        'updatedAt', be.updated_at
      )
  END as filtered_data
FROM business_evaluations be
JOIN users u ON be.user_id = u.id
WHERE be.deleted_at IS NULL;

COMMENT ON VIEW business_evaluations_with_tier_access IS
'Tier-aware view that filters evaluation data based on user subscription level';

-- Step 11: Create performance monitoring function
CREATE OR REPLACE FUNCTION get_professional_tier_metrics()
RETURNS TABLE (
  metric_name TEXT,
  metric_value NUMERIC,
  metric_unit TEXT,
  measured_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
  RETURN QUERY
  SELECT
    'total_professional_evaluations'::TEXT,
    COUNT(*)::NUMERIC,
    'count'::TEXT,
    NOW()
  FROM business_evaluations
  WHERE subscription_tier = 'professional' AND deleted_at IS NULL

  UNION ALL

  SELECT
    'avg_professional_data_size'::TEXT,
    AVG(pg_column_size(professional_data))::NUMERIC,
    'bytes'::TEXT,
    NOW()
  FROM business_evaluations
  WHERE professional_data IS NOT NULL AND deleted_at IS NULL

  UNION ALL

  SELECT
    'professional_tier_adoption_rate'::TEXT,
    (COUNT(*) FILTER (WHERE subscription_tier = 'professional') * 100.0 /
     NULLIF(COUNT(*), 0))::NUMERIC,
    'percentage'::TEXT,
    NOW()
  FROM business_evaluations
  WHERE deleted_at IS NULL;
END;
$$ LANGUAGE plpgsql;

-- Step 12: Grant appropriate permissions
-- These would be adjusted based on your application's user roles
GRANT SELECT, INSERT, UPDATE ON business_evaluations TO application_user;
GRANT SELECT, INSERT ON professional_data_audit TO application_user;
GRANT SELECT ON business_evaluations_with_tier_access TO application_user;
GRANT EXECUTE ON FUNCTION get_professional_tier_metrics() TO application_user;

-- Migration validation queries
-- Run these after migration to ensure everything is working correctly

-- Validate schema changes
SELECT
  column_name,
  data_type,
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'business_evaluations'
  AND column_name IN ('professional_data', 'subscription_tier', 'analysis_depth', 'data_version');

-- Validate indexes were created
SELECT
  indexname,
  indexdef
FROM pg_indexes
WHERE tablename = 'business_evaluations'
  AND indexname LIKE 'idx_%tier%';

-- Validate audit table structure
SELECT
  column_name,
  data_type,
  is_nullable
FROM information_schema.columns
WHERE table_name = 'professional_data_audit';

-- Test tier-aware view
SELECT
  subscription_tier,
  COUNT(*) as evaluation_count
FROM business_evaluations_with_tier_access
GROUP BY subscription_tier;

-- Validate constraints
SELECT
  constraint_name,
  check_clause
FROM information_schema.check_constraints
WHERE constraint_name LIKE '%tier%';