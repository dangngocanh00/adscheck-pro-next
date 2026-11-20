import { expect, test } from '@playwright/test'

test('guest can see every module layout and open the login form', async ({ page }) => {
  const modules = [
    ['/', '.ads-pro-workspace'],
    ['/app/home', '.ads-home'],
    ['/app/ads-save', '.ads-save-workspace-panel'],
    ['/app/extended-payment', '.ads-extended-layout'],
    ['/app/billing/payment', '.ads-billing-page'],
    ['/app/notification', '.ads-notification-page'],
    ['/app/account', '.ads-account-page'],
  ]
  for (const [route, content] of modules) {
    await page.goto(route, { waitUntil: 'domcontentloaded' })
    await expect(page.locator(content)).toBeVisible()
    await expect(page.getByRole('button', { name: 'Đăng nhập', exact: true })).toBeVisible()
  }
  const entry = page.locator('.ads-topbar').getByRole('button', { name: 'Đăng nhập', exact: true })
  await entry.click()
  const dialog = page.getByRole('dialog', { name: 'Đăng nhập', exact: true })
  await expect(dialog.getByLabel('Email')).toBeFocused()
  await expect(dialog.getByRole('button', { name: 'Đăng ký', exact: true })).toHaveCount(0)
  await expect(dialog.getByRole('button', { name: 'Đăng nhập bằng Google' })).toBeVisible()
  await page.getByRole('button', { name: 'Quên mật khẩu?' }).click()
  await expect(page.getByRole('dialog', { name: 'Quên mật khẩu?' }).getByLabel('Email')).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(entry).toBeFocused()
})

test('login form submits locally and leaves the workspace in guest mode', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  for (const name of ['VIA', 'TKQC', 'BM', 'Page', 'Pixel']) {
    await page.getByRole('tab', { name: `${name} 0`, exact: true }).click()
    await expect(page.locator('.ads-pro-table tbody tr:has(td:not([colspan]))')).toHaveCount(0)
  }
  await page.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  const login = page.getByRole('dialog', { name: 'Đăng nhập', exact: true })
  await login.getByLabel('Email').fill('preview@example.com')
  const password = login.getByLabel('Mật khẩu', { exact: true })
  await password.fill('example-password')
  await login.getByRole('button', { name: 'Hiện mật khẩu' }).click()
  await expect(password).toHaveAttribute('type', 'text')
  await login.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' }).check()
  await login.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(login.getByRole('status')).toHaveText('Email hoặc mật khẩu demo không đúng.')
  expect(await page.evaluate(() => sessionStorage.getItem('toolmeta-demo-email'))).toBeNull()
  await page.keyboard.press('Escape')
  await expect(page.getByRole('tab', { name: 'Pixel 0', exact: true })).toHaveAttribute('aria-selected', 'true')
})

test('the demo account can sign in, survive a reload and sign out', async ({ page }) => {
  await page.goto('/', { waitUntil: 'domcontentloaded' })
  await page.locator('.toolmeta-guest-action').click()
  const login = page.getByRole('dialog', { name: 'Đăng nhập', exact: true })
  await login.getByLabel('Email').fill('demo@toolmeta.example')
  await login.getByLabel('Mật khẩu', { exact: true }).fill('ToolmetaDemo123!')
  await login.getByRole('checkbox', { name: 'Ghi nhớ đăng nhập' }).check()
  await login.getByRole('button', { name: 'Đăng nhập', exact: true }).click()
  await expect(page.getByRole('tab', { name: 'VIA 97', exact: true })).toBeVisible()
  await page.reload({ waitUntil: 'domcontentloaded' })
  await expect(page.getByRole('tab', { name: 'VIA 97', exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'TÀI KHOẢN Toolmeta', exact: true }).click()
  await page.getByRole('dialog', { name: 'Trình duyệt hiện tại' }).getByRole('button', { name: 'Đăng xuất' }).click()
  await expect(page.getByRole('tab', { name: 'VIA 0', exact: true })).toBeVisible()
})
