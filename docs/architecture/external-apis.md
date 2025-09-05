# External APIs

## Claude AI API

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

## Stripe Payments API

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

## Supabase Services

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
