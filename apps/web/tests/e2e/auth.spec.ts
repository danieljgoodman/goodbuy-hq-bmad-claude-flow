import { test, expect } from '@playwright/test'

test.describe('Authentication Flow', () => {
  test('can navigate to login page', async ({ page }) => {
    await page.goto('/auth/login')
    await expect(page.locator('h1')).toContainText('GoodBuy HQ')
    await expect(page.getByRole('heading', { name: 'Welcome Back' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Sign In' })).toBeVisible()
  })

  test('can navigate to register page', async ({ page }) => {
    await page.goto('/auth/register')
    await expect(page.locator('h1')).toContainText('GoodBuy HQ')
    await expect(page.getByRole('heading', { name: 'Create Account' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Account' })).toBeVisible()
  })

  test('shows validation errors on login form', async ({ page }) => {
    await page.goto('/auth/login')
    
    // Click submit without filling fields
    await page.getByRole('button', { name: 'Sign In' }).click()
    
    // Check for validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password is required')).toBeVisible()
  })

  test('shows validation errors on register form', async ({ page }) => {
    await page.goto('/auth/register')
    
    // Click submit without filling fields
    await page.getByRole('button', { name: 'Create Account' }).click()
    
    // Check for validation errors
    await expect(page.getByText('Please enter a valid email address')).toBeVisible()
    await expect(page.getByText('Password must be at least 8 characters')).toBeVisible()
    await expect(page.getByText('Business name is required')).toBeVisible()
  })

  test('can navigate to reset password page', async ({ page }) => {
    await page.goto('/auth/reset-password')
    await expect(page.getByRole('heading', { name: 'Reset Password' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Send Reset Link' })).toBeVisible()
  })

  test('protected route redirects to login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/auth\/login/)
  })

  test('navigation between auth pages works', async ({ page }) => {
    // Start at login
    await page.goto('/auth/login')
    
    // Go to register
    await page.getByRole('link', { name: 'Sign up' }).click()
    await expect(page).toHaveURL('/auth/register')
    
    // Go to reset password from login
    await page.goto('/auth/login')
    await page.getByRole('link', { name: 'Forgot password?' }).click()
    await expect(page).toHaveURL('/auth/reset-password')
    
    // Go back to login from reset
    await page.getByRole('link', { name: 'Back to Sign In' }).click()
    await expect(page).toHaveURL('/auth/login')
  })
})