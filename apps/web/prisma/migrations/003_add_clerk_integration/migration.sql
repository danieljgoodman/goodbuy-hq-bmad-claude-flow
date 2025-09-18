-- Add Clerk integration fields to User table
ALTER TABLE "users"
ADD COLUMN IF NOT EXISTS "clerk_id" TEXT,
ADD COLUMN IF NOT EXISTS "name" TEXT,
ADD COLUMN IF NOT EXISTS "image_url" TEXT,
ADD COLUMN IF NOT EXISTS "subscription_status" TEXT DEFAULT 'active',
ADD COLUMN IF NOT EXISTS "deleted_at" TIMESTAMP(3);

-- Make business fields optional for Clerk users (they'll be filled during onboarding)
ALTER TABLE "users"
ALTER COLUMN "business_name" DROP NOT NULL,
ALTER COLUMN "industry" DROP NOT NULL;

-- Add unique constraint for clerk_id
ALTER TABLE "users"
ADD CONSTRAINT "users_clerk_id_key" UNIQUE ("clerk_id");

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS "users_clerk_id_idx" ON "users"("clerk_id");
CREATE INDEX IF NOT EXISTS "users_deleted_at_idx" ON "users"("deleted_at");