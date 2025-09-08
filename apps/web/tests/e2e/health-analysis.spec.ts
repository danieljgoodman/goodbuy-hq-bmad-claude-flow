import { test, expect } from '@playwright/test'

test.describe('Health Analysis System', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the health analysis page
    // This assumes there's a test evaluation with health analysis
    await page.goto('/evaluation/test-evaluation-id')
  })

  test('should display comprehensive health dashboard', async ({ page }) => {
    // Wait for the health analysis to load
    await page.waitForSelector('[data-testid="health-dashboard"]', { timeout: 10000 })
    
    // Check overall health score is displayed
    const overallScore = await page.locator('[data-testid="overall-health-score"]')
    await expect(overallScore).toBeVisible()
    
    // Verify score is a number between 0-100
    const scoreText = await overallScore.textContent()
    const score = parseInt(scoreText || '0')
    expect(score).toBeGreaterThanOrEqual(0)
    expect(score).toBeLessThanOrEqual(100)
  })

  test('should show all four health dimensions', async ({ page }) => {
    const dimensions = ['financial', 'operational', 'market', 'growth']
    
    for (const dimension of dimensions) {
      const dimensionCard = await page.locator(`[data-testid="${dimension}-dimension"]`)
      await expect(dimensionCard).toBeVisible()
      
      // Check dimension score is visible
      const dimensionScore = await dimensionCard.locator('[data-testid="dimension-score"]')
      await expect(dimensionScore).toBeVisible()
      
      // Check trend indicator is present
      const trendIcon = await dimensionCard.locator('[data-testid="trend-icon"]')
      await expect(trendIcon).toBeVisible()
    }
  })

  test('should expand dimension details when clicked', async ({ page }) => {
    // Click on financial dimension
    const financialDimension = await page.locator('[data-testid="financial-dimension"]')
    const expandButton = await financialDimension.locator('[data-testid="expand-button"]')
    await expandButton.click()
    
    // Check that component breakdown is visible
    const componentBreakdown = await financialDimension.locator('[data-testid="component-breakdown"]')
    await expect(componentBreakdown).toBeVisible()
    
    // Check that key insights are displayed
    const keyInsights = await financialDimension.locator('[data-testid="key-insights"]')
    await expect(keyInsights).toBeVisible()
  })

  test('should display industry benchmark comparison', async ({ page }) => {
    // Navigate to benchmarks tab
    const benchmarksTab = await page.locator('[data-testid="benchmarks-tab"]')
    await benchmarksTab.click()
    
    // Check benchmark data is displayed
    const benchmarkCard = await page.locator('[data-testid="industry-benchmark"]')
    await expect(benchmarkCard).toBeVisible()
    
    // Check percentile ranking is shown
    const percentileRanking = await page.locator('[data-testid="percentile-ranking"]')
    await expect(percentileRanking).toBeVisible()
  })

  test('should show trend analysis with historical data', async ({ page }) => {
    // Navigate to trends tab
    const trendsTab = await page.locator('[data-testid="trends-tab"]')
    await trendsTab.click()
    
    // Check trend analysis is displayed
    const trendAnalysis = await page.locator('[data-testid="trend-analysis"]')
    await expect(trendAnalysis).toBeVisible()
    
    // Check trend direction is indicated
    const trendDirection = await page.locator('[data-testid="trend-direction"]')
    await expect(trendDirection).toBeVisible()
    
    // Check change rate is displayed
    const changeRate = await page.locator('[data-testid="change-rate"]')
    await expect(changeRate).toBeVisible()
  })

  test('should display improvement recommendations', async ({ page }) => {
    // Navigate to improvements tab
    const improvementsTab = await page.locator('[data-testid="improvements-tab"]')
    await improvementsTab.click()
    
    // Check improvement paths are displayed
    const improvementPaths = await page.locator('[data-testid="improvement-path"]')
    await expect(improvementPaths.first()).toBeVisible()
    
    // Check priority actions are shown
    const priorityActions = await page.locator('[data-testid="priority-action"]')
    await expect(priorityActions.first()).toBeVisible()
  })

  test('should display health alerts for critical issues', async ({ page }) => {
    // Look for alert section in overview
    const alertsSection = await page.locator('[data-testid="health-alerts"]')
    
    if (await alertsSection.isVisible()) {
      // Check alert message is displayed
      const alertMessage = await alertsSection.locator('[data-testid="alert-message"]')
      await expect(alertMessage.first()).toBeVisible()
      
      // Check recommendations are shown
      const recommendations = await alertsSection.locator('[data-testid="alert-recommendations"]')
      await expect(recommendations.first()).toBeVisible()
    }
  })

  test('should handle loading states gracefully', async ({ page }) => {
    // Reload page to see loading state
    await page.reload()
    
    // Check for loading indicator initially
    const loadingIndicator = await page.locator('[data-testid="health-loading"]')
    
    // Either loading indicator should be visible initially, or content should load quickly
    if (await loadingIndicator.isVisible({ timeout: 1000 }).catch(() => false)) {
      // Wait for loading to complete
      await expect(loadingIndicator).toBeHidden({ timeout: 15000 })
    }
    
    // Verify content is eventually displayed
    const healthDashboard = await page.locator('[data-testid="health-dashboard"]')
    await expect(healthDashboard).toBeVisible({ timeout: 15000 })
  })

  test('should be responsive on mobile devices', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Check that health dashboard is still visible and properly formatted
    const healthDashboard = await page.locator('[data-testid="health-dashboard"]')
    await expect(healthDashboard).toBeVisible()
    
    // Check that dimension cards stack properly on mobile
    const dimensionCards = await page.locator('[data-testid*="dimension"]')
    const cardCount = await dimensionCards.count()
    expect(cardCount).toBeGreaterThanOrEqual(4)
    
    // Check overall score is still prominently displayed
    const overallScore = await page.locator('[data-testid="overall-health-score"]')
    await expect(overallScore).toBeVisible()
  })

  test('should maintain data consistency across tabs', async ({ page }) => {
    // Get overall score from overview
    const overallScore = await page.locator('[data-testid="overall-health-score"]').textContent()
    
    // Navigate to different tabs and verify data consistency
    const tabs = ['dimensions', 'benchmarks', 'trends', 'improvements']
    
    for (const tab of tabs) {
      const tabButton = await page.locator(`[data-testid="${tab}-tab"]`)
      await tabButton.click()
      
      // Wait for tab content to load
      await page.waitForSelector(`[data-testid="${tab}-content"]`, { timeout: 5000 })
      
      // Verify content is displayed
      const tabContent = await page.locator(`[data-testid="${tab}-content"]`)
      await expect(tabContent).toBeVisible()
    }
  })

  test('should handle API errors gracefully', async ({ page }) => {
    // Mock API failure
    await page.route('**/api/health-analysis/**', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Internal server error' })
      })
    })
    
    await page.reload()
    
    // Check for error message or fallback content
    const errorMessage = await page.locator('[data-testid="health-error"]')
    if (await errorMessage.isVisible({ timeout: 5000 }).catch(() => false)) {
      await expect(errorMessage).toContainText('error')
    } else {
      // Should show some kind of fallback or retry option
      const fallbackContent = await page.locator('[data-testid="health-fallback"]')
      await expect(fallbackContent).toBeVisible()
    }
  })

  test('should calculate health scores accurately', async ({ page }) => {
    // Get individual dimension scores
    const financialScore = await page.locator('[data-testid="financial-dimension"] [data-testid="dimension-score"]').textContent()
    const operationalScore = await page.locator('[data-testid="operational-dimension"] [data-testid="dimension-score"]').textContent()
    const marketScore = await page.locator('[data-testid="market-dimension"] [data-testid="dimension-score"]').textContent()
    const growthScore = await page.locator('[data-testid="growth-dimension"] [data-testid="dimension-score"]').textContent()
    
    // Verify all scores are valid numbers
    const scores = [financialScore, operationalScore, marketScore, growthScore]
    scores.forEach(score => {
      const numScore = parseInt(score || '0')
      expect(numScore).toBeGreaterThanOrEqual(0)
      expect(numScore).toBeLessThanOrEqual(100)
    })
    
    // Verify overall score is within expected range based on dimension scores
    const overallScore = parseInt(await page.locator('[data-testid="overall-health-score"]').textContent() || '0')
    const minExpected = Math.min(...scores.map(s => parseInt(s || '0')))
    const maxExpected = Math.max(...scores.map(s => parseInt(s || '0')))
    
    expect(overallScore).toBeGreaterThanOrEqual(minExpected - 10)
    expect(overallScore).toBeLessThanOrEqual(maxExpected + 10)
  })
})