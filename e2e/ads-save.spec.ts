import { expect, test, type Page } from './toolmeta-session.fixture'

const adsSavePath = '/app/ads-save'

async function dismissVersionPrompt(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Toolmeta đã có phiên bản mới' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('radio', { name: /Phiên bản mới/ }).click()
  await dialog.getByRole('button', { name: 'Xác nhận' }).click()
  await expect(dialog).toBeHidden()
}

test.beforeEach(async ({ page }) => {
  await page.goto(adsSavePath)
  await dismissVersionPrompt(page)
})

test('renders the complete Ads Save installation controls', async ({ page, isMobile }) => {
  await expect(page.getByRole('heading', { name: 'Tải & cài đặt tiện ích để sử dụng Toolmeta' })).toBeVisible()
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    const drawer = page.getByRole('dialog', { name: 'Menu di động' })
    await expect(drawer.getByRole('button', { name: 'Basic', exact: true })).toBeVisible()
    await expect(drawer.getByRole('button', { name: 'Priority', exact: true })).toBeVisible()
    await drawer.getByRole('button', { name: 'Thu nhỏ' }).click()
  } else {
    await expect(page.getByRole('button', { name: 'Basic', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Priority', exact: true })).toBeVisible()
  }
  await expect(page.getByRole('button', { name: 'Mua gói' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tới trang tải xuống' })).toHaveAttribute('href', 'https://adscheck.app/connect')
  if (!isMobile) await expect(page.getByRole('button', { name: 'Thử lại' })).toBeEnabled()
})

test('opens Overview 1/2 and renders every V6 to current-version comparison on 2/2', async ({ page }) => {
  await page.getByRole('button', { name: 'Khám phá bản mới' }).click()
  const dialog = page.getByRole('dialog', { name: 'Khám phá Toolmeta!' })

  await expect(dialog.getByText('1/2', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Bắt đầu khám phá' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Phát video giới thiệu' })).toBeVisible()

  await dialog.getByRole('button', { name: 'Bắt đầu khám phá' }).click()

  await expect(dialog.getByText('2/2', { exact: true })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Quay lại' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Chọn gói mới' })).toBeVisible()
  await expect(dialog.getByRole('button', { name: 'Trải nghiệm ngay' })).toBeVisible()
  await expect(dialog.getByText('Trên V6', { exact: true })).toHaveCount(7)
  await expect(dialog.getByText('Hiện tại', { exact: true })).toHaveCount(7)
  await expect(dialog.getByText('50 phiên mặc định vĩnh viễn; mua thêm có thời hạn.')).toBeVisible()
})

test('moves from Explore to the real local Control Hub dialog', async ({ page }) => {
  await page.getByRole('button', { name: 'Khám phá bản mới' }).click()
  const exploreDialog = page.getByRole('dialog', { name: 'Khám phá Toolmeta!' })
  await exploreDialog.getByRole('button', { name: 'Control Hub', exact: true }).click()
  await exploreDialog.getByRole('button', { name: 'Khám phá ngay' }).click()

  await expect(exploreDialog).toBeHidden()
  await expect(page.getByRole('dialog', { name: /Linh hoạt tùy chỉnh/ })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Tôi muốn quyền lợi này' })).toBeVisible()
  await page.getByRole('button', { name: 'Tiếp tục' }).click()
  await expect(page.getByRole('heading', { name: 'Kết nối nhiều tài khoản Facebook trên một trình duyệt' })).toBeVisible()
  await expect(page.getByText('Hỗ trợ kết nối nhiều tài khoản VIA')).toBeVisible()
  await expect(page.getByText('Tiện lợi trong thao tác và quản lý số lượng lớn')).toBeVisible()
  await expect(page.getByRole('button', { name: 'Quay lại' })).toBeVisible()
})
