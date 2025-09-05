# Technical Assumptions

## Repository Structure: Monorepo
Single repository containing frontend, backend API routes, shared utilities, and AI processing modules following BMAD methodology for organized development and deployment. This approach enables rapid development with Claude Code while maintaining clear separation of concerns and supporting the aggressive 12-16 week MVP timeline.

## Service Architecture
**Traditional server-based architecture** using Next.js with dedicated backend services for consistent performance and reliable AI processing. Core components include:
- **AI Valuation Engine**: Multi-methodology business analysis with industry-specific models requiring consistent processing power
- **Document Intelligence Service**: AI-powered financial statement extraction and analysis with persistent processing capabilities
- **Health Scoring System**: Automated business health calculation with real-time updates and consistent response times
- **Market Intelligence Module**: Industry trend analysis and competitive positioning with reliable data processing
- **User Management Service**: Authentication, progress tracking, and subscription management
- **Payment Processing Integration**: Stripe-based subscription and billing management
- **Data Storage Layer**: Secure business data handling with encryption and compliance features

The server-based approach ensures:
- **Consistent AI Processing Performance**: No cold start delays for the critical <3 second response requirement
- **Persistent Connections**: Reliable database connections and AI service integration
- **Predictable Scaling**: More controlled resource management for AI-intensive workloads
- **Session Management**: Better handling of complex user workflows and data processing states

## Testing Requirements
Comprehensive testing pyramid optimized for AI-powered functionality including:
- **Unit Tests**: 90%+ coverage for core business logic, AI processing algorithms, and financial calculations with focus on edge cases and accuracy validation
- **Integration Tests**: AI processing workflows, payment integration, document processing pipelines, and third-party API interactions
- **End-to-End Tests**: Critical user journeys including evaluation completion, premium conversion, and progress tracking workflows
- **AI Accuracy Testing**: Validation framework for AI-generated valuations against known benchmarks and professional standards
- **Manual Testing Convenience**: Developer-friendly testing utilities for rapid iteration during AI model refinement and feature development

## Additional Technical Assumptions and Requests

**Core Technology Stack:**
- **Frontend Framework**: Next.js 14+ with TypeScript strict mode for type safety and modern React features
- **Backend Architecture**: Traditional Next.js API routes with persistent server processes for reliable AI processing
- **UI Components**: ShadCN/ui component library with TweakCN color system integration for rapid design iteration and professional appearance
- **Styling System**: Tailwind CSS for responsive design with custom configuration supporting business dashboard aesthetics
- **Database**: PostgreSQL with Prisma ORM for type-safe database operations, migrations, and complex business data modeling
- **Authentication & Database Hosting**: Supabase for scalable authentication services and managed PostgreSQL with real-time capabilities
- **Deployment & Hosting**: Vercel with traditional server deployment for consistent performance

**AI & Processing Infrastructure:**
- **Primary AI Integration**: Claude API for business analysis, valuation methodologies, and recommendation generation with persistent connection management
- **Document Processing**: AI-powered financial statement analysis with OCR capabilities for uploaded documents
- **Performance Optimization**: Connection pooling, AI request optimization, and efficient caching for sub-3-second processing requirements

**Business & Integration Services:**
- **Payment Processing**: Stripe integration for subscription management, trial-to-paid conversion tracking, and billing automation
- **Email Service**: Transactional email system for onboarding sequences, progress updates, billing notifications, and improvement reminders
- **Analytics & Monitoring**: User behavior tracking for conversion optimization, AI accuracy monitoring, and feature usage insights
- **Security & Compliance**: Data encryption at rest and in transit, SOC 2 compliance preparation, and secure API authentication patterns

**Development & Deployment:**
- **Code Quality**: ESLint, Prettier, and pre-commit hooks with TypeScript strict mode enforcement
- **Version Control**: Git with automated deployment pipelines and feature branch workflows
- **Server Monitoring**: Application performance monitoring, AI processing latency tracking, error reporting, and resource utilization
- **Color System Management**: TweakCN MCP integration for rapid color palette iteration through colors.md configuration file enabling quick brand and theme adjustments
