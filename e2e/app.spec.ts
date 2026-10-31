import { test, expect } from '@playwright/test'

test.describe('Trend Observatory E2E Workflows', () => {
  test('loads workbench and displays initial preset datasets and charts', async ({ page }) => {
    await page.goto('/')

    // Check title
    await expect(page).toHaveTitle(/Trend Observatory/)

    // Check header brand
    await expect(page.locator('h1')).toContainText('Trend Observatory')

    // Check that preset datasets are loaded (SOX, NVDA, TSMC)
    await expect(page.locator('text=費城半導體 (SOX)').first()).toBeVisible()
    await expect(page.locator('text=NVIDIA 股價 (USD)').first()).toBeVisible()
    await expect(page.locator('text=台積電 ADR (USD)').first()).toBeVisible()

    // Check canvas element in chart
    const canvas = page.locator('canvas').first()
    await expect(canvas).toBeVisible()

    // Check Metrics summary cards are displayed
    await expect(page.locator('text=區間成長率').first()).toBeVisible()
  })

  test('switches time granularity and transform modes', async ({ page }) => {
    await page.goto('/')

    // Select granularity dropdown
    const granularitySelect = page.locator('select').filter({ hasText: /日 \(Daily\)/ })
    await expect(granularitySelect).toBeVisible()
    await granularitySelect.selectOption('monthly')

    // Select transform mode dropdown to Baseline 100
    const transformSelect = page.locator('select').filter({ hasText: /原始數值/ })
    await expect(transformSelect).toBeVisible()
    await transformSelect.selectOption('baseline100')

    // Verify baseline date picker appears
    await expect(page.locator('text=基準日:')).toBeVisible()

    // Switch to MoM %
    await transformSelect.selectOption('mom')
  })

  test('navigates through Seasonality View tabs', async ({ page }) => {
    await page.goto('/')

    // Click Seasonality tab
    const seasonalityTab = page.locator('button', { hasText: '季節性檢視' })
    await seasonalityTab.click()

    // Check that Seasonality subtabs are visible
    await expect(page.locator('button', { hasText: '年度同軸疊加' })).toBeVisible()
    await expect(page.locator('button', { hasText: '星期分佈' })).toBeVisible()
    await expect(page.locator('button', { hasText: '月度熱力圖' })).toBeVisible()

    // Click Day of Week subtab
    await page.locator('button', { hasText: '星期分佈' }).click()

    // Click Heatmap subtab
    await page.locator('button', { hasText: '月度熱力圖' }).click()
  })

  test('navigates to Data Table View with search filter', async ({ page }) => {
    await page.goto('/')

    // Click Data Table tab
    const tableTab = page.locator('button', { hasText: '數據總表' })
    await tableTab.click()

    // Check table headers have title attributes and tooltips
    const dateHeader = page.locator('th', { hasText: '日期 (Date)' })
    await expect(dateHeader).toBeVisible()
    await expect(dateHeader).toHaveAttribute('title', '採樣聚合日期 (Date)')

    // Check dataset headers have title attributes
    const seriesHeader = page.locator('th[title*="資料集名稱"]').first()
    await expect(seriesHeader).toBeVisible()
    const headerTitle = await seriesHeader.getAttribute('title')
    expect(headerTitle).toBeTruthy()

    // Test search filter
    const searchInput = page.locator('input[placeholder*="搜尋日期"]')
    await expect(searchInput).toBeVisible()
    await searchInput.fill('2024-05')

    // Verify filtered date appears in table and strictly does NOT wrap
    const dateCell = page.locator('td', { hasText: '2024-05' }).first()
    await expect(dateCell).toBeVisible()
    const whiteSpace = await dateCell.evaluate((el) => window.getComputedStyle(el).whiteSpace)
    expect(whiteSpace).toBe('nowrap')
  })

  test('adds and toggles a new Event Annotation', async ({ page }) => {
    await page.goto('/')

    // Switch sidebar to Events tab
    const eventsTab = page.locator('button', { hasText: /事件註記/ }).first()
    await eventsTab.click()

    // Check initial preset events
    await expect(page.locator('text=ChatGPT 3.5 正式發布')).toBeVisible()

    // Click add event
    const addBtn = page.locator('button', { hasText: '新增' }).first()
    await addBtn.click()

    // Fill form
    await page.locator('input[placeholder*="例：降息"]').fill('測試自訂里程碑事件')
    await page.locator('input[type="date"]').first().fill('2024-06-15')

    // Submit form
    await page.locator('button', { hasText: '確認新增' }).click()

    // Verify newly added event is listed
    await expect(page.locator('text=測試自訂里程碑事件')).toBeVisible()
  })

  test('opens and interacts with the Export Modal', async ({ page }) => {
    await page.goto('/')

    // Click Export button
    const exportBtn = page.locator('button', { hasText: '匯出成果' })
    await exportBtn.click()

    // Verify modal elements
    await expect(page.locator('text=匯出研究成果與圖表')).toBeVisible()
    await expect(page.locator('button', { hasText: '下載 PNG 圖檔' })).toBeVisible()
    await expect(page.locator('button', { hasText: '下載 CSV 檔案' })).toBeVisible()
    await expect(page.locator('button', { hasText: '匯出專案 JSON' })).toBeVisible()

    // Close modal
    await page.locator('button', { hasText: '關閉' }).click()
    await expect(page.locator('text=匯出研究成果與圖表')).not.toBeVisible()
  })

  test('renders properly on mobile viewport without horizontal overflow', async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 })
    await page.goto('/')

    // Check header renders
    await expect(page.locator('h1')).toContainText('Trend Observatory')

    // Check page horizontal scroll width does not exceed viewport width
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
    const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
    expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2) // Within 2px tolerance
  })
})
