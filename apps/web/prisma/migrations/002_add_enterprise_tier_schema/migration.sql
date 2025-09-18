-- Story 11.5: Enterprise Tier Database Schema Extension
-- Add Enterprise tier support to existing schema

-- Add Enterprise tier fields to BusinessEvaluation table
ALTER TABLE "business_evaluations"
ADD COLUMN IF NOT EXISTS "enterpriseTierData" JSONB,
ADD COLUMN IF NOT EXISTS "scenarioModelingData" JSONB,
ADD COLUMN IF NOT EXISTS "strategicProjections" JSONB,
ADD COLUMN IF NOT EXISTS "encryptedFields" JSONB,
ADD COLUMN IF NOT EXISTS "complianceMetadata" JSONB;

-- Add index for Enterprise tier optimization
CREATE INDEX IF NOT EXISTS "business_evaluations_userId_subscriptionTier_updatedAt_idx"
ON "business_evaluations"("userId", "subscriptionTier", "updatedAt");

-- Create AuditLogEntry table for Enterprise audit logging
CREATE TABLE IF NOT EXISTS "audit_log_entries" (
    "id" TEXT NOT NULL,
    "businessEvaluationId" TEXT NOT NULL,
    "action" TEXT NOT NULL,
    "fieldName" TEXT,
    "oldValue" JSONB,
    "newValue" JSONB,
    "userId" TEXT NOT NULL,
    "userTier" TEXT NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "metadata" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "audit_log_entries_pkey" PRIMARY KEY ("id")
);

-- Create indexes for AuditLogEntry
CREATE INDEX "audit_log_entries_businessEvaluationId_timestamp_idx"
ON "audit_log_entries"("businessEvaluationId", "timestamp");

CREATE INDEX "audit_log_entries_userId_timestamp_idx"
ON "audit_log_entries"("userId", "timestamp");

CREATE INDEX "audit_log_entries_action_timestamp_idx"
ON "audit_log_entries"("action", "timestamp");

-- Create EnterpriseScenarioModel table for complex scenario modeling
CREATE TABLE IF NOT EXISTS "enterprise_scenario_models" (
    "id" TEXT NOT NULL,
    "businessEvaluationId" TEXT NOT NULL,
    "baseScenario" JSONB NOT NULL,
    "optimisticScenario" JSONB NOT NULL,
    "conservativeScenario" JSONB NOT NULL,
    "customScenarios" JSONB NOT NULL,
    "projectionHorizon" INTEGER NOT NULL DEFAULT 5,
    "lastUpdated" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "calculationVersion" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "enterprise_scenario_models_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "enterprise_scenario_models_businessEvaluationId_key" UNIQUE ("businessEvaluationId")
);

-- Create index for EnterpriseScenarioModel
CREATE INDEX "enterprise_scenario_models_businessEvaluationId_idx"
ON "enterprise_scenario_models"("businessEvaluationId");

-- Add foreign key constraints
ALTER TABLE "audit_log_entries"
ADD CONSTRAINT "audit_log_entries_businessEvaluationId_fkey"
FOREIGN KEY ("businessEvaluationId")
REFERENCES "business_evaluations"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

ALTER TABLE "enterprise_scenario_models"
ADD CONSTRAINT "enterprise_scenario_models_businessEvaluationId_fkey"
FOREIGN KEY ("businessEvaluationId")
REFERENCES "business_evaluations"("id")
ON DELETE CASCADE
ON UPDATE CASCADE;

-- Create function for automatic updatedAt timestamp
CREATE OR REPLACE FUNCTION trigger_set_timestamp()
RETURNS TRIGGER AS $$
BEGIN
  NEW."updatedAt" = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for enterprise_scenario_models updatedAt
CREATE TRIGGER set_timestamp_enterprise_scenario_models
BEFORE UPDATE ON "enterprise_scenario_models"
FOR EACH ROW
EXECUTE FUNCTION trigger_set_timestamp();

-- Add comments for documentation
COMMENT ON TABLE "audit_log_entries" IS 'Enterprise tier audit logging for SOC 2 compliance';
COMMENT ON TABLE "enterprise_scenario_models" IS 'Complex multi-scenario financial modeling for Enterprise tier';
COMMENT ON COLUMN "business_evaluations"."enterpriseTierData" IS 'Enterprise tier specific data (80+ fields)';
COMMENT ON COLUMN "business_evaluations"."encryptedFields" IS 'Field-level encrypted sensitive enterprise data';
COMMENT ON COLUMN "business_evaluations"."complianceMetadata" IS 'SOC 2 compliance and governance metadata';