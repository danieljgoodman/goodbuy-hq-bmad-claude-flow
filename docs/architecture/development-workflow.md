# Development Workflow

## Local Development Setup

### Prerequisites

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

### Initial Setup

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

# Seed realistic development data (NO MOCK DATA - use real data structures)
npm run db:seed
```

### Development Commands

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

## Environment Configuration

### Required Environment Variables

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

## Data Policy

### Critical: No Mock Data Rule
- **Production Code:** Never implement functionality with mock/placeholder data
- **Development:** Use realistic data that matches production data structures
- **APIs:** Always implement real data fetching, never return hardcoded mock responses
- **Components:** Build with real data integration from day one
