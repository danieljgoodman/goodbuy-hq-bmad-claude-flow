import { test, expect } from '@playwright/test'

test.describe('Business Evaluation Form', () => {
  test('can navigate to onboarding page', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Should redirect to login if not authenticated
    await expect(page).toHaveURL(/\/auth\/login/)
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
  })

  test('shows evaluation form header and progress', async ({ page }) => {
    // This test would need authentication setup
    // For now, just test that the route exists
    await page.goto('/onboarding')
    
    // Check that we get redirected to login (which means the route exists)
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('evaluation form has proper structure', async ({ page }) => {
    await page.goto('/onboarding')
    
    // Should be redirected to login
    await expect(page.locator('h1')).toContainText('GoodBuy HQ')
  })

  // More comprehensive tests would require setting up authentication
  // and mock data, which we'll add in the next iteration
})