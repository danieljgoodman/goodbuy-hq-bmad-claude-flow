# Database Schema

```sql
-- Enable UUID extension for primary keys
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Users table with authentication and business information
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email VARCHAR(255) UNIQUE NOT NULL,
    business_name VARCHAR(255) NOT NULL,
    industry VARCHAR(100) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'manager', 'advisor')),
    subscription_tier VARCHAR(50) NOT NULL DEFAULT 'free' 
        CHECK (subscription_tier IN ('free', 'premium', 'enterprise')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- Business evaluations with comprehensive AI analysis
CREATE TABLE business_evaluations (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    business_data JSONB NOT NULL,
    valuations JSONB,
    health_score INTEGER CHECK (health_score >= 1 AND health_score <= 100),
    confidence_score INTEGER CHECK (confidence_score >= 1 AND confidence_score <= 100),
    top_opportunities JSONB,
    status VARCHAR(50) NOT NULL DEFAULT 'processing' 
        CHECK (status IN ('processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Document analysis for AI-powered document intelligence
CREATE TABLE document_analyses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES business_evaluations(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    file_type VARCHAR(50) NOT NULL 
        CHECK (file_type IN ('financial_statement', 'tax_return', 'bank_statement', 'other')),
    file_url TEXT NOT NULL,
    extracted_data JSONB,
    data_quality JSONB,
    red_flags TEXT[],
    processing_status VARCHAR(50) NOT NULL DEFAULT 'uploaded' 
        CHECK (processing_status IN ('uploaded', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Improvement opportunities from AI analysis
CREATE TABLE improvement_opportunities (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    evaluation_id UUID NOT NULL REFERENCES business_evaluations(id) ON DELETE CASCADE,
    category VARCHAR(50) NOT NULL 
        CHECK (category IN ('operational', 'financial', 'strategic', 'market')),
    title VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    impact_estimate JSONB NOT NULL,
    difficulty VARCHAR(20) NOT NULL CHECK (difficulty IN ('low', 'medium', 'high')),
    timeframe VARCHAR(100),
    priority INTEGER NOT NULL,
    implementation_guide TEXT,
    required_resources TEXT[],
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Progress tracking for premium subscribers
CREATE TABLE improvement_progress (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    opportunity_id UUID NOT NULL REFERENCES improvement_opportunities(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL DEFAULT 'not_started' 
        CHECK (status IN ('not_started', 'in_progress', 'completed', 'validated')),
    completed_steps TEXT[],
    evidence JSONB,
    value_impact DECIMAL(15,2) DEFAULT 0,
    started_at TIMESTAMP WITH TIME ZONE,
    completed_at TIMESTAMP WITH TIME ZONE,
    validated_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Subscription management with Stripe integration
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID UNIQUE NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    stripe_subscription_id VARCHAR(255) UNIQUE,
    plan VARCHAR(50) NOT NULL DEFAULT 'free' 
        CHECK (plan IN ('free', 'premium_monthly', 'premium_annual')),
    status VARCHAR(50) NOT NULL DEFAULT 'active' 
        CHECK (status IN ('active', 'past_due', 'canceled', 'trialing')),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    trial_end TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Indexes for performance optimization
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);
CREATE INDEX idx_business_evaluations_user_id ON business_evaluations(user_id);
CREATE INDEX idx_business_evaluations_status ON business_evaluations(status);
CREATE INDEX idx_business_evaluations_created_at ON business_evaluations(created_at DESC);
CREATE INDEX idx_document_analyses_evaluation_id ON document_analyses(evaluation_id);
CREATE INDEX idx_document_analyses_processing_status ON document_analyses(processing_status);
CREATE INDEX idx_improvement_opportunities_evaluation_id ON improvement_opportunities(evaluation_id);
CREATE INDEX idx_improvement_progress_user_id ON improvement_progress(user_id);
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_stripe_id ON subscriptions(stripe_subscription_id);

-- Row Level Security policies for data privacy
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE business_evaluations ENABLE ROW LEVEL SECURITY;
ALTER TABLE document_analyses ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_opportunities ENABLE ROW LEVEL SECURITY;
ALTER TABLE improvement_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;

-- RLS Policies for user data privacy
CREATE POLICY "Users can view own data" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own data" ON users FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can view own evaluations" ON business_evaluations FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can create own evaluations" ON business_evaluations FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own documents" ON document_analyses FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM business_evaluations WHERE id = evaluation_id)
);

CREATE POLICY "Users can view own opportunities" ON improvement_opportunities FOR SELECT USING (
    auth.uid() IN (SELECT user_id FROM business_evaluations WHERE id = evaluation_id)
);

CREATE POLICY "Users can view own progress" ON improvement_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON improvement_progress FOR ALL USING (auth.uid() = user_id);

CREATE POLICY "Users can view own subscription" ON subscriptions FOR SELECT USING (auth.uid() = user_id);
```
