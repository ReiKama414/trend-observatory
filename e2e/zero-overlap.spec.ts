import { test, expect } from '@playwright/test'

// Helper: check if two bounding boxes intersect
function boxesOverlap(
  a: { x: number; y: number; width: number; height: number },
  b: { x: number; y: number; width: number; height: number },
  tolerance = 0.5
): boolean {
  if (a.width <= 0 || a.height <= 0 || b.width <= 0 || b.height <= 0) return false
  return !(
    a.x + a.width <= b.x + tolerance ||
    a.x >= b.x + b.width - tolerance ||
    a.y + a.height <= b.y + tolerance ||
    a.y >= b.y + b.height - tolerance
  )
}

test.describe('Zero Overlap & Layout Integrity Verification', () => {
  test.beforeEach(async ({ page }) => {
    // Disable CSS animations for deterministic layout tests
    await page.addInitScript(() => {
      window.localStorage.setItem('trend_observatory_theme', 'dark')
    })
  })

  test('Header Title and Subtitle do not overlap and maintain clean document flow', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    await page.goto('/')

    const titleEl = page.locator('[data-testid="header-title"]')
    const subtitleEl = page.locator('[data-testid="header-subtitle"]')

    await expect(titleEl).toBeVisible()
    await expect(subtitleEl).toBeVisible()

    const titleBox = await titleEl.boundingBox()
    const subtitleBox = await subtitleEl.boundingBox()

    expect(titleBox).not.toBeNull()
    expect(subtitleBox).not.toBeNull()

    if (titleBox && subtitleBox) {
      // Subtitle must be vertically below title in document flow
      expect(subtitleBox.y).toBeGreaterThanOrEqual(titleBox.y + titleBox.height - 1)
      expect(boxesOverlap(titleBox, subtitleBox)).toBe(false)
    }
  })

  test('Main Chart 5 Card Sections (Header, Description, Stats, Canvas, Footer) have zero overlap and strict top-down flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const header = page.locator('[data-testid="chart-card-header"]')
    const desc = page.locator('[data-testid="chart-card-description"]')
    const stats = page.locator('[data-testid="chart-card-statistics"]')
    const canvasContainer = page.locator('[data-testid="chart-card-canvas-container"]')
    const footer = page.locator('[data-testid="chart-card-footer"]')

    await expect(header).toBeVisible()
    await expect(desc).toBeVisible()
    await expect(stats).toBeVisible()
    await expect(canvasContainer).toBeVisible()
    await expect(footer).toBeVisible()

    const hBox = await header.boundingBox()
    const dBox = await desc.boundingBox()
    const sBox = await stats.boundingBox()
    const cBox = await canvasContainer.boundingBox()
    const fBox = await footer.boundingBox()

    expect(hBox).not.toBeNull()
    expect(dBox).not.toBeNull()
    expect(sBox).not.toBeNull()
    expect(cBox).not.toBeNull()
    expect(fBox).not.toBeNull()

    if (hBox && dBox && sBox && cBox && fBox) {
      // Strict top-to-bottom document flow
      expect(dBox.y).toBeGreaterThanOrEqual(hBox.y + hBox.height - 1)
      expect(sBox.y).toBeGreaterThanOrEqual(dBox.y + dBox.height - 1)
      expect(cBox.y).toBeGreaterThanOrEqual(sBox.y + sBox.height - 1)
      expect(fBox.y).toBeGreaterThanOrEqual(cBox.y + cBox.height - 1)

      // Pairwise non-overlap
      expect(boxesOverlap(hBox, dBox)).toBe(false)
      expect(boxesOverlap(dBox, sBox)).toBe(false)
      expect(boxesOverlap(sBox, cBox)).toBe(false)
      expect(boxesOverlap(cBox, fBox)).toBe(false)
      expect(boxesOverlap(sBox, fBox)).toBe(false)
      expect(boxesOverlap(hBox, cBox)).toBe(false)
    }
  })

  test('Seasonality View 5 Card Sections have zero overlap across subtabs', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Navigate to Seasonality
    await page.locator('button', { hasText: '季節性檢視' }).click()

    const subtabs = ['年度同軸疊加', '星期分佈', '月度熱力圖']

    for (const subtabName of subtabs) {
      await page.locator('button', { hasText: subtabName }).click()
      await page.waitForTimeout(100)

      const header = page.locator('[data-testid="seasonality-card-header"]')
      const desc = page.locator('[data-testid="seasonality-card-description"]')
      const canvas = page.locator('[data-testid="seasonality-card-canvas-container"]')
      const footer = page.locator('[data-testid="seasonality-card-footer"]')

      await expect(header).toBeVisible()
      await expect(desc).toBeVisible()
      await expect(canvas).toBeVisible()
      await expect(footer).toBeVisible()

      const hBox = await header.boundingBox()
      const dBox = await desc.boundingBox()
      const cBox = await canvas.boundingBox()
      const fBox = await footer.boundingBox()

      if (hBox && dBox && cBox && fBox) {
        expect(dBox.y).toBeGreaterThanOrEqual(hBox.y + hBox.height - 1)
        expect(cBox.y).toBeGreaterThanOrEqual(dBox.y + dBox.height - 1)
        expect(fBox.y).toBeGreaterThanOrEqual(cBox.y + cBox.height - 1)

        expect(boxesOverlap(hBox, dBox)).toBe(false)
        expect(boxesOverlap(dBox, cBox)).toBe(false)
        expect(boxesOverlap(cBox, fBox)).toBe(false)
      }
    }
  })

  test('Metrics Summary Cards in Grid do not overlap each other', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    const cards = page.locator('[data-testid="metrics-card"]')
    const count = await cards.count()
    expect(count).toBeGreaterThan(0)

    const boxes: ({ x: number; y: number; width: number; height: number } | null)[] = []
    for (let i = 0; i < count; i++) {
      boxes.push(await cards.nth(i).boundingBox())
    }

    // Verify pairwise non-overlap for cards
    for (let i = 0; i < count; i++) {
      for (let j = i + 1; j < count; j++) {
        const bA = boxes[i]
        const bB = boxes[j]
        if (bA && bB) {
          expect(boxesOverlap(bA, bB)).toBe(false)
        }
      }
    }
  })

  test('Dynamic Dataset Switching retains zero overlap and intact document flow', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Load E-commerce preset
    await page.locator('button', { hasText: '電商' }).click()
    await page.waitForTimeout(200)

    // Check main chart bounding boxes
    const header = page.locator('[data-testid="chart-card-header"]')
    const canvas = page.locator('[data-testid="chart-card-canvas-container"]')
    const hBox = await header.boundingBox()
    const cBox = await canvas.boundingBox()

    if (hBox && cBox) {
      expect(boxesOverlap(hBox, cBox)).toBe(false)
      expect(cBox.y).toBeGreaterThanOrEqual(hBox.y + hBox.height)
    }

    // Load Renewable Energy preset
    await page.locator('button', { hasText: '綠能' }).click()
    await page.waitForTimeout(200)

    const hBox2 = await header.boundingBox()
    const cBox2 = await canvas.boundingBox()
    if (hBox2 && cBox2) {
      expect(boxesOverlap(hBox2, cBox2)).toBe(false)
      expect(cBox2.y).toBeGreaterThanOrEqual(hBox2.y + hBox2.height)
    }

    // Switch to Yearly granularity on Energy dataset and take verification screenshot
    const granularitySelect = page.locator('select').filter({ hasText: /日 \(Daily\)|原始 \(Raw\)/ })
    if (await granularitySelect.isVisible()) {
      await granularitySelect.selectOption('yearly')
      await page.waitForTimeout(300)
    }

    await page.screenshot({
      path: 'test-results/screenshots/energy-yearly-fixed.png',
      fullPage: false,
    })
  })

  test('UI scales properly under 200% font/layout zoom without overlap', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.goto('/')

    // Apply 200% zoom
    await page.evaluate(() => {
      document.body.style.zoom = '200%'
    })
    await page.waitForTimeout(200)

    const header = page.locator('[data-testid="chart-card-header"]')
    const desc = page.locator('[data-testid="chart-card-description"]')
    const stats = page.locator('[data-testid="chart-card-statistics"]')

    await expect(header).toBeVisible()
    await expect(desc).toBeVisible()
    await expect(stats).toBeVisible()

    const hBox = await header.boundingBox()
    const dBox = await desc.boundingBox()
    const sBox = await stats.boundingBox()

    if (hBox && dBox && sBox) {
      expect(boxesOverlap(hBox, dBox)).toBe(false)
      expect(boxesOverlap(dBox, sBox)).toBe(false)
    }

    // Reset zoom
    await page.evaluate(() => {
      document.body.style.zoom = '100%'
    })
  })

  test('Visual screenshot check on 9 Viewports for Light and Dark modes', async ({ page }) => {
    const viewports = [
      { name: '320px', width: 320, height: 568 },
      { name: '375px', width: 375, height: 667 },
      { name: '390px', width: 390, height: 844 },
      { name: '430px', width: 430, height: 932 },
      { name: '768px', width: 768, height: 1024 },
      { name: '1024px', width: 1024, height: 768 },
      { name: '1280px', width: 1280, height: 800 },
      { name: '1440px', width: 1440, height: 900 },
      { name: '1920px', width: 1920, height: 1080 },
    ]

    for (const vp of viewports) {
      await page.setViewportSize({ width: vp.width, height: vp.height })
      await page.goto('/')

      // Verify no horizontal overflow in dark mode
      const scrollWidthDark = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidthDark = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidthDark).toBeLessThanOrEqual(clientWidthDark + 2)

      // Take dark mode screenshot
      await page.screenshot({
        path: `test-results/screenshots/${vp.name}-dark.png`,
        fullPage: false,
      })

      // Switch to Light mode
      await page.evaluate(() => {
        window.localStorage.setItem('trend_observatory_theme', 'light')
        document.documentElement.classList.remove('dark')
      })
      await page.waitForTimeout(100)

      // Verify no horizontal overflow in light mode
      const scrollWidthLight = await page.evaluate(() => document.documentElement.scrollWidth)
      const clientWidthLight = await page.evaluate(() => document.documentElement.clientWidth)
      expect(scrollWidthLight).toBeLessThanOrEqual(clientWidthLight + 2)

      // Take light mode screenshot
      await page.screenshot({
        path: `test-results/screenshots/${vp.name}-light.png`,
        fullPage: false,
      })

      // Restore dark mode
      await page.evaluate(() => {
        window.localStorage.setItem('trend_observatory_theme', 'dark')
        document.documentElement.classList.add('dark')
      })
    }
  })
})
