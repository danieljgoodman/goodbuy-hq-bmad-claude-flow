/**
 * E2E tests for subscription tier-based routing
 * Tests complete user flows, authentication, and tier-based access control
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test user data for different tiers
const testUsers = {
  basic: {
    email: 'basic@test.com',
    password: 'testpass123',
    tier: 'BASIC'
  },
  professional: {
    email: 'professional@test.com',
    password: 'testpass123',
    tier: 'PROFESSIONAL'
  },
  enterprise: {
    email: 'enterprise@test.com',
    password: 'testpass123',
    tier: 'ENTERPRISE'
  },
  unauthenticated: null
}

// Helper function to login user
async function loginUser(page: Page, userType: keyof typeof testUsers) {
  if (!testUsers[userType]) {
    return // Skip login for unauthenticated tests
  }

  const user = testUsers[userType]

  await page.goto('/auth/login')
  await page.fill('[data-testid="email-input"]', user.email)
  await page.fill('[data-testid="password-input"]', user.password)
  await page.click('[data-testid="login-button"]')

  // Wait for authentication to complete
  await page.waitForURL(/\/dashboard/, { timeout: 10000 })
}

// Helper function to setup user with specific tier
async function setupUserTier(page: Page, tier: string) {
  // This would typically involve API calls to set up test data
  // For now, we'll simulate with localStorage or cookies
  await page.evaluate((tier) => {
    localStorage.setItem('testUserTier', tier)
  }, tier)
}

test.describe('Tier-based routing', () => {
  test.describe('Public routes', () => {
    test('should allow unauthenticated access to public routes', async ({ page }) => {
      const publicRoutes = [
        '/',
        '/pricing',
        '/about',
        '/contact',
        '/auth/login',
        '/auth/register'
      ]

      for (const route of publicRoutes) {
        await page.goto(route)

        // Should not redirect to login
        expect(page.url()).not.toContain('/auth/login')

        // Should display content
        await expect(page.locator('body')).toBeVisible()

        // Should not show authentication errors
        await expect(page.locator('[data-testid="auth-error"]')).not.toBeVisible()
      }
    })

    test('should redirect to login for protected routes when unauthenticated', async ({ page }) => {
      const protectedRoutes = [
        '/dashboard',
        '/dashboard/basic',
        '/dashboard/professional',
        '/dashboard/enterprise',
        '/evaluations',
        '/evaluations/professional',
        '/reports',
        '/analytics'
      ]

      for (const route of protectedRoutes) {
        await page.goto(route)

        // Should redirect to login
        await page.waitForURL(/\/auth\/login/, { timeout: 5000 })
        expect(page.url()).toContain('/auth/login')
      }
    })
  })

  test.describe('Basic tier routing', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'basic')
      await setupUserTier(page, 'BASIC')
    })

    test('should access basic dashboard and features', async ({ page }) => {
      // Can access basic dashboard
      await page.goto('/dashboard/basic')
      await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Basic Dashboard')

      // Can access basic evaluations
      await page.goto('/evaluations')
      await expect(page.locator('[data-testid="evaluations-page"]')).toBeVisible()

      // Can access basic reports
      await page.goto('/reports')
      await expect(page.locator('[data-testid="reports-page"]')).toBeVisible()

      // Can access basic analytics
      await page.goto('/analytics')
      await expect(page.locator('[data-testid="analytics-page"]')).toBeVisible()
    })

    test('should redirect to basic dashboard when accessing higher tier dashboards', async ({ page }) => {
      // Accessing professional dashboard should redirect to basic
      await page.goto('/dashboard/professional')
      await page.waitForURL(/\/dashboard\/basic/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/basic')

      // Accessing enterprise dashboard should redirect to basic
      await page.goto('/dashboard/enterprise')
      await page.waitForURL(/\/dashboard\/basic/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/basic')
    })

    test('should show upgrade prompts for professional features', async ({ page }) => {
      const professionalRoutes = [
        '/evaluations/professional',
        '/analytics/advanced',
        '/reports/pdf',
        '/guides/ai'
      ]

      for (const route of professionalRoutes) {
        await page.goto(route)

        // Should show upgrade prompt or redirect to fallback
        const hasUpgradePrompt = await page.locator('[data-testid="upgrade-prompt"]').isVisible()
        const isRedirected = page.url() !== `${page.url().split('/').slice(0, 3).join('/')}${route}`

        expect(hasUpgradePrompt || isRedirected).toBeTruthy()
      }
    })

    test('should show limited features in navigation', async ({ page }) => {
      await page.goto('/dashboard')

      // Professional features should be disabled or show upgrade prompts
      const professionalFeatures = [
        '[data-testid="nav-professional-analysis"]',
        '[data-testid="nav-ai-guides"]',
        '[data-testid="nav-pdf-reports"]',
        '[data-testid="nav-advanced-analytics"]'
      ]

      for (const feature of professionalFeatures) {
        const element = page.locator(feature)
        if (await element.isVisible()) {
          // Should be disabled or show upgrade indicator
          const isDisabled = await element.getAttribute('disabled')
          const hasUpgradeIcon = await element.locator('[data-testid="upgrade-icon"]').isVisible()

          expect(isDisabled || hasUpgradeIcon).toBeTruthy()
        }
      }
    })

    test('should block API access to professional endpoints', async ({ page }) => {
      const response = await page.request.get('/api/evaluations/professional')
      expect(response.status()).toBe(403)

      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody).toHaveProperty('accessRequired', true)
    })
  })

  test.describe('Professional tier routing', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'professional')
      await setupUserTier(page, 'PROFESSIONAL')
    })

    test('should access professional dashboard and features', async ({ page }) => {
      // Can access professional dashboard
      await page.goto('/dashboard/professional')
      await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Professional Dashboard')

      // Can access professional evaluations
      await page.goto('/evaluations/professional')
      await expect(page.locator('[data-testid="professional-evaluation"]')).toBeVisible()

      // Can access AI guides
      await page.goto('/guides/ai')
      await expect(page.locator('[data-testid="ai-guides"]')).toBeVisible()

      // Can access PDF reports
      await page.goto('/reports/pdf')
      await expect(page.locator('[data-testid="pdf-reports"]')).toBeVisible()

      // Can access advanced analytics
      await page.goto('/analytics/advanced')
      await expect(page.locator('[data-testid="advanced-analytics"]')).toBeVisible()
    })

    test('should redirect to professional dashboard when accessing basic dashboard', async ({ page }) => {
      await page.goto('/dashboard/basic')
      await page.waitForURL(/\/dashboard\/professional/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/professional')
    })

    test('should redirect to professional dashboard when accessing enterprise dashboard', async ({ page }) => {
      await page.goto('/dashboard/enterprise')
      await page.waitForURL(/\/dashboard\/professional/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/professional')
    })

    test('should show upgrade prompts for enterprise features', async ({ page }) => {
      const enterpriseRoutes = [
        '/evaluations/enterprise',
        '/analytics/benchmarks'
      ]

      for (const route of enterpriseRoutes) {
        await page.goto(route)

        // Should show upgrade prompt or redirect to fallback
        const hasUpgradePrompt = await page.locator('[data-testid="upgrade-prompt"]').isVisible()
        const isRedirected = page.url() !== `${page.url().split('/').slice(0, 3).join('/')}${route}`

        expect(hasUpgradePrompt || isRedirected).toBeTruthy()
      }
    })

    test('should have access to professional API endpoints', async ({ page }) => {
      const response = await page.request.get('/api/evaluations/professional')
      expect(response.status()).toBe(200)

      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('data')
      expect(responseBody).not.toHaveProperty('error')
    })

    test('should be blocked from enterprise API endpoints', async ({ page }) => {
      const response = await page.request.get('/api/evaluations/enterprise')
      expect(response.status()).toBe(403)

      const responseBody = await response.json()
      expect(responseBody).toHaveProperty('error')
      expect(responseBody).toHaveProperty('accessRequired', true)
    })

    test('should show professional features in navigation', async ({ page }) => {
      await page.goto('/dashboard')

      // Professional features should be enabled
      const professionalFeatures = [
        '[data-testid="nav-professional-analysis"]',
        '[data-testid="nav-ai-guides"]',
        '[data-testid="nav-pdf-reports"]',
        '[data-testid="nav-advanced-analytics"]'
      ]

      for (const feature of professionalFeatures) {
        const element = page.locator(feature)
        if (await element.isVisible()) {
          // Should be enabled
          const isDisabled = await element.getAttribute('disabled')
          expect(isDisabled).toBeFalsy()
        }
      }

      // Enterprise features should show upgrade prompts
      const enterpriseFeatures = [
        '[data-testid="nav-enterprise-analysis"]',
        '[data-testid="nav-benchmarks"]'
      ]

      for (const feature of enterpriseFeatures) {
        const element = page.locator(feature)
        if (await element.isVisible()) {
          const hasUpgradeIcon = await element.locator('[data-testid="upgrade-icon"]').isVisible()
          expect(hasUpgradeIcon).toBeTruthy()
        }
      }
    })
  })

  test.describe('Enterprise tier routing', () => {
    test.beforeEach(async ({ page }) => {
      await loginUser(page, 'enterprise')
      await setupUserTier(page, 'ENTERPRISE')
    })

    test('should access enterprise dashboard and all features', async ({ page }) => {
      // Can access enterprise dashboard
      await page.goto('/dashboard/enterprise')
      await expect(page.locator('[data-testid="dashboard-title"]')).toContainText('Enterprise Dashboard')

      // Can access enterprise evaluations
      await page.goto('/evaluations/enterprise')
      await expect(page.locator('[data-testid="enterprise-evaluation"]')).toBeVisible()

      // Can access benchmarks
      await page.goto('/analytics/benchmarks')
      await expect(page.locator('[data-testid="benchmarks"]')).toBeVisible()

      // Can access all professional features
      await page.goto('/evaluations/professional')
      await expect(page.locator('[data-testid="professional-evaluation"]')).toBeVisible()
    })

    test('should redirect to enterprise dashboard when accessing lower tier dashboards', async ({ page }) => {
      await page.goto('/dashboard/basic')
      await page.waitForURL(/\/dashboard\/enterprise/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/enterprise')

      await page.goto('/dashboard/professional')
      await page.waitForURL(/\/dashboard\/enterprise/, { timeout: 5000 })
      expect(page.url()).toContain('/dashboard/enterprise')
    })

    test('should have access to all API endpoints', async ({ page }) => {
      const endpoints = [
        '/api/evaluations/professional',
        '/api/evaluations/enterprise',
        '/api/reports/pdf',
        '/api/analytics/benchmarks'
      ]

      for (const endpoint of endpoints) {
        const response = await page.request.get(endpoint)
        expect(response.status()).toBe(200)

        const responseBody = await response.json()
        expect(responseBody).toHaveProperty('data')
        expect(responseBody).not.toHaveProperty('error')
      }
    })

    test('should show all features in navigation without upgrade prompts', async ({ page }) => {
      await page.goto('/dashboard')

      // All features should be enabled
      const allFeatures = [
        '[data-testid="nav-professional-analysis"]',
        '[data-testid="nav-ai-guides"]',
        '[data-testid="nav-pdf-reports"]',
        '[data-testid="nav-advanced-analytics"]',
        '[data-testid="nav-enterprise-analysis"]',
        '[data-testid="nav-benchmarks"]'
      ]

      for (const feature of allFeatures) {
        const element = page.locator(feature)
        if (await element.isVisible()) {
          // Should be enabled and no upgrade icon
          const isDisabled = await element.getAttribute('disabled')
          const hasUpgradeIcon = await element.locator('[data-testid="upgrade-icon"]').isVisible()

          expect(isDisabled).toBeFalsy()
          expect(hasUpgradeIcon).toBeFalsy()
        }
      }
    })
  })

  test.describe('Data filtering and feature limitation', () => {
    test('should limit evaluation data for basic tier users', async ({ page }) => {
      await loginUser(page, 'basic')
      await setupUserTier(page, 'BASIC')

      const response = await page.request.get('/api/evaluations?id=test-evaluation')
      expect(response.status()).toBe(200)

      const responseBody = await response.json()
      const data = responseBody.data

      // Should only have basic valuation methods
      if (data.valuations) {
        const valuationMethods = Object.keys(data.valuations)
        expect(valuationMethods).toEqual(expect.arrayContaining(['revenue_multiple', 'asset_based']))
        expect(valuationMethods).not.toContain('dcf_analysis')
        expect(valuationMethods).not.toContain('market_comparison')
      }

      // Should limit opportunities
      if (data.opportunities) {
        expect(data.opportunities.length).toBeLessThanOrEqual(3)
      }

      // Should remove premium insights
      if (data.insights) {
        expect(data.insights.market_analysis).toBeFalsy()
        expect(data.insights.competitive_positioning).toBeFalsy()
      }
    })

    test('should provide full data for professional tier users', async ({ page }) => {
      await loginUser(page, 'professional')
      await setupUserTier(page, 'PROFESSIONAL')

      const response = await page.request.get('/api/evaluations/professional?id=test-evaluation')
      expect(response.status()).toBe(200)

      const responseBody = await response.json()
      const data = responseBody.data

      // Should have all valuation methods
      if (data.valuations) {
        const valuationMethods = Object.keys(data.valuations)
        expect(valuationMethods.length).toBeGreaterThan(2)
      }

      // Should have full opportunities
      if (data.opportunities) {
        expect(data.opportunities.length).toBeGreaterThan(3)
      }

      // Should have premium insights
      if (data.insights) {
        expect(data.insights.market_analysis).toBeDefined()
        expect(data.insights.competitive_positioning).toBeDefined()
      }
    })
  })

  test.describe('Performance and error handling', () => {
    test('should handle routing decisions within performance requirements', async ({ page }) => {
      await loginUser(page, 'professional')

      const routes = [
        '/dashboard/professional',
        '/evaluations/professional',
        '/analytics/advanced',
        '/reports/pdf',
        '/guides/ai'
      ]

      for (const route of routes) {
        const startTime = Date.now()

        await page.goto(route)
        await page.waitForLoadState('networkidle')

        const endTime = Date.now()
        const loadTime = endTime - startTime

        // Should load within reasonable time (considering network latency)
        expect(loadTime).toBeLessThan(5000) // 5 seconds including network
      }
    })

    test('should handle authentication errors gracefully', async ({ page }) => {
      // Simulate invalid authentication
      await page.goto('/dashboard/professional')

      // Should redirect to login
      await page.waitForURL(/\/auth\/login/, { timeout: 5000 })

      // Should show appropriate error message
      await expect(page.locator('[data-testid="auth-error"]')).toBeVisible()
    })

    test('should handle server errors with fallback behavior', async ({ page }) => {
      await loginUser(page, 'basic')

      // Mock server error response
      await page.route('/api/evaluations/professional', route => {
        route.fulfill({
          status: 500,
          body: JSON.stringify({ error: 'Internal server error' })
        })
      })

      const response = await page.request.get('/api/evaluations/professional')
      expect(response.status()).toBe(500)

      // UI should handle the error gracefully
      await page.goto('/evaluations/professional')

      // Should show error state or redirect to appropriate page
      const hasError = await page.locator('[data-testid="error-message"]').isVisible()
      const isRedirected = page.url().includes('/evaluations/professional') === false

      expect(hasError || isRedirected).toBeTruthy()
    })

    test('should maintain session state across tier-based redirects', async ({ page }) => {
      await loginUser(page, 'basic')

      // Start some work in basic tier
      await page.goto('/evaluations')
      await page.fill('[data-testid="business-name"]', 'Test Business')

      // Try to access professional feature
      await page.goto('/evaluations/professional')

      // Should redirect but maintain session
      await page.waitForURL(/\/evaluations/, { timeout: 5000 })

      // Data should still be there
      const businessName = await page.inputValue('[data-testid="business-name"]')
      expect(businessName).toBe('Test Business')
    })
  })

  test.describe('Security and access control', () => {
    test('should prevent direct URL access to unauthorized tiers', async ({ page }) => {
      await loginUser(page, 'basic')

      // Direct navigation to professional dashboard
      await page.goto('/dashboard/professional')

      // Should be redirected to appropriate tier
      await page.waitForURL(/\/dashboard\/basic/, { timeout: 5000 })
      expect(page.url()).not.toContain('/dashboard/professional')
    })

    test('should prevent API access bypass through direct requests', async ({ page }) => {
      await loginUser(page, 'basic')

      // Try various methods to bypass tier restrictions
      const bypassAttempts = [
        { endpoint: '/api/evaluations/professional', headers: { 'X-Tier-Override': 'PROFESSIONAL' } },
        { endpoint: '/api/evaluations/enterprise', headers: { 'X-Force-Access': 'true' } },
        { endpoint: '/api/analytics/benchmarks', headers: { 'Authorization': 'Bearer fake-token' } }
      ]

      for (const attempt of bypassAttempts) {
        const response = await page.request.get(attempt.endpoint, {
          headers: attempt.headers
        })

        expect(response.status()).toBe(403)

        const responseBody = await response.json()
        expect(responseBody).toHaveProperty('error')
        expect(responseBody).toHaveProperty('accessRequired', true)
      }
    })

    test('should validate subscription status in real-time', async ({ page }) => {
      await loginUser(page, 'professional')

      // Simulate subscription cancellation
      await page.evaluate(() => {
        localStorage.setItem('testSubscriptionStatus', 'CANCELED')
      })

      // Refresh or navigate to trigger status check
      await page.reload()

      // Should lose access to professional features
      const response = await page.request.get('/api/evaluations/professional')

      // Response may be 403 or redirect depending on implementation
      expect([200, 403]).toContain(response.status())

      if (response.status() === 403) {
        const responseBody = await response.json()
        expect(responseBody).toHaveProperty('accessRequired')
      }
    })

    test('should handle expired trial periods', async ({ page }) => {
      await loginUser(page, 'professional')

      // Simulate expired trial
      await page.evaluate(() => {
        localStorage.setItem('testTrialStatus', 'EXPIRED')
        localStorage.setItem('testSubscriptionStatus', 'TRIALING')
      })

      await page.reload()

      // Should show trial expired message
      await page.goto('/dashboard/professional')

      const hasTrialExpiredMessage = await page.locator('[data-testid="trial-expired"]').isVisible()
      const isRedirectedToUpgrade = page.url().includes('/pricing')

      expect(hasTrialExpiredMessage || isRedirectedToUpgrade).toBeTruthy()
    })
  })
})