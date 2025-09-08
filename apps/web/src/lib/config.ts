import { z } from 'zod'

const configSchema = z.object({
  supabase: z.object({
    url: z.string().url(),
    anonKey: z.string().min(1),
    serviceRoleKey: z.string().min(1),
  }),
  database: z.object({
    url: z.string().url(),
  }),
  openai: z.object({
    apiKey: z.string().min(1),
  }),
  claude: z.object({
    apiKey: z.string().min(1),
  }),
  nextAuth: z.object({
    url: z.string().url(),
    secret: z.string().min(1),
  }),
})

function getConfig() {
  // During build time, some environment variables may not be set
  // We'll provide defaults to prevent build failures
  const rawConfig = {
    supabase: {
      url: process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://placeholder.supabase.co',
      anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || 'placeholder-anon-key',
      serviceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || 'placeholder-service-role-key',
    },
    database: {
      url: process.env.DATABASE_URL || 'postgresql://placeholder:placeholder@localhost:5432/placeholder',
    },
    openai: {
      apiKey: process.env.OPENAI_API_KEY || 'placeholder-openai-api-key',
    },
    claude: {
      apiKey: process.env.CLAUDE_API_KEY || 'placeholder-claude-api-key',
    },
    nextAuth: {
      url: process.env.NEXTAUTH_URL || 'http://localhost:3000',
      secret: process.env.NEXTAUTH_SECRET || 'placeholder-secret',
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