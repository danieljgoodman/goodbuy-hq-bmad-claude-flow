# GoodBuy HQ Fullstack Architecture Document

## Introduction

This document outlines the complete fullstack architecture for GoodBuy HQ, including backend systems, frontend implementation, and their integration. It serves as the single source of truth for AI-driven development, ensuring consistency across the entire technology stack.

This unified approach combines what would traditionally be separate backend and frontend architecture documents, streamlining the development process for modern fullstack applications where these concerns are increasingly intertwined.

### Starter Template or Existing Project

**Status:** Greenfield project with modern fullstack technology choices

Based on the PRD analysis, GoodBuy HQ is a new AI-powered business valuation platform requiring:
- Traditional server architecture for consistent AI processing performance
- Monorepo structure for rapid development with Claude Code
- Modern fullstack framework supporting both frontend and backend requirements
- Integration with AI services, payment processing, and document intelligence

No existing templates or starter projects were specified, allowing for optimal technology selection based on requirements.

### Change Log

| Date | Version | Description | Author |
|------|---------|-------------|--------|
| 2025-09-05 | v1.0 | Initial fullstack architecture document based on updated PRD v2.0 | Winston (Architect Agent) |

## High Level Architecture

### Technical Summary

GoodBuy HQ employs a traditional server-based Next.js architecture with persistent backend processes to ensure reliable AI processing performance under 3 seconds. The frontend leverages Next.js 14+ with TypeScript and ShadCN/ui components, while the backend utilizes Next.js API routes with dedicated AI processing modules for business valuations, document intelligence, and health scoring. Key integration points include Claude API for AI analysis, Supabase for authentication and PostgreSQL database management, and Stripe for subscription processing. The platform is deployed on Vercel with traditional server capabilities, ensuring consistent performance for AI-intensive workloads while supporting the aggressive 12-16 week MVP timeline and 95% valuation accuracy requirements.

### Platform and Infrastructure Choice

**Platform:** Vercel (Traditional Server Mode)
**Key Services:** Next.js API Routes, Supabase PostgreSQL + Auth, Claude AI API, Stripe Payments, Vercel Analytics
**Deployment Host and Regions:** Vercel Global Edge Network with primary regions in US-East (Virginia) and US-West (Oregon)

**Rationale:** Vercel + Supabase + Claude API provides the optimal balance of development speed, AI processing reliability, and scalability for the GoodBuy HQ MVP while supporting the traditional server architecture requirement for consistent AI processing without cold starts.

### Repository Structure

**Structure:** Monorepo with app-centric organization
**Monorepo Tool:** npm workspaces (lightweight, Next.js native)
**Package Organization:** Separation by domain (web, api, shared, ai-processing) with clear dependency boundaries

This approach enables shared TypeScript interfaces between frontend and backend, centralized AI processing utilities, consistent code quality and testing across all packages, and simplified deployment pipeline for the traditional server architecture.

### High Level Architecture Diagram

```mermaid
graph TB
    User[Business Owners] --> Web[Next.js Web App]
    Web --> API[Next.js API Routes]
    
    API --> Auth[Supabase Auth]
    API --> DB[(Supabase PostgreSQL)]
    API --> Claude[Claude AI API]
    API --> Stripe[Stripe API]
    API --> Storage[Document Storage]
    
    Claude --> ValEngine[Valuation Engine]
    Claude --> DocIntel[Document Intelligence]
    Claude --> HealthScore[Health Scoring]
    Claude --> MarketIntel[Market Intelligence]
    
    API --> Cache[Redis Cache]
    Web --> CDN[Vercel CDN]
    
    External[Market Data APIs] --> API
    Email[Email Service] --> API
```

### Architectural Patterns

- **Jamstack Architecture:** Static site generation with server-side AI processing - _Rationale:_ Optimal performance for user interfaces while maintaining consistent AI processing capabilities
- **Component-Based UI:** Reusable ShadCN/ui components with TypeScript - _Rationale:_ Rapid development, consistent design system, and type safety across complex business interfaces
- **API-First Design:** RESTful endpoints with OpenAPI specification - _Rationale:_ Clear contracts between frontend and backend, supporting future mobile app development
- **Repository Pattern:** Abstract data access for business entities - _Rationale:_ Clean separation of business logic from data persistence, supporting complex valuation calculations
- **Service Layer Pattern:** Dedicated services for AI processing, payments, and document handling - _Rationale:_ Modular architecture supporting independent scaling and testing of critical business functions
- **Event-Driven Progress Tracking:** Async processing for valuation updates and progress tracking - _Rationale:_ Maintains responsiveness while handling complex AI analysis workflows

## Tech Stack

| Category | Technology | Version | Purpose | Rationale |
|----------|------------|---------|---------|-----------|
| Frontend Language | TypeScript | 5.3+ | Type-safe frontend development | Prevents runtime errors in complex business logic, improves AI integration reliability |
| Frontend Framework | Next.js | 14+ | Full-stack React framework | Server-side rendering for SEO, API routes for backend, optimized for Vercel deployment |
| UI Component Library | ShadCN/ui | Latest | Professional component system | Rapid development, consistent design, accessibility compliance, TweakCN integration |
| State Management | Zustand | 4.4+ | Lightweight state management | Simple API, TypeScript native, perfect for subscription and user state |
| Backend Language | TypeScript | 5.3+ | Type-safe backend development | Shared types with frontend, reduces AI integration bugs |
| Backend Framework | Next.js API Routes | 14+ | Serverless API endpoints | Integrated with frontend, traditional server mode for AI processing |
| API Style | REST | OpenAPI 3.0 | RESTful API design | Industry standard, clear documentation, supports future mobile development |
| Database | PostgreSQL | 15+ | Relational database | Complex business relationships, ACID compliance for financial data |
| Cache | Redis | 7+ | Application caching | AI response caching, session management, performance optimization |
| File Storage | Supabase Storage | Latest | Document storage | Secure file uploads, integrated auth, document intelligence processing |
| Authentication | Supabase Auth | Latest | User authentication | JWT tokens, social auth, password reset, security compliance |
| Frontend Testing | Vitest + React Testing Library | Latest | Component testing | Fast testing, React-focused, TypeScript support |
| Backend Testing | Vitest | Latest | API testing | Consistent with frontend, fast execution, TypeScript native |
| E2E Testing | Playwright | Latest | End-to-end testing | Cross-browser, AI workflow testing, subscription flow validation |
| Build Tool | Next.js | 14+ | Application bundling | Integrated build system, optimizations, deployment ready |
| Bundler | Turbopack | Latest | Fast bundling | Next.js native, development speed, large codebase support |
| IaC Tool | Vercel CLI | Latest | Infrastructure management | Simple deployment, environment management, preview deployments |
| CI/CD | GitHub Actions | Latest | Automation pipeline | Free for public repos, Vercel integration, testing automation |
| Monitoring | Vercel Analytics + Sentry | Latest | Performance monitoring | User analytics, error tracking, AI processing monitoring |
| Logging | Vercel Logs + Winston | Latest | Application logging | Centralized logging, AI processing insights, debugging support |
| CSS Framework | Tailwind CSS | 3.4+ | Utility-first styling | Rapid styling, responsive design, ShadCN compatibility |

## Data Models

### User

**Purpose:** Core user entity representing business owners using the platform with authentication and subscription management

**Key Attributes:**
- id: string - Unique identifier (UUID)
- email: string - Primary authentication credential
- businessName: string - Name of user's business
- industry: string - Business industry sector
- role: string - User's role in the business
- subscriptionTier: enum - Free, Premium, Enterprise
- createdAt: Date - Account creation timestamp
- lastLoginAt: Date - User activity tracking

#### TypeScript Interface
```typescript
interface User {
  id: string;
  email: string;
  businessName: string;
  industry: string;
  role: 'owner' | 'manager' | 'advisor';
  subscriptionTier: 'free' | 'premium' | 'enterprise';
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date;
}
```

#### Relationships
- One-to-many with BusinessEvaluations
- One-to-many with ImprovementProgress
- One-to-one with Subscription

### BusinessEvaluation

**Purpose:** Stores comprehensive AI-generated business valuations with multi-methodology analysis and confidence scoring

#### TypeScript Interface
```typescript
interface BusinessEvaluation {
  id: string;
  userId: string;
  businessData: {
    annualRevenue: number;
    monthlyRecurring: number;
    expenses: number;
    cashFlow: number;
    assets: number;
    liabilities: number;
    customerCount: number;
    marketPosition: string;
  };
  valuations: {
    assetBased: number;
    incomeBased: number;
    marketBased: number;
    weighted: number;
    methodology: string;
  };
  healthScore: number;
  confidenceScore: number;
  topOpportunities: ImprovementOpportunity[];
  status: 'processing' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
}
```

### ImprovementOpportunity

**Purpose:** AI-identified opportunities for business value enhancement with quantified impact estimates and implementation guidance

#### TypeScript Interface
```typescript
interface ImprovementOpportunity {
  id: string;
  category: 'operational' | 'financial' | 'strategic' | 'market';
  title: string;
  description: string;
  impactEstimate: {
    dollarAmount: number;
    percentageIncrease: number;
    confidence: number;
  };
  difficulty: 'low' | 'medium' | 'high';
  timeframe: string;
  priority: number;
  implementationGuide?: string; // Premium content
  requiredResources: string[];
}
```

### DocumentAnalysis

**Purpose:** AI-processed financial documents with extracted metrics and data quality assessment for enhanced valuation accuracy

#### TypeScript Interface
```typescript
interface DocumentAnalysis {
  id: string;
  evaluationId: string;
  fileName: string;
  fileType: 'financial_statement' | 'tax_return' | 'bank_statement' | 'other';
  extractedData: {
    revenue: number;
    expenses: number;
    netIncome: number;
    cashFlow: number;
    assets: number;
    liabilities: number;
  };
  dataQuality: {
    completeness: number;
    accuracy: number;
    consistency: number;
    confidence: number;
  };
  redFlags: string[];
  processingStatus: 'uploaded' | 'processing' | 'completed' | 'failed';
  createdAt: Date;
}
```

### ImprovementProgress

**Purpose:** Tracks user progress on implementing AI-recommended improvements with value impact measurement for premium subscribers

#### TypeScript Interface
```typescript
interface ImprovementProgress {
  id: string;
  userId: string;
  opportunityId: string;
  status: 'not_started' | 'in_progress' | 'completed' | 'validated';
  completedSteps: string[];
  evidence: {
    type: 'document' | 'screenshot' | 'metric';
    url: string;
    description: string;
  }[];
  valueImpact: number;
  startedAt: Date;
  completedAt?: Date;
  validatedAt?: Date;
}
```

### Subscription

**Purpose:** Premium subscription management with Stripe integration for payment processing and feature access control

#### TypeScript Interface
```typescript
interface Subscription {
  id: string;
  userId: string;
  stripeSubscriptionId: string;
  plan: 'free' | 'premium_monthly' | 'premium_annual';
  status: 'active' | 'past_due' | 'canceled' | 'trialing';
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  trialEnd?: Date;
  createdAt: Date;
  updatedAt: Date;
}
```

## API Specification

### REST API Specification

```yaml
openapi: 3.0.0
info:
  title: GoodBuy HQ API
  version: 1.0.0
  description: AI-powered business valuation and improvement platform API
servers:
  - url: https://goodbuy-hq.vercel.app/api
    description: Production API server
  - url: http://localhost:3000/api
    description: Development server

paths:
  /auth/register:
    post:
      summary: Register new user account
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
                  minLength: 8
                businessName:
                  type: string
                industry:
                  type: string
                role:
                  type: string
                  enum: [owner, manager, advisor]
      responses:
        '201':
          description: User created successfully
        '400':
          description: Invalid input data

  /auth/login:
    post:
      summary: User login
      tags: [Authentication]
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                email:
                  type: string
                  format: email
                password:
                  type: string
      responses:
        '200':
          description: Login successful
          content:
            application/json:
              schema:
                type: object
                properties:
                  user:
                    $ref: '#/components/schemas/User'
                  accessToken:
                    type: string

  /evaluations:
    post:
      summary: Create new business evaluation
      tags: [Evaluations]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/BusinessData'
      responses:
        '201':
          description: Evaluation created and processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessEvaluation'
        '401':
          description: Unauthorized access

    get:
      summary: Get user's evaluation history
      tags: [Evaluations]
      security:
        - bearerAuth: []
      responses:
        '200':
          description: List of user evaluations
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/BusinessEvaluation'

  /evaluations/{id}:
    get:
      summary: Get specific evaluation details
      tags: [Evaluations]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Evaluation details
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/BusinessEvaluation'

  /evaluations/{id}/valuation:
    get:
      summary: Get AI valuation results
      tags: [AI Analysis]
      security:
        - bearerAuth: []
      parameters:
        - name: id
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: AI valuation results
          content:
            application/json:
              schema:
                type: object
                properties:
                  valuations:
                    $ref: '#/components/schemas/Valuations'
                  healthScore:
                    type: number
                  confidenceScore:
                    type: number
                  opportunities:
                    type: array
                    items:
                      $ref: '#/components/schemas/ImprovementOpportunity'

  /documents/upload:
    post:
      summary: Upload financial documents for AI analysis
      tags: [Document Intelligence]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                evaluationId:
                  type: string
                documentType:
                  type: string
                  enum: [financial_statement, tax_return, bank_statement, other]
      responses:
        '201':
          description: Document uploaded and processing
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/DocumentAnalysis'

  /improvements/{opportunityId}/guide:
    get:
      summary: Get implementation guide (Premium only)
      tags: [Premium Features]
      security:
        - bearerAuth: []
      parameters:
        - name: opportunityId
          in: path
          required: true
          schema:
            type: string
      responses:
        '200':
          description: Implementation guide
          content:
            application/json:
              schema:
                type: object
                properties:
                  guide:
                    type: string
                  steps:
                    type: array
                    items:
                      type: string
                  resources:
                    type: array
                    items:
                      type: string
        '403':
          description: Premium subscription required

  /subscriptions:
    post:
      summary: Create premium subscription
      tags: [Subscriptions]
      security:
        - bearerAuth: []
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              properties:
                plan:
                  type: string
                  enum: [premium_monthly, premium_annual]
                paymentMethodId:
                  type: string
      responses:
        '201':
          description: Subscription created
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Subscription'

components:
  schemas:
    User:
      type: object
      properties:
        id:
          type: string
        email:
          type: string
        businessName:
          type: string
        industry:
          type: string
        subscriptionTier:
          type: string
          enum: [free, premium, enterprise]

    BusinessData:
      type: object
      properties:
        annualRevenue:
          type: number
        monthlyRecurring:
          type: number
        expenses:
          type: number
        cashFlow:
          type: number
        assets:
          type: number
        liabilities:
          type: number
        customerCount:
          type: number
        marketPosition:
          type: string

    BusinessEvaluation:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        businessData:
          $ref: '#/components/schemas/BusinessData'
        valuations:
          $ref: '#/components/schemas/Valuations'
        healthScore:
          type: number
        confidenceScore:
          type: number
        status:
          type: string
          enum: [processing, completed, failed]
        createdAt:
          type: string
          format: date-time

    Valuations:
      type: object
      properties:
        assetBased:
          type: number
        incomeBased:
          type: number
        marketBased:
          type: number
        weighted:
          type: number
        methodology:
          type: string

    ImprovementOpportunity:
      type: object
      properties:
        id:
          type: string
        category:
          type: string
          enum: [operational, financial, strategic, market]
        title:
          type: string
        description:
          type: string
        impactEstimate:
          type: object
          properties:
            dollarAmount:
              type: number
            percentageIncrease:
              type: number
            confidence:
              type: number
        difficulty:
          type: string
          enum: [low, medium, high]
        priority:
          type: number

    DocumentAnalysis:
      type: object
      properties:
        id:
          type: string
        evaluationId:
          type: string
        fileName:
          type: string
        fileType:
          type: string
        extractedData:
          type: object
        dataQuality:
          type: object
          properties:
            completeness:
              type: number
            accuracy:
              type: number
            confidence:
              type: number
        processingStatus:
          type: string
          enum: [uploaded, processing, completed, failed]

    Subscription:
      type: object
      properties:
        id:
          type: string
        userId:
          type: string
        plan:
          type: string
          enum: [free, premium_monthly, premium_annual]
        status:
          type: string
          enum: [active, past_due, canceled, trialing]
        currentPeriodEnd:
          type: string
          format: date-time

  securitySchemes:
    bearerAuth:
      type: http
      scheme: bearer
      bearerFormat: JWT

security:
  - bearerAuth: []
```

## Components

### AI Valuation Engine

**Responsibility:** Core AI-powered business valuation using multiple methodologies (asset-based, income-based, market-based) with Claude API integration for <3 second response times and 95% accuracy targeting.

**Key Interfaces:**
- `/api/evaluations` - Business data input and valuation request processing
- `/api/evaluations/{id}/valuation` - Retrieve completed valuation results with confidence scores
- Claude AI API integration for multi-methodology analysis and health scoring

**Dependencies:** Claude AI API, BusinessEvaluation data model, Redis cache for response optimization, PostgreSQL for business data persistence

**Technology Stack:** Next.js API routes with persistent connections, Claude AI SDK, Redis for caching, TypeScript for type safety, Zod validation for business data inputs

### Document Intelligence Service

**Responsibility:** AI-powered financial document processing, OCR extraction, data quality assessment, and integration with valuation engine for enhanced accuracy through automated document analysis.

**Key Interfaces:**
- `/api/documents/upload` - Secure file upload with validation and processing triggers
- `/api/documents/{id}/analysis` - AI-extracted financial data and quality assessment results
- Supabase Storage integration for secure document persistence

**Dependencies:** Claude AI API for document analysis, Supabase Storage, DocumentAnalysis data model, file processing utilities, OCR services

**Technology Stack:** Next.js API routes, Claude AI for document intelligence, Supabase Storage with RLS policies, Sharp for image processing, PDF parsing libraries

### User Management & Authentication

**Responsibility:** Complete user lifecycle management including registration, authentication, profile management, and subscription-aware access control throughout the platform.

**Key Interfaces:**
- `/api/auth/*` - Registration, login, password reset, profile updates
- Supabase Auth integration - JWT token management and session persistence
- User profile and business information management

**Dependencies:** Supabase Auth service, User data model, email service for notifications, session management utilities

**Technology Stack:** Supabase Auth with Next.js integration, JWT token handling, React Context for client-side auth state, TypeScript interfaces for user types

### Subscription & Payment Processing

**Responsibility:** Premium subscription management, Stripe integration, trial-to-paid conversion tracking, feature access control, and billing lifecycle management supporting the business model.

**Key Interfaces:**
- `/api/subscriptions` - Subscription creation, updates, cancellation management
- Stripe webhook handling for subscription status updates
- Premium feature gating throughout application components

**Dependencies:** Stripe API, Subscription data model, User model for tier management, webhook verification, email service for billing notifications

**Technology Stack:** Stripe SDK with Next.js, webhook signature verification, subscription status caching, automated billing reconciliation

### Component Diagrams

```mermaid
graph TD
    subgraph "Frontend Layer"
        UI[React UI Components]
        State[Zustand State Management]
        Auth[Auth Context]
    end
    
    subgraph "API Layer"
        Router[Next.js API Routes]
        Middleware[Auth Middleware]
        Validation[Input Validation]
    end
    
    subgraph "Business Logic"
        Valuation[AI Valuation Engine]
        Documents[Document Intelligence]
        Health[Health Scoring System]
        Guides[Implementation Guides]
        Market[Market Intelligence]
    end
    
    subgraph "Data Layer"
        DB[(PostgreSQL)]
        Cache[(Redis Cache)]
        Storage[File Storage]
    end
    
    subgraph "External Services"
        Claude[Claude AI API]
        Stripe[Stripe Payments]
        Email[Email Service]
        MarketData[Market Data APIs]
    end
    
    UI --> Router
    State --> Auth
    Router --> Middleware
    Middleware --> Validation
    Validation --> Valuation
    Validation --> Documents
    Validation --> Health
    Validation --> Guides
    Validation --> Market
    
    Valuation --> Claude
    Valuation --> DB
    Valuation --> Cache
    
    Documents --> Claude
    Documents --> Storage
    Documents --> DB
    
    Health --> Claude
    Health --> DB
    Health --> Cache
    
    Guides --> Claude
    Guides --> DB
    Guides --> Email
    
    Market --> MarketData
    Market --> Claude
    Market --> Cache
    
    Router --> Stripe
    Router --> Email
```

## External APIs

### Claude AI API

- **Purpose:** Primary AI engine for business valuation analysis, document intelligence, health scoring, and implementation guide generation
- **Documentation:** https://docs.anthropic.com/claude/reference/getting-started-with-the-api
- **Base URL(s):** https://api.anthropic.com/v1
- **Authentication:** API Key with Bearer token authentication
- **Rate Limits:** 4,000 requests per minute for Claude 3.5 Sonnet, with token-based usage limits

**Key Endpoints Used:**
- `POST /messages` - AI analysis for business valuations, document processing, and improvement recommendations
- `POST /messages` - Health score calculations and industry benchmarking analysis
- `POST /messages` - Implementation guide generation for premium subscribers

**Integration Notes:** Persistent HTTP connections for <3 second response requirements, response caching with Redis, error handling for rate limits and API failures

### Stripe Payments API

- **Purpose:** Premium subscription management, payment processing, trial-to-paid conversion tracking, and billing lifecycle management
- **Documentation:** https://stripe.com/docs/api
- **Base URL(s):** https://api.stripe.com/v1
- **Authentication:** Secret API key with Bearer authentication
- **Rate Limits:** 100 requests per second with burst allowance

**Key Endpoints Used:**
- `POST /customers` - Create customer profiles for subscription management
- `POST /subscriptions` - Create and manage premium subscriptions
- `POST /payment_methods` - Handle payment method attachment and updates
- `POST /checkout/sessions` - Secure checkout flow for subscription upgrades

**Integration Notes:** Webhook endpoints for subscription status updates, PCI compliance through Stripe's secure tokenization, automatic retry logic for failed payments

### Supabase Services

- **Purpose:** Authentication services, PostgreSQL database management, secure file storage for document intelligence, and real-time capabilities
- **Documentation:** https://supabase.com/docs
- **Base URL(s):** https://your-project.supabase.co
- **Authentication:** Service role key and JWT tokens for user authentication
- **Rate Limits:** Database connection pooling with automatic scaling

**Key Endpoints Used:**
- `POST /auth/v1/signup` - User registration and account creation
- `POST /auth/v1/token` - User authentication and session management
- `POST /storage/v1/object` - Secure document upload for AI processing
- `GET /rest/v1/*` - Database operations with Row Level Security policies

**Integration Notes:** Automatic connection pooling, Row Level Security for data privacy, integration with Next.js middleware for authentication

## Core Workflows

### Business Evaluation Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Claude
    participant Database
    participant Cache

    User->>Frontend: Submit business data
    Frontend->>API: POST /api/evaluations
    API->>Database: Store evaluation request
    API->>Claude: Analyze business data
    Claude-->>API: Multi-methodology valuations
    API->>Claude: Generate health score
    Claude-->>API: Health analysis + opportunities
    API->>Database: Store complete evaluation
    API->>Cache: Cache results for performance
    API-->>Frontend: Evaluation complete
    Frontend-->>User: Display valuation results
    
    Note over User,Cache: <3 second total processing time
```

### Document Intelligence Processing Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Storage
    participant Claude
    participant Database

    User->>Frontend: Upload financial document
    Frontend->>API: POST /api/documents/upload
    API->>Storage: Store document securely
    API->>Database: Create analysis record
    API->>Claude: Process document with AI
    Claude-->>API: Extracted financial data
    API->>Claude: Validate data quality
    Claude-->>API: Quality assessment + red flags
    API->>Database: Store analysis results
    API-->>Frontend: Document processed
    Frontend->>API: GET /api/documents/{id}/analysis
    API-->>Frontend: Analysis results
    Frontend-->>User: Display extracted data
    
    Note over User,Database: Auto-integration with evaluation
```

### Premium Subscription Upgrade Workflow

```mermaid
sequenceDiagram
    participant User
    participant Frontend
    participant API
    participant Stripe
    participant Database
    participant Email

    User->>Frontend: Click upgrade to premium
    Frontend->>API: POST /api/subscriptions
    API->>Stripe: Create checkout session
    Stripe-->>API: Session URL
    API-->>Frontend: Redirect to Stripe
    Frontend-->>User: Stripe checkout page
    User->>Stripe: Complete payment
    Stripe->>API: Webhook: subscription.created
    API->>Database: Update user subscription
    API->>Email: Send welcome email
    API->>Database: Update feature access
    API-->>Frontend: Subscription confirmed
    Frontend-->>User: Premium features unlocked
    
    Note over User,Email: 14-day trial included
```

## Database Schema

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

## Frontend Architecture

### Component Architecture

#### Component Organization

```text
src/
├── components/
│   ├── ui/                     # ShadCN/ui base components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── form.tsx
│   │   └── data-table.tsx
│   ├── layout/                 # Layout components
│   │   ├── header.tsx
│   │   ├── sidebar.tsx
│   │   └── footer.tsx
│   ├── auth/                   # Authentication components
│   │   ├── login-form.tsx
│   │   ├── register-form.tsx
│   │   └── protected-route.tsx
│   ├── evaluation/             # Business evaluation components
│   │   ├── evaluation-form.tsx
│   │   ├── valuation-results.tsx
│   │   ├── health-score.tsx
│   │   └── opportunities-list.tsx
│   ├── documents/              # Document intelligence components
│   │   ├── document-upload.tsx
│   │   ├── document-analysis.tsx
│   │   └── extracted-data.tsx
│   ├── premium/                # Premium feature components
│   │   ├── subscription-plans.tsx
│   │   ├── implementation-guide.tsx
│   │   ├── progress-tracker.tsx
│   │   └── upgrade-prompt.tsx
│   ├── dashboard/              # Dashboard components
│   │   ├── dashboard-layout.tsx
│   │   ├── metrics-overview.tsx
│   │   ├── recent-evaluations.tsx
│   │   └── market-intelligence.tsx
│   └── charts/                 # Data visualization components
│       ├── valuation-chart.tsx
│       ├── health-trend-chart.tsx
│       └── progress-chart.tsx
```

### State Management Architecture

Using Zustand for lightweight, TypeScript-native state management with separate stores for auth, subscriptions, evaluations, and progress tracking.

### Routing Architecture

Next.js 14+ App Router with protected route groups and server-side authentication checks.

## Backend Architecture

### Service Architecture

Traditional Next.js API routes with persistent server processes organized by feature domains (auth, evaluations, documents, subscriptions, progress).

### Database Architecture

Repository pattern implementation with BaseRepository class and specialized repositories for each domain entity, providing clean data access layer with type safety.

### Authentication and Authorization

JWT-based authentication with Supabase integration, comprehensive middleware for auth, rate limiting, and error handling.

## Unified Project Structure

```plaintext
goodbuy-hq/
├── .github/                    # CI/CD workflows
│   └── workflows/
│       ├── ci.yaml
│       ├── deploy.yaml
│       └── tests.yaml
├── apps/                       # Application packages
│   └── web/                    # Next.js fullstack application
│       ├── src/
│       │   ├── app/            # Next.js 14+ App Router
│       │   │   ├── (auth)/     # Auth route group
│       │   │   ├── (dashboard)/ # Protected dashboard routes
│       │   │   ├── api/        # Backend API routes
│       │   │   ├── globals.css
│       │   │   ├── layout.tsx
│       │   │   └── page.tsx
│       │   ├── components/     # UI components
│       │   ├── hooks/          # Custom React hooks
│       │   ├── lib/            # Utility libraries
│       │   │   ├── services/   # Backend service classes
│       │   │   ├── repositories/ # Data access layer
│       │   │   ├── middleware/ # API middleware
│       │   │   └── utils/      # Utility functions
│       │   ├── stores/         # Zustand state management
│       │   ├── styles/         # Global styles and themes
│       │   └── types/          # TypeScript type definitions
│       ├── public/             # Static assets
│       ├── tests/              # Application tests
│       └── package.json
├── packages/                   # Shared packages
│   ├── shared/                 # Shared types/utilities
│   ├── ui/                     # Shared UI components
│   └── config/                 # Shared configuration
├── infrastructure/             # Infrastructure as Code
├── scripts/                    # Build/deploy scripts
├── docs/                       # Documentation
├── .env.example                # Environment template
├── package.json                # Root package.json with workspaces
└── README.md                  # Project documentation
```

## Development Workflow

### Local Development Setup

#### Prerequisites

```bash
# Node.js and npm
node --version  # v20.0.0 or higher
npm --version   # v10.0.0 or higher

# Supabase CLI
npm install -g supabase
supabase --version

# Git for version control
git --version
```

#### Initial Setup

```bash
# Clone repository
git clone <repository-url>
cd goodbuy-hq

# Install dependencies for all workspaces
npm install

# Copy environment template
cp .env.example .env.local
cp apps/web/.env.local.example apps/web/.env.local

# Setup Supabase local development
supabase init
supabase start

# Run database migrations
npm run db:migrate

# Seed development data
npm run db:seed
```

#### Development Commands

```bash
# Start all services (Next.js dev server + Supabase)
npm run dev

# Run tests
npm run test              # All workspace tests
npm run test:unit         # Unit tests only
npm run test:integration  # Integration tests only
npm run test:e2e          # End-to-end tests only

# Code quality
npm run lint              # ESLint across all workspaces
npm run type-check        # TypeScript compilation check
npm run format            # Prettier code formatting
```

### Environment Configuration

#### Required Environment Variables

```bash
# Frontend (.env.local)
NEXT_PUBLIC_SUPABASE_URL=http://localhost:54321
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_...
NEXT_PUBLIC_SITE_URL=http://localhost:3000

# Backend (.env)
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_key
STRIPE_SECRET_KEY=sk_test_...
CLAUDE_API_KEY=sk-ant-...
UPSTASH_REDIS_REST_URL=https://your-redis.upstash.io
UPSTASH_REDIS_REST_TOKEN=your_redis_token

# Shared
DATABASE_URL=postgresql://postgres:postgres@localhost:54432/postgres
NODE_ENV=development
```

## Deployment Architecture

### Deployment Strategy

**Frontend Deployment:**
- **Platform:** Vercel (Traditional Server Mode)
- **Build Command:** `npm run build`
- **Output Directory:** `.next` (Next.js build output)
- **CDN/Edge:** Vercel Global Edge Network with automatic static asset optimization

**Backend Deployment:**
- **Platform:** Vercel Functions (Traditional Server Runtime)
- **Build Command:** `npm run build` (includes API routes)
- **Deployment Method:** Git-based continuous deployment with preview environments

### CI/CD Pipeline

Comprehensive GitHub Actions workflow with testing, building, security scanning, and automated deployment to staging and production environments.

### Environments

| Environment | Frontend URL | Backend URL | Purpose |
|-------------|-------------|-------------|---------|
| Development | http://localhost:3000 | http://localhost:3000/api | Local development |
| Staging | https://goodbuy-hq-staging.vercel.app | https://goodbuy-hq-staging.vercel.app/api | Pre-production testing |
| Production | https://goodbuy-hq.com | https://goodbuy-hq.com/api | Live environment |

## Security and Performance

### Security Requirements

**Frontend Security:**
- CSP Headers: Strict content security policy with allowed sources for Claude API, Supabase, and Stripe
- XSS Prevention: Input sanitization with DOMPurify, CSP enforcement, React's built-in protection
- Secure Storage: JWT tokens in httpOnly cookies, encrypted localStorage, automatic token rotation

**Backend Security:**
- Input Validation: Zod schema validation on all endpoints, SQL injection prevention through RLS
- Rate Limiting: Tiered rate limiting based on user type and endpoint sensitivity
- CORS Policy: Restricted origins with credentials support

**Authentication Security:**
- Token Storage: Secure httpOnly cookies with SameSite=strict
- Session Management: Supabase Auth with refresh tokens, concurrent session limits
- Password Policy: Strong password requirements with complexity validation

### Performance Optimization

**Frontend Performance:**
- Bundle Size Target: <500KB initial bundle, <2MB total assets
- Loading Strategy: Lazy loading, image optimization, progressive enhancement
- Caching Strategy: Browser caching, SWR for data, service worker for offline

**Backend Performance:**
- Response Time Target: <200ms for queries, <3s for AI processing, <500ms for auth
- Database Optimization: Indexed queries, connection pooling, query optimization
- Caching Strategy: Redis for AI responses, database query caching, CDN for static content

## Testing Strategy

### Testing Pyramid

```text
        E2E Tests (Playwright)
       /                    \
    Integration Tests (Vitest + Supertest)
   /                              \
Frontend Unit Tests          Backend Unit Tests
   (Vitest + RTL)              (Vitest + Node)
```

### Test Organization

Comprehensive test structure covering components, API routes, services, and end-to-end user journeys with 90%+ coverage for critical business logic.

## Coding Standards

### Critical Fullstack Rules

- **Type Sharing:** Always define types in packages/shared and import from there
- **API Calls:** Never make direct HTTP calls - use the service layer
- **Environment Variables:** Access only through config objects, never process.env directly
- **Error Handling:** All API routes must use the standard error handler
- **State Updates:** Never mutate state directly - use proper state management patterns
- **Auth Context:** Always check authentication through hooks, never access auth state directly
- **Premium Features:** Gate premium content through subscription checks, not UI hiding
- **Database Access:** Use repository pattern, never direct Supabase calls in API routes
- **AI Processing:** Always include confidence scores and methodology explanations
- **Input Validation:** Use Zod schemas for all API input validation

### Naming Conventions

| Element | Frontend | Backend | Example |
|---------|----------|---------|---------|
| Components | PascalCase | - | `EvaluationForm.tsx` |
| Hooks | camelCase with 'use' | - | `useAuthStore.ts` |
| API Routes | - | kebab-case | `/api/business-evaluations` |
| Database Tables | - | snake_case | `business_evaluations` |

## Error Handling Strategy

### Error Flow

Comprehensive error handling with standardized error responses, user-friendly messaging, full traceability through request IDs, and automatic retry logic for transient failures.

### Error Response Format

```typescript
interface ApiError {
  error: {
    code: string;
    message: string;
    details?: Record<string, any>;
    timestamp: string;
    requestId: string;
  };
}
```

### Frontend Error Handling

React Error Boundaries with graceful fallbacks and comprehensive error tracking integrated with monitoring services.

### Backend Error Handling

Structured error classes with appropriate HTTP status codes, comprehensive logging, and retry logic for external service failures.

## Monitoring and Observability

### Monitoring Stack

- **Frontend Monitoring:** Vercel Analytics for performance metrics, Core Web Vitals tracking
- **Backend Monitoring:** Vercel Functions monitoring for API response times, error rates
- **Error Tracking:** Sentry for comprehensive error tracking and performance monitoring
- **Performance Monitoring:** Web Vitals monitoring and AI processing time tracking

### Key Metrics

**Frontend Metrics:**
- Core Web Vitals (LCP <2.5s, FID <100ms, CLS <0.1)
- JavaScript errors and API response times
- User interaction tracking for conversion optimization

**Backend Metrics:**
- Request rate, error rate, response time percentiles
- Database query performance and AI processing metrics
- Subscription conversion tracking and business metrics

**Infrastructure Metrics:**
- Memory usage, CPU utilization, database connection pool utilization
- Redis cache performance and external API success rates

---

## Summary

This comprehensive fullstack architecture document provides the complete technical foundation for GoodBuy HQ's AI-powered business valuation platform. The architecture supports:

- **AI-First Design:** Optimized for consistent AI processing with <3 second response times
- **Premium Business Model:** Built-in subscription management and feature gating
- **Scalable Foundation:** Traditional server architecture that can scale to enterprise needs
- **Developer Experience:** Modern tooling optimized for rapid AI-driven development
- **Security & Compliance:** Enterprise-grade security with data privacy protection
- **Monitoring & Observability:** Comprehensive monitoring for business and technical metrics

The architecture successfully addresses all requirements from the updated PRD v2.0, providing a solid foundation for the 12-16 week MVP development timeline and future platform expansion.