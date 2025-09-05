# Unified Project Structure

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
