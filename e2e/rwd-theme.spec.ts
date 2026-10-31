import { test, expect } from '@playwright/test'

const VIEWPORTS = [
  { name: '320px - Extra Small Mobile', width: 320, height: 568, isMobile: true },
  { name: '375px - Standard Mobile', width: 375, height: 667, isMobile: true },
  { name: '390px - Mainstream Mobile', width: 390, height: 844, isMobile: true },
  { name: '430px - Large Mobile', width: 430, height: 932, isMobile: true },
  { name: '768px - Tablet Portrait', width: 768, height: 1024, isMobile: true },
  { name: '1024px - Tablet Landscape', width: 1024, height: 768, isMobile: false },
  { name: '1280px - Laptop', width: 1280, height: 800, isMobile: false },
  { name: '1440px - Desktop', width: 1440, height: 900, isMobile: false },
  { name: '1920px - Large Display', width: 1920, height: 1080, isMobile: false },
]

test.describe('Responsive Web Design (9 Viewports) & Dual Theme Layout Verification', () => {
  for (const vp of VIEWPORTS) {
    test.describe(`${vp.name} (${vp.width}x${vp.height})`, () => {
      for (const mode of ['dark', 'light'] as const) {
        test(`layout stability in ${mode} mode`, async ({ page }) => {
          await page.setViewportSize({ width: vp.width, height: vp.height })
          await page.goto('/')

          // Switch theme
          const themeBtn = page.locator('button[aria-label*="切換主題"]')
          await expect(themeBtn).toBeVisible()
          await themeBtn.click()

          const modeBtn = page.locator('button', { hasText: mode === 'dark' ? '深色模式' : '淺色模式' })
          await expect(modeBtn).toBeVisible()
          await modeBtn.click()

          // Verify class on html element
          const htmlClass = await page.evaluate(() => document.documentElement.className)
          if (mode === 'dark') {
            expect(htmlClass).toContain('dark')
          } else {
            expect(htmlClass).toContain('light')
          }

          // 1. Verify NO unexpected page horizontal overflow
          const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
          const clientWidth = await page.evaluate(() => document.documentElement.clientWidth)
          expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2)

          // 2. Verify Header visibility & bounding box
          const header = page.locator('header')
          await expect(header).toBeVisible()
          const headerBox = await header.boundingBox()
          expect(headerBox).not.toBeNull()
          expect(headerBox!.x).toBeGreaterThanOrEqual(-1)
          expect(headerBox!.width).toBeLessThanOrEqual(vp.width + 2)

          // 3. Verify Chart Canvas is visible and within bounds
          const chartCanvas = page.locator('canvas').first()
          await expect(chartCanvas).toBeVisible()
          const chartBox = await chartCanvas.boundingBox()
          expect(chartBox).not.toBeNull()
          expect(chartBox!.width).toBeLessThanOrEqual(vp.width + 2)

          // 4. Verify Mobile Drawer vs Desktop Sidebar
          if (vp.isMobile) {
            // Mobile Drawer button should be visible
            const drawerBtn = page.locator('button[aria-label*="開啟資料與事件抽屜"]')
            await expect(drawerBtn).toBeVisible()

            // Open drawer
            await drawerBtn.click()
            const drawerContent = page.locator('text=資料與事件管理')
            await expect(drawerContent).toBeVisible()

            // Close drawer
            await page.locator('button[aria-label*="關閉抽屜"]').click()
            await expect(drawerContent).not.toBeVisible()
          } else {
            // On desktop, aside sidebar should be visible
            await expect(page.locator('aside')).toBeVisible()
          }

          // 5. Verify Modal layout within viewport
          const exportBtn = page.locator('button', { hasText: /匯出/ }).first()
          await exportBtn.click()
          const modalHeading = page.locator('text=匯出研究成果與圖表')
          await expect(modalHeading).toBeVisible()

          const modalBox = await page.locator('text=匯出研究成果與圖表').locator('xpath=ancestor::div[contains(@class, "max-w-lg")]').boundingBox()
          expect(modalBox).not.toBeNull()
          expect(modalBox!.width).toBeLessThanOrEqual(vp.width)
          expect(modalBox!.x).toBeGreaterThanOrEqual(0)

          // Close modal
          await page.locator('button', { hasText: '關閉' }).click()
          await expect(modalHeading).not.toBeVisible()

          // 6. Verify Seasonality Tab navigation
          const seasonalityTab = page.locator('button', { hasText: '季節性檢視' })
          await seasonalityTab.click()
          await expect(page.locator('button', { hasText: '年度同軸疊加' })).toBeVisible()

          // Check no overflow in seasonality view
          const seasonScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
          expect(seasonScrollWidth).toBeLessThanOrEqual(clientWidth + 2)

          // 7. Verify Data Table tab navigation and local table scroll
          const tableTab = page.locator('button', { hasText: '數據總表' })
          await tableTab.click()
          await expect(page.locator('th', { hasText: '日期 (Date)' })).toBeVisible()

          // Check no page overflow in table view
          const tableScrollWidth = await page.evaluate(() => document.documentElement.scrollWidth)
          expect(tableScrollWidth).toBeLessThanOrEqual(clientWidth + 2)

          // Switch back to timeline
          await page.locator('button', { hasText: '趨勢與多軸比較' }).click()
        })
      }
    })
  }
})
