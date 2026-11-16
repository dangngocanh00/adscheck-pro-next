import { expect, test } from '@playwright/test'

const workspacePath = '/app/adscheck-pro/adaccounts'

test('root opens AdsCheck Pro directly on a fresh browser', async ({ page }) => {
  await page.goto('/')
  await expect(page).toHaveURL(new RegExp(`${workspacePath}$`))
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await expect(page).toHaveTitle(/Ads Check/)
})

test('removed destinations and unknown URLs return to AdsCheck Pro', async ({ page }) => {
  test.setTimeout(90_000)
  for (const route of ['/login', '/product', '/hr-center', '/work-inbox', '/documents', '/org-chart', '/employees', '/employees/new', '/employees/emp-001', '/departments', '/approvals', '/attendance', '/payroll', '/settings', '/styleguide', '/404', '/unknown-destination']) {
    await page.goto(route)
    await expect(page).toHaveURL(new RegExp(`${workspacePath}$`))
    await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
})

test('old preferences do not block workspace entry, asset switching or refresh', async ({ page }) => {
  test.setTimeout(90_000)
  await page.addInitScript(() => {
    localStorage.setItem('ads-check-version-preference', 'v6')
    sessionStorage.setItem('ads-check-extension-ready', 'false')
    sessionStorage.removeItem('ads-check-selected-login-session')
  })
  await page.goto(workspacePath)
  for (const asset of [/^VIA/, /^TKQC/, /^BM/, /^Page/, /^Pixel/]) {
    const tab = page.getByRole('tab', { name: asset })
    await tab.click()
    await expect(tab).toHaveAttribute('aria-selected', 'true')
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await page.reload()
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
  await page.goto('/app/home')
  await page.goto(workspacePath)
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('all AdsCheck destinations render without missing imports or runtime errors', async ({ page }, testInfo) => {
  test.setTimeout(90_000)
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  page.on('console', message => {
    if (/\[i18n\] Missing translation:/.test(message.text())) errors.push(message.text())
  })
  for (const route of [workspacePath, '/app/home', '/app/ads-save', '/ads-save', '/app/extended-payment', '/app/billing/payment', '/app/notification', '/app/account']) {
    await page.goto(route)
    await expect(page.locator('main')).toBeVisible()
    await expect(page).toHaveTitle(/Ads Check/)
    await expect(page.getByRole('dialog')).toHaveCount(0)
    const brand = page.locator('.ads-brand img:visible')
    await expect(brand).toBeVisible()
    await expect(brand).toHaveJSProperty('complete', true)
    expect(await brand.evaluate((image: HTMLImageElement) => image.naturalWidth)).toBeGreaterThan(0)
    await page.screenshot({ path: testInfo.outputPath(`${route.split('/').pop() || 'home'}-toolmeta.png`) })
  }
  expect(errors).toEqual([])
})

test('switching modules through navigation never prompts for a version', async ({ page }) => {
  test.setTimeout(90_000)
  await page.goto(workspacePath)
  await expect(page.getByRole('tab', { name: /^VIA/ })).toBeVisible()
  for (const module of ['Ads Save', 'Dashboard', 'Ads Check Pro', 'Ads Save']) {
    await page.getByRole('link', { name: module, exact: true }).filter({ visible: true }).first().click()
    await expect(page.locator('main')).toBeVisible()
    await expect(page.getByRole('dialog')).toHaveCount(0)
  }
  await page.reload()
  await expect(page.locator('main')).toBeVisible()
  await expect(page.getByRole('dialog')).toHaveCount(0)
})

test('home module stays accessible without the welcome preview', async ({ page }) => {
  await page.goto('/app/home')
  await expect(page).toHaveURL(/\/app\/home$/)
  await expect(page.locator('#ads-product-main')).toBeVisible()
  await expect(page.locator('.ads-welcome, .ads-dashboard-story, .ads-dashboard-video-playlist')).toHaveCount(0)
  await expect(page.getByRole('link', { name: 'Dashboard', exact: true }).filter({ visible: true }).first()).toHaveAttribute('aria-current', 'page')
  await page.goto('/app/extended-payment')
  await expect(page.getByRole('heading', { name: 'Extended Payment', exact: true })).toBeVisible()
  await page.locator('.ads-brand').click()
  await expect(page).toHaveURL(/\/app\/home$/)
  await expect(page.locator('#ads-product-main')).toBeVisible()
})
