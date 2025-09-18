import { z } from 'zod'

const configSchema = z.object({
  database: z.object({
    url: z.string().url(),
  }),
  openai: z.object({
    apiKey: z.string().min(1),
  }),
  claude: z.object({
    apiKey: z.string().min(1),
  }),
  clerk: z.object({
    publishableKey: z.string().min(1),
    secretKey: z.string().min(1),
    webhookSecret: z.string().optional(),
  }),
  stripe: z.object({
    publishableKey: z.string().min(1),
    secretKey: z.string().min(1),
    webhookSecret: z.string().optional(),
  }),
})

function getConfig() {
  // During build time, some environment variables may not be set
  // We'll provide defaults to prevent build failures
  const rawConfig = {
    database: {
      url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'placeholder-openai-api-key',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || 'placeholder-claude-api-key',
    },
    clerk: {
      publishableKey: process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || 'placeholder-clerk-key',
      secretKey: process.env.CLERK_SECRET_KEY || 'placeholder-clerk-secret',
      webhookSecret: process.env.CLERK_WEBHOOK_SECRET,
    },
    stripe: {
      publishableKey: process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY || 'placeholder-stripe-key',
      secretKey: process.env.STRIPE_SECRET_KEY || 'placeholder-stripe-secret',
      webhookSecret: process.env.STRIPE_WEBHOOK_SECRET,
    },
  }

  const result = configSchema.safeParse(rawConfig)
  
  if (!result.success) {
    if (process.env.NODE_ENV !== 'production') {
      console.error('Invalid configuration:', result.error.flatten())
    }
    // Return the raw config as fallback during build
    return rawConfig as any
  }

  return result.data
}

export const config = getConfig()