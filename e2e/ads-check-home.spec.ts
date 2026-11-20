import { expect, test } from './toolmeta-session.fixture'

test('dashboard introduction fits the app shell and opens the workspace', async ({ page, isMobile }) => {
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const sizes = isMobile ? [[393, 851], [320, 568], [667, 375], [568, 320]] : [[1440, 1080], [1280, 720], [1024, 600], [768, 1024]]
  await page.goto('/app/home', { waitUntil: 'domcontentloaded' })
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await expect(page.locator('.ads-home h1')).toBeVisible()
    await expect(page.locator('.ads-home-features article')).toHaveCount(3)
    await expect(page.locator('.ads-topbar')).toBeVisible()
    const frame = page.locator('.ads-product-main')
    expect(await frame.evaluate(el => el.scrollWidth <= el.clientWidth + 1 && el.scrollHeight <= el.clientHeight + 1)).toBe(true)
    for (const part of await frame.locator('.ads-home-hero, .ads-home-feature').all()) {
      await expect(part).toBeInViewport({ ratio: .99 })
      const [outer, inner] = await Promise.all([frame.boundingBox(), part.boundingBox()])
      expect(inner!.y).toBeGreaterThanOrEqual(outer!.y - 1)
      expect(inner!.y + inner!.height).toBeLessThanOrEqual(outer!.y + outer!.height + 1)
    }
  }
  await expect(page.getByRole('img', { name: 'Bước 1 trên 2' })).toHaveCount(0)
  const actions = page.locator('.ads-home-actions')
  await expect(actions.locator('a, button')).toHaveCount(2)
  await expect(actions.locator('a, button').nth(1)).toHaveText('Cài đặt extension')
  await page.getByRole('link', { name: 'Bắt đầu khám phá' }).click()
  await expect(page).toHaveURL(/\/app\/adscheck-pro\/adaccounts$/)
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  expect(errors).toEqual([])
})
