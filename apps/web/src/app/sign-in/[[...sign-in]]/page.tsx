import { SignIn } from '@clerk/nextjs'

export default function SignInPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground">GoodBuy HQ</h1>
          <p className="text-muted-foreground mt-2">
            AI-Powered Business Intelligence
          </p>
        </div>
        <SignIn
          appearance={{
            elements: {
              rootBox: 'mx-auto',
              card: 'bg-card border-border shadow-lg',
              headerTitle: 'text-foreground',
              headerSubtitle: 'text-muted-foreground',
              formButtonPrimary: 'bg-primary hover:bg-primary/90',
              formFieldInput: 'bg-background border-input',
              formFieldLabel: 'text-foreground',
              footerActionLink: 'text-primary hover:text-primary/90',
              identityPreviewText: 'text-foreground',
              identityPreviewEditButton: 'text-primary hover:text-primary/90',
            },
          }}
          redirectUrl="/dashboard"
          signUpUrl="/sign-up"
        />
      </div>
    </div>
  )
}