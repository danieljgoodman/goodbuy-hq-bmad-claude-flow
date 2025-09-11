-- Create minimal User table
CREATE TABLE IF NOT EXISTS "User" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email VARCHAR(255) UNIQUE NOT NULL,
  "subscriptionTier" TEXT NOT NULL DEFAULT 'FREE',
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);

-- Create index on email
CREATE INDEX IF NOT EXISTS idx_user_email ON "User"(email);

-- Insert test user with Enterprise tier
INSERT INTO "User" (id, email, "subscriptionTier")
VALUES ('d882e870-879b-4b93-8763-ba60b492a2ed', 'testbroker@goodbuyhq.com', 'ENTERPRISE')
ON CONFLICT (email) DO UPDATE SET "subscriptionTier" = 'ENTERPRISE';

-- Insert admin user  
INSERT INTO "User" (email, "subscriptionTier")
VALUES ('admin@goodbuyhq.com', 'ENTERPRISE')
ON CONFLICT (email) DO UPDATE SET "subscriptionTier" = 'ENTERPRISE';

-- Verify users created
SELECT id, email, "subscriptionTier" FROM "User" WHERE email IN ('testbroker@goodbuyhq.com', 'admin@goodbuyhq.com');