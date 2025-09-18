import { test, expect, Page } from '@playwright/test'

test.describe('Professional Questionnaire E2E Flow', () => {
  let page: Page

  test.beforeEach(async ({ page: testPage }) => {
    page = testPage

    // Mock professional tier subscription
    await page.route('**/api/premium/check-access', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasAccess: true,
          tier: 'professional',
          features: ['professional_questionnaire']
        })
      })
    })

    // Mock questionnaire save/load endpoints
    await page.route('**/api/questionnaire/professional*', async route => {
      const method = route.request().method()

      if (method === 'POST') {
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            questionnaire: {
              id: 'test-questionnaire-id',
              status: 'draft',
              totalFields: 44,
              completedFields: 5
            }
          })
        })
      } else if (method === 'GET') {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            success: true,
            questionnaire: {
              id: 'test-questionnaire-id',
              financialPerformance: {
                revenueYear1: 1000000,
                revenueYear2: 1200000,
                revenueYear3: 1500000
              },
              status: 'draft'
            }
          })
        })
      }
    })

    // Navigate to professional questionnaire
    await page.goto('/questionnaire/professional')
    await page.waitForLoadState('networkidle')
  })

  test('should complete full professional questionnaire workflow', async () => {
    // Verify page loads with professional tier access
    await expect(page.locator('[data-testid="professional-questionnaire"]')).toBeVisible()
    await expect(page.locator('h1')).toContainText('Professional Business Evaluation')

    // Section 1: Financial Performance
    await expect(page.locator('[data-testid="section-financial"]')).toBeVisible()

    // Fill financial performance fields
    await page.fill('[data-testid="revenue-year-1"]', '1000000')
    await page.fill('[data-testid="revenue-year-2"]', '1200000')
    await page.fill('[data-testid="revenue-year-3"]', '1500000')
    await page.fill('[data-testid="profit-year-1"]', '100000')
    await page.fill('[data-testid="profit-year-2"]', '150000')
    await page.fill('[data-testid="profit-year-3"]', '200000')
    await page.fill('[data-testid="ebitda-margin"]', '15.5')
    await page.fill('[data-testid="return-on-equity"]', '12.3')
    await page.fill('[data-testid="total-debt"]', '500000')

    // Verify auto-save functionality
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saving', { timeout: 5000 })
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saved', { timeout: 10000 })

    // Navigate to next section
    await page.click('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-customer-risk"]')).toBeVisible()

    // Section 2: Customer Risk Analysis
    await page.fill('[data-testid="largest-customer-revenue"]', '300000')
    await page.fill('[data-testid="top-5-customer-revenue"]', '750000')
    await page.selectOption('[data-testid="customer-concentration-risk"]', 'medium')
    await page.fill('[data-testid="customer-retention-rate"]', '85')
    await page.fill('[data-testid="customer-satisfaction-score"]', '8.2')
    await page.fill('[data-testid="average-contract-length"]', '12')
    await page.fill('[data-testid="recurring-revenue-percentage"]', '65')

    // Test validation error handling
    await page.fill('[data-testid="largest-customer-revenue"]', '800000')
    await page.fill('[data-testid="top-5-customer-revenue"]', '600000') // Should be >= largest

    await page.click('[data-testid="validate-section"]')
    await expect(page.locator('[data-testid="validation-error"]')).toContainText('Top 5 customer revenue must be at least as large')

    // Fix validation error
    await page.fill('[data-testid="top-5-customer-revenue"]', '850000')
    await expect(page.locator('[data-testid="validation-error"]')).not.toBeVisible()

    // Navigate to next section
    await page.click('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-competitive"]')).toBeVisible()

    // Section 3: Competitive Market Position
    await page.fill('[data-testid="market-share-percentage"]', '15')
    await page.fill('[data-testid="primary-competitors"]', 'CompetitorA, CompetitorB, CompetitorC')
    await page.selectOption('[data-testid="competitive-advantage-strength"]', 'strong')
    await page.fill('[data-testid="market-growth-rate"]', '8.5')
    await page.selectOption('[data-testid="scalability-rating"]', 'high')
    await page.selectOption('[data-testid="barrier-to-entry"]', 'medium')

    // Test array field input
    await page.fill('[data-testid="competitive-threats"]', 'New technology, Market consolidation')
    await page.selectOption('[data-testid="technology-advantage"]', 'leading')

    // Navigate to next section
    await page.click('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-operational"]')).toBeVisible()

    // Section 4: Operational Strategic Dependencies
    await page.fill('[data-testid="owner-time-commitment"]', '45')
    await page.selectOption('[data-testid="key-person-risk"]', 'medium')
    await page.selectOption('[data-testid="management-depth-rating"]', 'adequate')
    await page.selectOption('[data-testid="supplier-concentration-risk"]', 'low')
    await page.selectOption('[data-testid="operational-complexity"]', 'moderate')

    // Test conditional validation logic
    await page.selectOption('[data-testid="key-person-risk"]', 'high')
    await page.fill('[data-testid="owner-time-commitment"]', '10') // Too low for high key person risk

    await expect(page.locator('[data-testid="conditional-warning"]')).toContainText('Business dependencies should be consistent')

    // Fix conditional validation
    await page.fill('[data-testid="owner-time-commitment"]', '50')
    await expect(page.locator('[data-testid="conditional-warning"]')).not.toBeVisible()

    // Navigate to final section
    await page.click('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-value-enhancement"]')).toBeVisible()

    // Section 5: Value Enhancement Potential
    await page.fill('[data-testid="growth-investment-capacity"]', '200000')
    await page.fill('[data-testid="market-expansion-opportunities"]', 'International markets\nNew product lines')
    await page.selectOption('[data-testid="improvement-timeline"]', '6_months')
    await page.selectOption('[data-testid="organizational-change-capacity"]', 'moderate')
    await page.selectOption('[data-testid="value-creation-potential"]', 'high')

    // Verify progress tracking
    const progressBar = page.locator('[data-testid="progress-bar"]')
    await expect(progressBar).toHaveAttribute('aria-valuenow', '100')
    await expect(progressBar).toContainText('100%')

    // Complete questionnaire
    await page.click('[data-testid="complete-questionnaire"]')

    // Verify completion
    await expect(page.locator('[data-testid="completion-success"]')).toBeVisible()
    await expect(page.locator('[data-testid="completion-message"]')).toContainText('Professional questionnaire completed successfully')

    // Verify field completion stats
    await expect(page.locator('[data-testid="fields-completed"]')).toContainText('44 of 44 fields completed')
    await expect(page.locator('[data-testid="completion-percentage"]')).toContainText('100%')
  })

  test('should handle section navigation correctly', async () => {
    // Test navigation buttons
    await expect(page.locator('[data-testid="previous-section"]')).toBeDisabled()
    await expect(page.locator('[data-testid="next-section"]')).toBeEnabled()

    // Navigate forward
    await page.click('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-customer-risk"]')).toBeVisible()
    await expect(page.locator('[data-testid="previous-section"]')).toBeEnabled()

    // Navigate backward
    await page.click('[data-testid="previous-section"]')
    await expect(page.locator('[data-testid="section-financial"]')).toBeVisible()

    // Test direct section navigation
    await page.click('[data-testid="nav-competitive"]')
    await expect(page.locator('[data-testid="section-competitive"]')).toBeVisible()

    // Verify active section highlighting
    await expect(page.locator('[data-testid="nav-competitive"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-testid="nav-financial"]')).toHaveAttribute('aria-pressed', 'false')

    // Test jumping to final section
    await page.click('[data-testid="nav-value-enhancement"]')
    await expect(page.locator('[data-testid="section-value-enhancement"]')).toBeVisible()
    await expect(page.locator('[data-testid="next-section"]')).toBeDisabled()
  })

  test('should validate tier access and redirect basic users', async () => {
    // Mock basic tier access
    await page.route('**/api/premium/check-access', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasAccess: false,
          tier: 'basic',
          features: []
        })
      })
    })

    await page.goto('/questionnaire/professional')

    // Should redirect to upgrade page
    await expect(page).toHaveURL(/.*\/upgrade/)
    await expect(page.locator('[data-testid="tier-upgrade-message"]')).toContainText('Professional tier required')
    await expect(page.locator('[data-testid="upgrade-button"]')).toBeVisible()
  })

  test('should save partial progress and restore on reload', async () => {
    // Fill partial data
    await page.fill('[data-testid="revenue-year-1"]', '1000000')
    await page.fill('[data-testid="revenue-year-2"]', '1200000')
    await page.fill('[data-testid="profit-year-1"]', '100000')

    // Navigate to second section
    await page.click('[data-testid="next-section"]')
    await page.fill('[data-testid="largest-customer-revenue"]', '300000')

    // Verify auto-save
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saved')

    // Reload page
    await page.reload()
    await page.waitForLoadState('networkidle')

    // Verify data restoration
    await expect(page.locator('[data-testid="revenue-year-1"]')).toHaveValue('1000000')
    await expect(page.locator('[data-testid="revenue-year-2"]')).toHaveValue('1200000')
    await expect(page.locator('[data-testid="profit-year-1"]')).toHaveValue('100000')

    // Navigate to second section and verify
    await page.click('[data-testid="nav-customer-risk"]')
    await expect(page.locator('[data-testid="largest-customer-revenue"]')).toHaveValue('300000')

    // Verify progress tracking for partial data
    await expect(page.locator('[data-testid="progress-indicator"]')).toContainText('Partially completed')
    await expect(page.locator('[data-testid="fields-completed"]')).toContainText('4 of 44 fields')
  })

  test('should handle performance with large dataset efficiently', async () => {
    const startTime = Date.now()

    // Fill all 44 fields rapidly
    const fieldTestData = [
      { selector: '[data-testid="revenue-year-1"]', value: '1000000' },
      { selector: '[data-testid="revenue-year-2"]', value: '1200000' },
      { selector: '[data-testid="revenue-year-3"]', value: '1500000' },
      { selector: '[data-testid="profit-year-1"]', value: '100000' },
      { selector: '[data-testid="profit-year-2"]', value: '150000' },
      { selector: '[data-testid="profit-year-3"]', value: '200000' },
      { selector: '[data-testid="cash-flow-year-1"]', value: '120000' },
      { selector: '[data-testid="cash-flow-year-2"]', value: '180000' },
      { selector: '[data-testid="cash-flow-year-3"]', value: '250000' },
      { selector: '[data-testid="ebitda-margin"]', value: '15.5' },
      { selector: '[data-testid="return-on-equity"]', value: '12.3' },
      { selector: '[data-testid="return-on-assets"]', value: '8.7' },
      { selector: '[data-testid="total-debt"]', value: '500000' }
    ]

    // Section 1: Financial Performance
    for (const field of fieldTestData) {
      await page.fill(field.selector, field.value)
    }

    // Navigate through all sections rapidly
    for (let section = 1; section < 5; section++) {
      await page.click('[data-testid="next-section"]')
      await page.waitForSelector(`[data-testid="section-${['customer-risk', 'competitive', 'operational', 'value-enhancement'][section-1]}"]`)
    }

    const endTime = Date.now()
    const totalTime = endTime - startTime

    // Should complete navigation and form filling in under 5 seconds
    expect(totalTime).toBeLessThan(5000)

    // Verify responsiveness
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saved', { timeout: 3000 })
  })

  test('should support keyboard navigation and accessibility', async () => {
    // Test keyboard navigation
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="revenue-year-1"]')).toBeFocused()

    // Navigate through fields with Tab
    await page.keyboard.press('Tab')
    await expect(page.locator('[data-testid="revenue-year-2"]')).toBeFocused()

    // Test Enter key on buttons
    await page.focus('[data-testid="next-section"]')
    await page.keyboard.press('Enter')
    await expect(page.locator('[data-testid="section-customer-risk"]')).toBeVisible()

    // Test ARIA labels and roles
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('role', 'progressbar')
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuenow')
    await expect(page.locator('[data-testid="progress-bar"]')).toHaveAttribute('aria-valuemax', '100')

    // Test section navigation ARIA states
    await expect(page.locator('[data-testid="nav-customer-risk"]')).toHaveAttribute('aria-pressed', 'true')
    await expect(page.locator('[data-testid="nav-financial"]')).toHaveAttribute('aria-pressed', 'false')

    // Test form field labels
    await expect(page.locator('label[for="largest-customer-revenue"]')).toBeVisible()
    await expect(page.locator('[data-testid="largest-customer-revenue"]')).toHaveAttribute('aria-describedby')
  })

  test('should work correctly on mobile devices', async () => {
    // Simulate mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    // Verify mobile layout
    await expect(page.locator('[data-testid="professional-questionnaire"]')).toBeVisible()

    // Test mobile navigation
    await expect(page.locator('[data-testid="mobile-section-nav"]')).toBeVisible()

    // Test touch interactions
    await page.tap('[data-testid="next-section"]')
    await expect(page.locator('[data-testid="section-customer-risk"]')).toBeVisible()

    // Test mobile form inputs
    await page.tap('[data-testid="largest-customer-revenue"]')
    await page.fill('[data-testid="largest-customer-revenue"]', '300000')

    // Test mobile dropdown interactions
    await page.tap('[data-testid="customer-concentration-risk"]')
    await page.selectOption('[data-testid="customer-concentration-risk"]', 'medium')

    // Verify mobile auto-save works
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saved')

    // Test mobile scrolling with long forms
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await expect(page.locator('[data-testid="questionnaire-controls"]')).toBeVisible()
  })

  test('should handle network errors gracefully', async () => {
    // Mock network failure for save requests
    await page.route('**/api/questionnaire/professional', async route => {
      await route.abort('failed')
    })

    // Fill some data
    await page.fill('[data-testid="revenue-year-1"]', '1000000')
    await page.fill('[data-testid="revenue-year-2"]', '1200000')

    // Trigger save
    await page.click('[data-testid="save-progress"]')

    // Verify error handling
    await expect(page.locator('[data-testid="save-error"]')).toBeVisible()
    await expect(page.locator('[data-testid="save-error"]')).toContainText('Failed to save progress')
    await expect(page.locator('[data-testid="retry-save"]')).toBeVisible()

    // Test retry functionality
    await page.route('**/api/questionnaire/professional', async route => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true })
      })
    })

    await page.click('[data-testid="retry-save"]')
    await expect(page.locator('[data-testid="auto-save-status"]')).toContainText('saved')
    await expect(page.locator('[data-testid="save-error"]')).not.toBeVisible()
  })

  test('should maintain data integrity during concurrent sessions', async () => {
    // Simulate editing in another session
    await page.route('**/api/questionnaire/professional/*', async route => {
      if (route.request().method() === 'PUT') {
        await route.fulfill({
          status: 409,
          contentType: 'application/json',
          body: JSON.stringify({
            error: 'Conflict',
            message: 'Questionnaire has been modified by another session'
          })
        })
      }
    })

    // Fill data and attempt to save
    await page.fill('[data-testid="revenue-year-1"]', '1000000')
    await page.click('[data-testid="save-progress"]')

    // Verify conflict resolution
    await expect(page.locator('[data-testid="conflict-dialog"]')).toBeVisible()
    await expect(page.locator('[data-testid="conflict-message"]')).toContainText('modified by another session')

    // Test conflict resolution options
    await expect(page.locator('[data-testid="reload-latest"]')).toBeVisible()
    await expect(page.locator('[data-testid="keep-local"]')).toBeVisible()

    // Choose to reload latest version
    await page.click('[data-testid="reload-latest"]')
    await expect(page.locator('[data-testid="conflict-dialog"]')).not.toBeVisible()
  })

  test('should validate business logic across sections', async () => {
    // Navigate to customer risk section
    await page.click('[data-testid="nav-customer-risk"]')

    // Set high customer concentration risk
    await page.selectOption('[data-testid="customer-concentration-risk"]', 'high')

    // Navigate to operational section
    await page.click('[data-testid="nav-operational"]')

    // Set inconsistent low key person risk and low time commitment
    await page.selectOption('[data-testid="key-person-risk"]', 'low')
    await page.fill('[data-testid="owner-time-commitment"]', '5')

    // Trigger cross-section validation
    await page.click('[data-testid="validate-all-sections"]')

    // Verify business logic warning
    await expect(page.locator('[data-testid="business-logic-warning"]')).toBeVisible()
    await expect(page.locator('[data-testid="business-logic-warning"]')).toContainText(
      'High customer concentration typically requires higher owner involvement'
    )

    // Provide suggested fixes
    await expect(page.locator('[data-testid="suggested-fix"]')).toContainText(
      'Consider increasing owner time commitment or reassessing key person risk'
    )

    // Apply suggested fix
    await page.fill('[data-testid="owner-time-commitment"]', '45')
    await page.selectOption('[data-testid="key-person-risk"]', 'medium')

    // Verify warning disappears
    await page.click('[data-testid="validate-all-sections"]')
    await expect(page.locator('[data-testid="business-logic-warning"]')).not.toBeVisible()
    await expect(page.locator('[data-testid="validation-success"]')).toBeVisible()
  })
})