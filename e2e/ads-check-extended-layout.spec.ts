import { expect, test } from './toolmeta-session.fixture'

test('keeps settings and Bubble preview side by side while settings scroll', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  for (const width of [814, 1024, 1440]) {
    await page.setViewportSize({ width, height: 1000 })
    await page.goto('/app/extended-payment')
    const settings = page.locator('.ads-extended-settings-panel')
    const preview = page.locator('.ads-extended-preview-panel')
    await expect(settings).toBeVisible()
    await expect(preview).toBeVisible()
    const left = (await settings.boundingBox())!
    const right = (await preview.boundingBox())!
    expect(right.x).toBeGreaterThanOrEqual(left.x + left.width)
    expect(Math.abs(left.y - right.y)).toBeLessThan(2)
    expect(right.x + right.width).toBeLessThanOrEqual(width)
    await page.locator('.ads-extended-settings-scroll').evaluate(element => { element.scrollTop = element.scrollHeight })
    await expect(page.locator('.ads-extended-save-button')).toBeInViewport()
    const after = (await preview.boundingBox())!
    expect(Math.abs(after.y - right.y)).toBeLessThan(2)
    expect(await page.locator('.ads-extended-settings-panel').evaluate(element => element.scrollWidth <= element.clientWidth + 1)).toBe(true)
    if (width === 814) {
      await page.locator('.ads-extended-settings-scroll').evaluate(element => { element.scrollTop = 0 })
      await page.screenshot({ path: testInfo.outputPath('extended-payment-two-columns.png') })
    }
  }
})

test('keeps narrow phone layout within the viewport', async ({ page }) => {
  await page.setViewportSize({ width: 393, height: 851 })
  await page.goto('/app/extended-payment')
  await expect(page.locator('.ads-extended-settings-panel')).toBeVisible()
  const preview = (await page.locator('.ads-extended-preview-panel').boundingBox())!
  expect(preview.x).toBeGreaterThanOrEqual(0)
  expect(preview.x + preview.width).toBeLessThanOrEqual(393)
})
