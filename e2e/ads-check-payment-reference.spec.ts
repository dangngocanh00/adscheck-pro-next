import { expect, test } from '@playwright/test'

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => {
    const resetMarker = 'ads-check-payment-reference-reset'
    if (window.sessionStorage.getItem(resetMarker)) return
    window.localStorage.removeItem('ads-check-extended-payment-settings')
    window.sessionStorage.setItem(resetMarker, 'true')
  })
})

test('matches the Extended Payment reference structure and interactions', async ({ page, isMobile }) => {
  await page.goto('/app/extended-payment')

  await expect(page.getByRole('heading', { name: 'Extended Payment' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Cài đặt chung' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Chọn dữ liệu muốn hiển thị trên Bubble' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Chữ ký cá nhân' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Xem trước Bubble' })).toBeVisible()
  await expect(page.locator('.ads-extended-field-option')).toHaveCount(17)
  const promoClose = page.getByRole('button', { name: 'Đóng giới thiệu Ads Check V8' })
  if (!isMobile && await promoClose.isVisible()) await promoClose.click()

  const accountName = page.getByRole('button', { name: 'Tên tài khoản' })
  await expect(accountName).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByTestId('extended-preview-account-name')).toBeVisible()
  await accountName.click()
  await expect(page.getByTestId('extended-preview-account-name')).toBeHidden()

  await page.getByRole('button', { name: 'Tùy chỉnh tỉ giá' }).click()
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toBeVisible()
  await page.getByLabel('Tỉ giá tùy chỉnh').fill('0')
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toHaveAttribute('aria-invalid', 'true')
  await expect(page.getByRole('button', { name: 'Lưu cài đặt' })).toBeDisabled()
  await expect(page.getByTestId('extended-preview-spend-limit')).toContainText('— USD')
  await page.getByLabel('Tỉ giá tùy chỉnh').fill('24.680')
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toHaveAttribute('aria-invalid', 'false')
  await page.getByRole('button', { name: 'In đậm' }).click()
  await page.getByLabel('Nội dung chữ ký').fill('Chữ ký tham chiếu')
  await page.getByRole('button', { name: 'Lưu cài đặt' }).click()
  await page.reload()
  await expect(page.getByLabel('Nội dung chữ ký')).toHaveValue('Chữ ký tham chiếu')
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toHaveValue('24.680')
  await expect(page.getByTestId('extended-preview-spend-limit')).toContainText('USD')
  await page.getByRole('button', { name: 'Tự động tỉ giá' }).click()
  await page.getByLabel('Đổi hiển thị tiền tệ thành').selectOption('USD')
  await page.getByLabel('Ngôn ngữ hiển thị').selectOption('en')
  await expect(page.getByTestId('extended-preview-account-status')).toContainText('Account status')
  await expect(page.getByTestId('extended-preview-spend-limit')).toContainText('USD')

  if (!isMobile) {
    const settings = await page.locator('.ads-extended-settings-panel').boundingBox()
    const preview = await page.locator('.ads-extended-preview-panel').boundingBox()
    expect(settings && preview && settings.width / preview.width).toBeGreaterThan(1.85)
    await page.setViewportSize({ width: 1440, height: 900 })
    await page.reload()
    await expect(page.getByRole('button', { name: 'Đóng giới thiệu Ads Check V8' })).toBeVisible()
    await page.getByRole('button', { name: 'In đậm' }).focus()
    await expect(page.getByRole('button', { name: 'In đậm' })).toBeFocused()
    await expect(page.getByRole('button', { name: 'Đóng giới thiệu Ads Check V8' })).toBeHidden()
  }
  await expect.poll(() => page.locator('#ads-product-main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
})

test('matches the package builder reference and keeps every visible control functional', async ({ page, isMobile }) => {
  await page.goto('/app/billing/payment')

  await expect(page.locator('.ads-billing-tabs [role="tab"]')).toHaveCount(3)
  await expect(page.getByRole('button', { name: 'Pro Tự chọn tính năng' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Priority Khách hàng Priority' })).toBeVisible()
  await expect(page.getByRole('heading', { name: 'Gói của bạn' })).toBeVisible()
  await expect(page.getByText('0 tính năng', { exact: true })).toBeVisible()
  const promoClose = page.getByRole('button', { name: 'Đóng giới thiệu Ads Check V8' })
  if (!isMobile && await promoClose.isVisible()) await promoClose.click()

  const checkout = page.getByRole('button', { name: 'Thanh toán bản demo' })
  const progressCheckout = page.locator('.ads-purchase-progress button').last()
  await expect(checkout).toBeDisabled()
  await expect(progressCheckout).toBeDisabled()
  await page.getByRole('checkbox', { name: 'Chọn Ads Account Management' }).check()
  await expect(page.getByText('1 tính năng', { exact: true })).toBeVisible()
  await expect(page.locator('.ads-purchase-order-live')).toContainText('Đã chọn 1 tính năng.')
  await expect(checkout).toBeDisabled()
  await expect(progressCheckout).toBeDisabled()
  await page.getByRole('button', { name: 'Pro Tự chọn tính năng' }).click()
  await expect(page.getByRole('checkbox', { name: 'Chọn Ads Account Management' })).toBeChecked()
  await page.getByRole('button', { name: /Chọn ngân hàng/ }).click()
  await expect(page.getByRole('heading', { name: 'Chọn ngân hàng' })).toBeVisible()
  await page.getByRole('button', { name: 'Quay lại lựa chọn' }).click()
  await expect(page.locator('.ads-purchase-progress button').first()).toBeFocused()
  await page.getByRole('button', { name: /Chọn ngân hàng/ }).click()
  await page.getByRole('button', { name: 'Ngân hàng mô phỏng SMIT' }).click()
  await expect(page.getByRole('button', { name: 'Ngân hàng mô phỏng SMIT' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('button', { name: 'Lựa chọn', exact: true }).click()
  await expect(checkout).toBeEnabled()
  await expect(progressCheckout).toBeEnabled()

  await page.getByRole('button', { name: '6 tháng -30%' }).click()
  await expect(page.getByRole('button', { name: '6 tháng -30%' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByPlaceholder('Nhập mã giảm giá').fill('SMIT20')
  await page.getByRole('button', { name: 'Áp dụng mã giảm giá' }).click()
  await expect(page.locator('.ads-purchase-coupon-status')).toContainText('Đã áp dụng')
  await page.getByPlaceholder('Nhập mã giảm giá').fill('SMIT2')
  await expect(page.locator('.ads-purchase-coupon-status')).toBeEmpty()
  await page.getByPlaceholder('Nhập mã giảm giá').fill('SMIT20')
  await page.getByRole('button', { name: 'Áp dụng mã giảm giá' }).click()
  await checkout.click()
  await expect(page.getByRole('heading', { name: 'Xác nhận thanh toán' })).toBeFocused()
  await expect(page.getByText('Ngân hàng mô phỏng SMIT', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Quay lại chọn gói' }).click()
  await expect(checkout).toBeFocused()
  await expect(page.getByRole('checkbox', { name: 'Chọn Ads Account Management' })).toBeChecked()
  await expect(page.getByRole('button', { name: '6 tháng -30%' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.ads-purchase-coupon-status')).toContainText('Đã áp dụng')

  await page.getByRole('button', { name: 'Priority Khách hàng Priority' }).click()
  await expect(page.getByRole('button', { name: 'Priority Khách hàng Priority' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.locator('.ads-purchase-summary-count strong').last()).toContainText('1.560.000đ')
  await expect(page.locator('.ads-purchase-summary-count strong').first()).not.toHaveText('0 tính năng')
  await page.getByRole('checkbox', { name: 'Chọn Ads Account Management' }).uncheck()
  await expect(page.getByRole('button', { name: 'Pro Tự chọn tính năng' })).toHaveAttribute('aria-pressed', 'true')
  await page.getByRole('checkbox', { name: 'Chọn trọn bộ tính năng Ads Check' }).check()
  await expect(page.locator('.ads-purchase-builder-status')).toContainText('Đã chọn trọn bộ tính năng Ads Check.')
  await page.getByRole('checkbox', { name: 'Chọn Ads Account Management' }).uncheck()
  await expect(page.locator('.ads-purchase-builder-status')).not.toContainText('Đã chọn trọn bộ tính năng Ads Check.')

  if (isMobile) {
    await expect.poll(() => page.locator('#ads-product-main').evaluate((element) => element.scrollWidth <= element.clientWidth)).toBe(true)
  }
})

test('migrates the previous Extended Payment settings without selecting unrelated fields', async ({ page }) => {
  await page.addInitScript(() => {
    const legacySeedMarker = 'ads-check-payment-legacy-seeded'
    if (window.sessionStorage.getItem(legacySeedMarker)) return
    window.sessionStorage.setItem(legacySeedMarker, 'true')
    window.sessionStorage.setItem('ads-check-payment-reference-reset', 'true')
    window.localStorage.setItem('ads-check-extended-payment-settings', JSON.stringify({
      bubbleEnabled: true,
      surface: 'bubble',
      language: 'vi',
      currency: 'USD',
      exchangeRate: '24.500',
      selectedFields: ['Mã đơn hàng', 'Tổng thanh toán', 'Trạng thái'],
      signature: 'Cấu hình cũ',
      formatting: { bold: true, italic: false, underline: false, link: false, alignment: 'left' },
    }))
  })
  await page.goto('/app/extended-payment')
  await expect(page.getByRole('button', { name: 'ID tài khoản' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Tổng chi tiêu' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Trạng thái tài khoản' })).toHaveAttribute('aria-pressed', 'true')
  await expect(page.getByRole('button', { name: 'Tên tài khoản' })).toHaveAttribute('aria-pressed', 'false')
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toHaveValue('24.500')

  await page.evaluate((storageKey) => {
    window.localStorage.setItem(storageKey, JSON.stringify({
      bubbleEnabled: true,
      surface: 'bubble',
      language: 'vi',
      currency: 'THB',
      exchangeRate: '800',
      selectedFields: ['Tổng thanh toán'],
    }))
  }, 'ads-check-extended-payment-settings')
  await page.reload()
  await expect(page.getByLabel('Tỉ giá tùy chỉnh')).toHaveValue('800')
  await expect(page.getByTestId('extended-preview-total-spend')).toContainText('108.125 THB')
})
