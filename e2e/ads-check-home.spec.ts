import { expect, test } from '@playwright/test'

test('home content fits the app shell and its demo and primary action work', async ({ page, isMobile }, info) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  const sizes = isMobile ? [[393, 851]] : [[1440, 1080], [1280, 720], [768, 1024]]
  for (const [width, height] of sizes) {
    await page.setViewportSize({ width, height })
    await page.goto('/app/home')
    await expect(page.locator('.ads-home h1')).toBeVisible()
    await expect(page.locator('.ads-home-features article')).toHaveCount(4)
    await expect(page.locator('.ads-topbar')).toBeVisible()
    expect(await page.locator('.ads-product-main').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
    expect(await page.locator('.ads-home-demo').evaluate(el => el.scrollWidth <= el.clientWidth + 1)).toBe(true)
    await page.screenshot({ path: info.outputPath(`home-${width}.png`) })
    await page.locator('.ads-home-features').scrollIntoViewIfNeeded()
    await page.screenshot({ path: info.outputPath(`home-${width}-lower.png`) })
  }
  await page.getByRole('button', { name: 'Xem demo', exact: true }).click()
  await expect(page.locator('.ads-home-demo')).toBeFocused()
  await expect(page.locator('.ads-home-workflows')).toBeVisible()
  await expect(page.locator('.ads-home-demo-nav').getByRole('button', { name: 'Workflow', exact: true })).toHaveAttribute('aria-pressed', 'true')
  await page.locator('.ads-home-demo-nav').getByRole('button', { name: 'Tổng quan', exact: true }).click()
  await expect(page.locator('.ads-home-charts')).toBeVisible()
  await page.locator('.ads-home-actions a').click()
  await expect(page).toHaveURL(/\/app\/adscheck-pro\/adaccounts$/)
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  expect(errors).toEqual([])
})
