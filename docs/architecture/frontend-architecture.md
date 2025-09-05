# Frontend Architecture

## Component Architecture

### Component Organization

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

## State Management Architecture

Using Zustand for lightweight, TypeScript-native state management with separate stores for auth, subscriptions, evaluations, and progress tracking.

## Routing Architecture

Next.js 14+ App Router with protected route groups and server-side authentication checks.
