import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Navbar from '@/components/layout/navbar'
import EnhancedNavbar from '@/components/layout/enhanced-navbar'
import BreadcrumbNavigation from '@/components/layout/breadcrumb-navigation'
import { NavigationProvider } from '@/contexts/navigation-context'
import { OnboardingProvider } from '@/contexts/onboarding-context'
import { HelpProvider } from '@/contexts/help-context'
import { AccessibilityProvider, SkipLinks } from '@/contexts/accessibility-context'
import { AuthInitializer } from '@/components/providers/auth-initializer'
import OnboardingModal from '@/components/onboarding/onboarding-modal'
import SmartHelpTrigger from '@/components/help/smart-help-trigger'
import './globals.css'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GoodBuy HQ - AI-Powered Business Valuations',
  description: 'Get instant AI-powered business valuations and improvement recommendations',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  // Feature flag for enhanced navigation (Story 9.6a)
  const USE_ENHANCED_NAVIGATION = process.env.NEXT_PUBLIC_EPIC9_6A_ENABLED === 'true'
  
  return (
    <html lang="en">
      <body className={inter.className}>
        <AccessibilityProvider>
          <NavigationProvider>
            <OnboardingProvider>
              <HelpProvider>
                <SmartHelpTrigger>
                  <SkipLinks />
                  <AuthInitializer />
                  {USE_ENHANCED_NAVIGATION ? <EnhancedNavbar /> : <Navbar />}
                  {USE_ENHANCED_NAVIGATION && <BreadcrumbNavigation />}
                  <main role="main" id="main-content" tabIndex={-1}>
                    {children}
                  </main>
                  <OnboardingModal />
                </SmartHelpTrigger>
              </HelpProvider>
            </OnboardingProvider>
          </NavigationProvider>
        </AccessibilityProvider>
      </body>
    </html>
  )
}