import { expect, test, type Page } from '@playwright/test'

const adAccountsPath = '/app/adscheck-pro/adaccounts'

async function dismissVersionPrompt(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Ads Check đã có phiên bản mới' })
  await expect(dialog).toBeVisible()
  await dialog.getByRole('radio', { name: /Phiên bản mới/ }).click()
  await dialog.getByRole('button', { name: 'Xác nhận' }).click()
  await expect(dialog).toBeHidden()
}

async function dismissDeviceLogin(page: Page) {
  const dialog = page.getByRole('dialog', { name: 'Đăng nhập trên thiết bị mới' })
  if (!(await dialog.isVisible())) return
  await dialog.getByRole('button', { name: /Sử dụng phiên đăng nhập PRO/ }).click()
  await expect(dialog).toBeHidden()
}

async function openAssetWorkspace(page: Page) {
  const retry = page.getByRole('button', { name: 'Thử lại' })
  if (await retry.isVisible()) {
    await retry.click()
  }
  await expect(page.getByRole('tab', { name: /VIA/ })).toBeVisible({ timeout: 10_000 })
  await expect(page.locator('#ads-save-main')).toBeFocused()
}

async function openFunctionLibrary(page: Page, isMobile: boolean | undefined, assetLabel: string) {
  const library = page.locator('#ads-pro-function-library.is-open')
  // Switching asset tabs only swaps panel CONTENT — a panel already open
  // for the previous asset stays open (no rail/open button exists to
  // re-click) when the next asset is chosen without closing it first.
  if (await library.isVisible().catch(() => false)) return page.locator('#ads-pro-function-library')
  if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
  else await page.getByRole('button', { name: `Mở kho chức năng ${assetLabel}` }).click()
  return page.locator('#ads-pro-function-library')
}

test.beforeEach(async ({ page }) => {
  await page.goto(adAccountsPath)
  await dismissVersionPrompt(page)
  await dismissDeviceLogin(page)
})

test('matches the complete visible extension-gate state', async ({ page, isMobile }) => {
  await expect(page).toHaveURL(new RegExp(`${adAccountsPath}$`))
  await expect(page).toHaveTitle('Tài khoản quảng cáo · Ads Check')
  await expect(page.locator('#ads-save-main')).toBeFocused()
  await expect(page.getByRole('heading', { name: 'Tải & cài đặt tiện ích để sử dụng Ads Check' })).toBeVisible()
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    const drawer = page.getByRole('dialog', { name: 'Menu di động' })
    await expect(drawer.getByRole('button', { name: 'Pro', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(drawer.getByRole('button', { name: /Mua gói Priority/ })).toHaveAttribute('aria-pressed', 'false')
    await expect(drawer.getByRole('link', { name: 'Ads Check Pro' })).toHaveAttribute('aria-current', 'page')
    await expect(drawer.getByRole('link', { name: 'Hỗ trợ' })).toHaveAttribute('href', 'https://www.facebook.com/adscheck.official/')
    await expect(drawer.getByRole('link', { name: 'Thông báo' })).toHaveAttribute('href', '/app/notification')
    await drawer.getByRole('button', { name: 'Thu nhỏ' }).click()
  } else {
    await expect(page.getByRole('button', { name: 'Pro', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('button', { name: /Mua gói Priority/ })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByRole('link', { name: 'Ads Check Pro' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('link', { name: 'Ads Save' })).not.toHaveAttribute('aria-current', 'page')
  }
  await expect(page.getByRole('button', { name: 'Mua gói' }).first()).toBeVisible()
  await expect(page.getByRole('link', { name: 'Tới trang tải xuống' })).toHaveAttribute('href', 'https://adscheck.app/connect')
  if (!isMobile) {
    const retry = page.getByRole('button', { name: 'Thử lại' })
    await expect(retry).toBeEnabled()
    await retry.click()
    await expect(page.getByRole('tab', { name: /VIA/ })).toBeVisible({ timeout: 10_000 })
  }
})

test('recreates the VIA asset table, folders and bulk actions', async ({ page, isMobile }) => {
  await openAssetWorkspace(page)

  await expect(page.getByRole('tab', { name: /VIA/ })).toHaveAttribute('aria-selected', 'true')
  if (isMobile) await page.getByRole('button', { name: 'Mở thư mục' }).click()
  await expect(page.getByRole('heading', { name: 'Thư mục VIA' })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng giới thiệu Ads Check V8' }).click()
  await expect(page.getByRole('button', { name: /Thêm thư mục/ })).toBeFocused()
  if (isMobile) {
    await page.getByRole('button', { name: 'Đóng thư mục' }).click()
  } else {
    await page.getByRole('button', { name: 'Đóng thư mục' }).click()
    await page.getByRole('button', { name: 'Mở rộng thư mục' }).click()
    await expect(page.getByRole('heading', { name: 'Thư mục VIA' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Tài khoản Facebook' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Lịch sử kết nối' })).toBeVisible()
  }

  await expect(page.getByText('1/2', { exact: true })).toBeVisible()
  await page.getByRole('button', { name: 'Trang sau' }).click()
  await expect(isMobile
    ? page.getByRole('listitem').filter({ hasText: 'VIA Demo 51' })
    : page.getByRole('row', { name: /VIA Demo 51/ })).toBeVisible()
  await page.getByRole('button', { name: 'Trang trước' }).click()

  await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('VIA Demo 01')
  const row = isMobile
    ? page.getByRole('listitem').filter({ hasText: 'VIA Demo 01' })
    : page.getByRole('row', { name: /VIA Demo 01/ })
  await expect(row).toBeVisible()
  await row.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
  const selection = page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' })
  await expect(selection).toContainText('Đã chọn 1')
  await selection.getByRole('button', { name: 'Gắn Tag' }).click()
  await expect(page.getByRole('dialog', { name: /Chọn Tag/ })).toBeVisible()
  await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()
  await selection.getByRole('button', { name: 'Chuyển thư mục' }).click()
  const moveDialog = page.getByRole('dialog', { name: 'Chọn thư mục chuyển' })
  await moveDialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
  await moveDialog.getByLabel('Tên thư mục mới').press('Enter')
  await moveDialog.getByRole('button', { name: 'Chuyển', exact: true }).click()
  await expect(page.locator('.ads-toast')).toContainText('Đã chuyển tài sản đã chọn vào Thư mục 1')
  if (isMobile) await page.getByRole('button', { name: 'Mở thư mục' }).click()
  await page.getByRole('button', { name: 'Thư mục 1' }).click()
  await expect(page.getByRole('button', { name: 'Thư mục 1' })).toHaveAttribute('aria-pressed', 'true')
})

test('supports TKQC function library and workflow builder', async ({ page, isMobile }) => {
  if (!isMobile) await page.setViewportSize({ width: 1600, height: 900 })
  await openAssetWorkspace(page)
  await page.getByRole('tab', { name: /TKQC/ }).click()

  if (!isMobile) {
    const availableOnly = page.getByRole('button', { name: 'Chỉ hiển thị tài sản khả dụng' })
    const restrictedAccounts = page.getByText('Tài khoản quảng cáo không có quyền', { exact: true })
    await expect(restrictedAccounts).toBeVisible()
    await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('TKQC Demo 61')
    await expect(restrictedAccounts).toBeVisible()
    await expect(page.getByText('Không tìm thấy tài sản', { exact: true })).toBeHidden()
    await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('')
    await expect(availableOnly).toHaveAttribute('aria-pressed', 'false')
    await availableOnly.click()
    await expect(availableOnly).toHaveAttribute('aria-pressed', 'true')
    await expect(restrictedAccounts).toBeHidden()
    await expect(page.locator('.ads-toast')).toContainText('Đã bật bộ lọc tài sản khả dụng')
    await availableOnly.click()
    await expect(availableOnly).toHaveAttribute('aria-pressed', 'false')
    await expect(restrictedAccounts).toBeVisible()
    await expect(page.locator('.ads-toast')).toContainText('Đã tắt bộ lọc tài sản khả dụng')
  }

  if (isMobile) {
    await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
  } else {
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
  }
  const tkqcLibrary = page.locator('#ads-pro-function-library')
  await expect(tkqcLibrary).toBeVisible()
  await expect(tkqcLibrary).toHaveAccessibleName('Kho chức năng TKQC')
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Đóng kho chức năng' })).toBeFocused()
    await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
    // TKQC's 31-column schema (Batch Update Part D) uses the same
    // horizontal-scroll table on mobile as BM/Page/Pixel already did — no
    // bespoke mobile-card layout, so the unauthorized SECTION ROW (not a
    // card-specific string) is what's checked here.
    await expect(page.getByText('Tài khoản quảng cáo không có quyền', { exact: true })).toBeVisible()
    await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    await expect(page.getByRole('button', { name: 'Đóng kho chức năng' })).toBeFocused()
  } else {
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toBeVisible()
  }
  await page.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
  await expect(page.getByRole('heading', { name: /Quy trình/ })).toBeVisible()
  if (isMobile) await expect(page.getByRole('button', { name: 'Đóng quy trình' })).toBeFocused()
  await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
  await expect(page.getByRole('button', { name: 'Bắt đầu quy trình' })).toBeDisabled()
  // Template is a real backend-API feature in production (POST/GET/PUT/
  // DELETE /ads-check/templates, gated on an authenticated session); this
  // clone has no such session, so Batch Update Part A implements a clone-
  // local demo store instead (see ads-check-pro-template-store.ts) —
  // save/list/load are exercised for real here, not faked as a login wall.
  await page.getByRole('button', { name: 'Lưu Template' }).click()
  await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Mở đóng TK demo')
  await page.getByRole('button', { name: 'Lưu', exact: true }).click()
  await expect(page.getByText('Template đã lưu (1)')).toBeVisible()
  await page.getByRole('button', { name: 'Đóng Template' }).click()
  await page.getByRole('button', { name: 'Xoá bước 1: Mở / Đóng TK' }).click()
  await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
  await page.getByRole('button', { name: 'Template', exact: true }).click()
  await page.getByRole('button', { name: 'Mở đóng TK demo 1 bước' }).click()
  await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')

  // The template load already re-added the function (asserted above) — the
  // Function Store row is confirmed synced (selected) too; only the account
  // selection gate remains to exercise Start's other 2 readiness checks.
  if (isMobile) await page.getByRole('button', { name: 'Đóng quy trình' }).click()
  await openFunctionLibrary(page, isMobile, 'TKQC')
  await expect(page.locator('#ads-pro-function-library').getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toHaveAttribute('aria-pressed', 'true')
  if (isMobile) await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
  await page.getByRole('checkbox', { name: /Chọn TKQC Demo 01/ }).check()
  if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
  await expect(page.getByRole('button', { name: 'Bắt đầu quy trình' })).toBeEnabled()
  await page.getByRole('button', { name: 'Bắt đầu quy trình' }).click()
  await expect(page.locator('.ads-toast')).toContainText('Đã chạy quy trình mô phỏng')
})

test('Folder stays an inline expandable panel at 1024px (VIA Final Correction: production real breakpoint is 767px, not 1180px — a drawer only appears below that)', async ({ page }) => {
  await page.setViewportSize({ width: 1024, height: 800 })
  await openAssetWorkspace(page)

  // 1024px is desktop territory (isDrawer only triggers <768px), so Folder
  // starts expanded by default here exactly like it does at 1920/1440 —
  // no drawer, no collapsed-by-default state to open first.
  const panel = page.locator('#ads-pro-folders.is-open')
  await expect(panel).toBeVisible()
  await expect(panel).not.toHaveAttribute('role', 'dialog')
  await page.getByRole('button', { name: 'Đóng thư mục' }).click()
  await expect(panel).toBeHidden()
  await expect(page.locator('#ads-pro-folders.is-collapsed')).toBeVisible()

  await page.getByRole('button', { name: 'Mở rộng thư mục' }).click()
  await page.getByRole('button', { name: 'Sửa ghi chú VIA Demo 01' }).click()
  const noteDialog = page.getByRole('dialog', { name: 'Ghi chú cho VIA Demo 01' })
  await expect(noteDialog).toBeVisible()
  await page.keyboard.press('Escape')
  await expect(noteDialog).toBeHidden()
  await expect(panel).toBeVisible()
})

test('matches the Page and Pixel asset workspaces from the references', async ({ page, isMobile }) => {
  await openAssetWorkspace(page)

  await page.getByRole('tab', { name: /^Page/ }).click()
  await expect(page.getByRole('tab', { name: /^Page/ })).toHaveAttribute('aria-selected', 'true')
  if (isMobile) {
    await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
  } else {
    await page.getByRole('button', { name: 'Mở kho chức năng Page' }).click()
  }
  const pageLibrary = page.locator('#ads-pro-function-library')
  await expect(pageLibrary).toBeVisible()
  await expect(pageLibrary).toHaveAccessibleName('Kho chức năng Page')
  await expect(pageLibrary.getByRole('button', { name: /Asset Management.*0\/4/ })).toBeVisible()
  await expect(pageLibrary.getByRole('button', { name: /Super Share.*0\/8/ })).toBeVisible()
  await expect(pageLibrary.getByRole('button', { name: /Xóa QTV ẩn.*0\/1/ })).toBeVisible()
  await expect(pageLibrary.getByRole('button', { name: /Đổi Info.*0\/4/ })).toBeVisible()
  await expect(pageLibrary.getByRole('button', { name: 'Gỡ / xóa Page khỏi BM', exact: true })).toBeVisible()
  await expect(pageLibrary.getByRole('button', { name: 'Hủy liên kết IG khỏi Page', exact: true })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Tên Page' })).toBeVisible()
  // Page Round 1 Part #3: header renamed from "Quyền / Cấp quyền" to the
  // exact production label "Quyền" (no longer "/ Cấp quyền").
  await expect(page.getByRole('columnheader', { name: 'Quyền' })).toBeAttached()
  await expect(page.getByRole('columnheader', { name: /Quyền \/ Cấp quyền/ })).toHaveCount(0)
  // Batch Update Part I3: Page now has 45 real demo rows over this exact
  // (unchanged) column schema — no more permanent empty state.
  await expect(page.getByRole('row', { name: /Page Demo 01/ })).toBeVisible()
  await expect(page.getByText('Đã chọn 0 / 45 Page', { exact: true })).toBeVisible()
  await expect(page.getByRole('button', { name: 'Lọc theo ngày' })).toHaveCount(0)
  await expect(page.getByRole('combobox', { name: 'Chế độ tải' })).toHaveCount(0)
  if (!isMobile) {
    const workflowRail = page.getByRole('button', { name: 'Mở quy trình Page' })
    await expect(workflowRail).toBeVisible()
    await workflowRail.click()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toBeVisible()
    const closeWorkflow = page.getByRole('button', { name: 'Đóng quy trình' })
    await expect(closeWorkflow).toBeFocused()
    await closeWorkflow.click()
    await expect(workflowRail).toBeFocused()
  } else {
    await pageLibrary.getByRole('button', { name: 'Đóng kho chức năng' }).click()
  }

  await page.getByRole('tab', { name: /^Pixel/ }).click()
  await expect(page.getByRole('tab', { name: /^Pixel/ })).toHaveAttribute('aria-selected', 'true')
  if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
  const pixelLibrary = page.locator('#ads-pro-function-library')
  await expect(pixelLibrary).toBeVisible()
  await expect(pixelLibrary).toHaveAccessibleName('Kho chức năng Pixel')
  await expect(pixelLibrary.locator('.ads-function-group')).toHaveCount(1)
  await expect(pixelLibrary.getByRole('button', { name: /Share Pixel.*0\/6/ })).toBeVisible()
  for (const action of ['Chỉ định người dùng', 'Gỡ người dùng', 'Thêm đối tác', 'Gỡ đối tác', 'Chia sẻ cho TKQC', 'Gỡ TKQC']) {
    await expect(pixelLibrary.getByRole('button', { name: action, exact: true })).toBeVisible()
  }
  await expect(pixelLibrary.getByText('Asset Management', { exact: true })).toHaveCount(0)
  await expect(pixelLibrary.getByText('Đổi Info', { exact: true })).toHaveCount(0)
  await expect(page.getByRole('columnheader', { name: 'ID Pixel' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'ID BM' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Tên BM' })).toBeVisible()
  await expect(page.getByRole('columnheader', { name: 'Quyền' })).toBeAttached()
  // Batch Update Part I3: Pixel now has 30 real demo rows.
  await expect(page.getByRole('row', { name: /Pixel Demo 01/ })).toBeVisible()
  await expect(page.getByText('Đã chọn 0 / 30 Pixel', { exact: true })).toBeVisible()
  const functionSearch = pixelLibrary.getByRole('textbox', { name: 'Tìm chức năng' })
  // Pin FILTER (next to Search) — production's real per-function pin
  // system, NOT the earlier round's wrong "pin the whole panel open"
  // concept (that button lived in this exact spot but meant something
  // else entirely — see Round 3 notes). Disabled while nothing is pinned.
  const pinFilter = pixelLibrary.locator('.ads-function-pin-filter')
  await expect(pinFilter).toBeDisabled()
  await expect(pinFilter).toHaveAccessibleName('Chưa ghim chức năng nào')
  await functionSearch.fill('Gỡ TKQC')
  await expect(pixelLibrary.getByRole('button', { name: /Share Pixel.*0\/6/ })).toBeVisible()
  await pixelLibrary.getByRole('button', { name: 'Xóa tìm kiếm' }).click()

  // Pin one function via its own row pin button, then use the filter.
  await pixelLibrary.getByRole('button', { name: 'Ghim Chia sẻ cho TKQC' }).click()
  await expect(pinFilter).toBeEnabled()
  await expect(pinFilter).toHaveAccessibleName('Chỉ hiện chức năng đã ghim')
  await pinFilter.click()
  await expect(pinFilter).toHaveAttribute('aria-pressed', 'true')
  await expect(pinFilter).toHaveAccessibleName('Hiện tất cả chức năng')
  await expect(pixelLibrary.getByRole('button', { name: 'Chia sẻ cho TKQC', exact: true })).toBeVisible()
  await expect(pixelLibrary.getByRole('button', { name: 'Chỉ định người dùng', exact: true })).toHaveCount(0)
  await pinFilter.click()
  await expect(pinFilter).toHaveAttribute('aria-pressed', 'false')
  await pixelLibrary.getByRole('button', { name: 'Chia sẻ cho TKQC', exact: true }).click()
  // Adding a function always closes Function Store on mobile and opens
  // Workflow instead (simplified, single behavior now that Round 3 removed
  // the wrong "pin keeps the panel open" concept — see Round 3 notes).
  if (isMobile) await expect(pixelLibrary).toBeHidden()
  await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Chia sẻ cho TKQC')
})

test('follows the Function/Workflow open-close state machine (opening Workflow also opens Function; closes are independent)', async ({ page, isMobile }) => {
  // Rail is desktop-only (locked architecture, >=1181px) — this is where the
  // state machine's two independent panels can be simultaneously visible
  // and independently closed. On mobile both panels stack via z-index
  // (Workflow above Function) as a pre-existing, unrelated visual design —
  // reaching state 11 there occludes Function's own close control, which is
  // a stacking concern, not a state-machine one, and out of this round's
  // (state-only) scope.
  test.skip(isMobile, 'rail-only state machine; mobile panel stacking is a separate, pre-existing visual concern')
  await openAssetWorkspace(page)
  await page.getByRole('tab', { name: /^Page/ }).click()

  const openFn = isMobile ? page.getByRole('button', { name: 'Mở kho chức năng' }) : page.getByRole('button', { name: 'Mở kho chức năng Page' })
  const openWf = isMobile ? page.getByRole('button', { name: 'Mở quy trình' }) : page.getByRole('button', { name: 'Mở quy trình Page' })
  const closeFn = page.getByRole('button', { name: 'Đóng kho chức năng' })
  const closeWf = page.getByRole('button', { name: 'Đóng quy trình' })
  // Function Store no longer renders an <h2> (production non-VIA header has
  // none — see Round 1 header note) — its open/closed state is asserted via
  // the panel's own is-open class instead of a heading role.
  const fnHeading = page.locator('#ads-pro-function-library.is-open')
  const wfHeading = page.getByRole('heading', { name: /^Quy trình/ })

  // 00 + OPEN_FUNCTION -> 10 (opening Function never opens Workflow)
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeHidden()
  await openFn.click()
  await expect(fnHeading).toBeVisible()
  await expect(wfHeading).toBeHidden()

  // 10 + CLOSE_FUNCTION -> 00
  await closeFn.click()
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeHidden()

  // 00 + OPEN_WORKFLOW -> 11 (Workflow's prerequisite: Function opens too)
  await openWf.click()
  await expect(fnHeading).toBeVisible()
  await expect(wfHeading).toBeVisible()

  // 11 + CLOSE_FUNCTION -> 01 (Workflow must NOT auto-close — state 01 is valid)
  await closeFn.click()
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeVisible()

  // 01 + OPEN_FUNCTION -> 11
  await openFn.click()
  await expect(fnHeading).toBeVisible()
  await expect(wfHeading).toBeVisible()

  // 11 + CLOSE_WORKFLOW -> 10 (Function must NOT auto-close)
  await closeWf.click()
  await expect(wfHeading).toBeHidden()
  await expect(fnHeading).toBeVisible()

  // 10 + OPEN_WORKFLOW -> 11
  await openWf.click()
  await expect(fnHeading).toBeVisible()
  await expect(wfHeading).toBeVisible()

  // 11 -> 01 -> 00, exercising CLOSE_FUNCTION then CLOSE_WORKFLOW from 01
  await closeFn.click()
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeVisible()
  await closeWf.click()
  await expect(wfHeading).toBeHidden()
  await expect(fnHeading).toBeHidden()

  // 01 + switch asset -> state persists as 01 (no forced re-open/close)
  await openWf.click()
  await closeFn.click()
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeVisible()
  await page.getByRole('tab', { name: /TKQC/ }).click()
  await expect(fnHeading).toBeHidden()
  await expect(wfHeading).toBeVisible()
})

test('VIA has no right-panel system at all; other assets keep it and the state restores on return', async ({ page, isMobile }) => {
  await openAssetWorkspace(page)

  // Test A: VIA never exposes the panel/rail system.
  await expect(page.getByRole('tab', { name: /VIA/ })).toHaveAttribute('aria-selected', 'true')
  await expect(page.locator('#ads-pro-function-library.is-open')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toHaveCount(0)
  if (isMobile) {
    await expect(page.getByRole('button', { name: 'Mở kho chức năng' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mở quy trình' })).toHaveCount(0)
  } else {
    await expect(page.getByRole('button', { name: 'Mở kho chức năng VIA' })).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Mở quy trình VIA' })).toHaveCount(0)
  }
  await expect(page.locator('.ads-pro-panel-rail')).toHaveCount(0)
  await expect(page.locator('.ads-pro-right-shell')).toHaveCount(0)

  // Test A (Curve C): VIA renders the host shell's straight-right-edge
  // variant — no indentation/socket — and reclaims the 58px right
  // reservation that variant would otherwise need.
  await expect(page.locator('.ads-pro-workspace-shape')).not.toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '8px')

  // Test D: non-VIA assets keep the panel system (TKQC used here).
  await page.getByRole('tab', { name: /TKQC/ }).click()

  // Test D (Curve C): non-VIA at state 00 (no panel open yet) shows the
  // exact Curve C variant + its 58px right reservation.
  await expect(page.locator('.ads-pro-workspace-shape')).toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')

  if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
  else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
  await expect(page.locator('#ads-pro-function-library')).toBeVisible()

  // Production correction: state 10 keeps Curve C and its reservation; the
  // rail contains only the control for the still-closed Workflow panel.
  await expect(page.locator('.ads-pro-workspace-shape')).toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')

  // Test E: 00 + OPEN_WORKFLOW still yields both visible on a supported asset —
  // VIA gating must not interfere with the state machine elsewhere.
  await page.getByRole('tab', { name: /^Page/ }).click()
  const closeWorkflowBtn = page.getByRole('button', { name: 'Đóng quy trình' })
  if (await closeWorkflowBtn.isVisible().catch(() => false)) await closeWorkflowBtn.click()
  const closeFnBtn = page.getByRole('button', { name: 'Đóng kho chức năng' })
  if (await closeFnBtn.isVisible().catch(() => false)) await closeFnBtn.click()
  await expect(page.locator('#ads-pro-function-library.is-open')).toBeHidden()
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toBeHidden()
  if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
  else await page.getByRole('button', { name: 'Mở quy trình Page' }).click()
  await expect(page.locator('#ads-pro-function-library.is-open')).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toBeVisible()

  // Test B: Page now sits at state 11 — switching to VIA must hide both and
  // hide the rail. On desktop this also frees the grid tracks Function/
  // Workflow/rail were consuming, so Curve B reclaims that width; on mobile
  // those panels are position:absolute overlays that never consumed grid
  // width to begin with, so there's nothing to reclaim there.
  const curveBWidthBeforeVia = await page.locator('.ads-pro-workspace-surface path').first().evaluate((el) => el.getBoundingClientRect().width)
  await page.getByRole('tab', { name: /VIA/ }).click()
  await expect(page.locator('#ads-pro-function-library.is-open')).toHaveCount(0)
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toHaveCount(0)
  await expect(page.locator('.ads-pro-panel-rail')).toHaveCount(0)
  await expect(page.locator('.ads-pro-right-shell')).toHaveCount(0)
  await expect(page.locator('.ads-pro-workspace-shape')).not.toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '8px')
  const curveBWidthVia = await page.locator('.ads-pro-workspace-surface path').first().evaluate((el) => el.getBoundingClientRect().width)
  if (isMobile) expect(curveBWidthVia).toBe(curveBWidthBeforeVia)
  else expect(curveBWidthVia).toBeGreaterThan(curveBWidthBeforeVia)

  // Test C: switching back to Page restores state 11 exactly (global state
  // was preserved underneath — only rendering was gated for VIA). State 11
  // still has both panels open, so Curve C stays hidden throughout (it never
  // "returns" mid-panel-open — only at state 00) — no morph/leftover state
  // from the VIA straight-edge variant either way.
  await page.getByRole('tab', { name: /^Page/ }).click()
  await expect(page.locator('#ads-pro-function-library.is-open')).toBeVisible()
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toBeVisible()
  await expect(page.locator('.ads-pro-workspace-shape')).not.toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '8px')

  // Closing both panels (11 → 00) restores Curve C exactly.
  await page.getByRole('button', { name: 'Đóng quy trình' }).click()
  await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
  await expect(page.locator('.ads-pro-workspace-shape')).toHaveClass(/has-curve-c/)
  if (!isMobile) await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')
})

test('Curve C stays visible with exactly one panel open and rail content follows 00→10→11→01→00', async ({ page, isMobile }) => {
  test.skip(isMobile, 'Curve C rail is desktop-only')
  await page.setViewportSize({ width: 1920, height: 1080 })
  await openAssetWorkspace(page)
  const shell = page.locator('.ads-pro-workspace-shape')

  // VIA exception.
  await expect(shell).not.toHaveClass(/has-curve-c/)
  await expect(page.locator('.ads-pro-panel-rail')).toHaveCount(0)

  await page.getByRole('tab', { name: /^Page/ }).click()
  const fnRail = page.getByRole('button', { name: 'Mở kho chức năng Page' })
  const wfRail = page.getByRole('button', { name: 'Mở quy trình Page' })

  // 00: Curve C + both rail controls + reservation.
  await expect(shell).toHaveClass(/has-curve-c/)
  await expect(shell).toHaveAttribute('data-curve-c-size', 'large')
  await expect(fnRail).toBeVisible()
  await expect(wfRail).toBeVisible()
  await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')
  const largePath = await shell.locator('path').getAttribute('d')
  const largeRailHeight = (await page.locator('.ads-pro-panel-rail').boundingBox())!.height
  await page.screenshot({ path: 'screenshots-curve-c-dynamic/1920-state-00.png' })

  // 10: Function open, Curve C remains, Workflow is the only rail control.
  await fnRail.click()
  await expect(page.locator('#ads-pro-function-library.is-open')).toBeVisible()
  await expect(shell).toHaveClass(/has-curve-c/)
  await expect(shell).toHaveAttribute('data-curve-c-size', 'small')
  await expect(fnRail).toHaveCount(0)
  await expect(wfRail).toBeVisible()
  await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')
  const state10Path = await shell.locator('path').getAttribute('d')
  const state10RailHeight = (await page.locator('.ads-pro-panel-rail').boundingBox())!.height
  expect(state10Path).not.toBe(largePath)
  expect(state10RailHeight).toBeLessThan(largeRailHeight)
  await page.screenshot({ path: 'screenshots-curve-c-dynamic/1920-state-10.png' })

  // 11: both panels open, Curve C/rail/reservation disappear.
  await wfRail.click()
  await expect(page.getByRole('heading', { name: /^Quy trình/ })).toBeVisible()
  await expect(shell).not.toHaveClass(/has-curve-c/)
  await expect(shell).toHaveAttribute('data-curve-c-size', 'none')
  await expect(page.locator('.ads-pro-panel-rail')).toHaveCount(0)
  await expect(page.locator('#ads-save-main')).toHaveCSS('right', '8px')
  await page.screenshot({ path: 'screenshots-curve-c-dynamic/1920-state-11.png' })

  // 01: close Function only, Curve C returns with Function-only rail.
  await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
  await expect(shell).toHaveClass(/has-curve-c/)
  await expect(shell).toHaveAttribute('data-curve-c-size', 'small')
  await expect(fnRail).toBeVisible()
  await expect(wfRail).toHaveCount(0)
  await expect(page.locator('#ads-save-main')).toHaveCSS('right', '58px')
  const state01Path = await shell.locator('path').getAttribute('d')
  const state01RailHeight = (await page.locator('.ads-pro-panel-rail').boundingBox())!.height
  expect(state01Path).toBe(state10Path)
  expect(state01RailHeight).toBe(state10RailHeight)
  await page.screenshot({ path: 'screenshots-curve-c-dynamic/1920-state-01.png' })

  // 00: close Workflow, both controls return without geometry changes.
  await page.getByRole('button', { name: 'Đóng quy trình' }).click()
  await expect(shell).toHaveClass(/has-curve-c/)
  await expect(shell).toHaveAttribute('data-curve-c-size', 'large')
  await expect(fnRail).toBeVisible()
  await expect(wfRail).toBeVisible()
})

test('Curve C single-panel state does not introduce page overflow across the required viewport matrix', async ({ page, isMobile }) => {
  test.skip(isMobile, 'covered by explicit viewport sizes')
  await openAssetWorkspace(page)
  await page.getByRole('tab', { name: /^Page/ }).click()
  await page.getByRole('button', { name: 'Mở kho chức năng Page' }).click()
  const shell = page.locator('.ads-pro-workspace-shape')
  for (const width of [1920, 1600, 1440, 1280, 1024, 768]) {
    await page.setViewportSize({ width, height: 900 })
    await expect(shell).toHaveClass(/has-curve-c/)
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= document.documentElement.clientWidth)).toBe(true)
  }
})

test('wires the account, edition, language, version and rail controls', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    const drawer = page.getByRole('dialog', { name: 'Menu di động' })
    await expect(drawer.getByRole('link', { name: 'Ads Check Pro' })).toHaveAttribute('aria-current', 'page')
    await expect(drawer.getByRole('button', { name: 'Pro', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await drawer.getByRole('button', { name: /Tài khoản/ }).click()
  } else {
    await page.getByRole('button', { name: /TÀI KHOẢN ADSCHECK/ }).click()
  }

  const account = page.getByRole('dialog', { name: 'Trình duyệt hiện tại' })
  await expect(account.getByText('Chưa đăng nhập Facebook')).toBeVisible()
  await expect(account.getByText('Tài khoản Adscheck', { exact: true })).toBeVisible()
  await expect(account.getByText('tai-khoan@••••')).toBeVisible()
  await expect(account.getByText('Số dư: 0đ')).toBeVisible()
  await expect(account.getByRole('button', { name: 'Lấy mã pin hỗ trợ' })).toBeVisible()
  await expect(account.getByRole('button', { name: 'Tới trang quản lý' })).toBeVisible()
  await expect(account.getByRole('button', { name: 'Đăng xuất' })).toBeVisible()
  await expect(account.getByRole('button', { name: 'Phiên đăng nhập Pro' })).toBeVisible()
  await expect(account.getByRole('button', { name: /Khám phá bản mới/ })).toBeVisible()

  await account.getByRole('button', { name: 'Đăng nhập Facebook' }).click()
  await expect(account.getByText('Đã đăng nhập Facebook')).toBeVisible()
  await expect(page.locator('.ads-toast')).toContainText('Đã kết nối tài khoản Facebook demo')
  await account.getByRole('button', { name: 'Lấy mã pin hỗ trợ' }).click()
  await expect(account.getByText('Mã PIN demo: 248 731')).toBeVisible()
  await expect(page.locator('.ads-toast')).toContainText('Đã tạo mã PIN hỗ trợ demo')
  await account.getByRole('button', { name: 'Phiên đăng nhập Pro' }).click()
  await expect(page.locator('.ads-toast')).toContainText('Phiên đăng nhập Pro')
  await account.getByRole('button', { name: 'Đăng xuất', exact: true }).click()
  await expect(account.getByText('Chưa đăng nhập TK Adscheck')).toBeVisible()
  await expect(page.locator('.ads-toast')).toContainText('Đã đăng xuất tài khoản Adscheck demo')
  await expect(account.getByRole('button', { name: 'Tới trang quản lý' })).toBeFocused()
  await account.getByRole('button', { name: 'Thu nhỏ' }).click()

  if (isMobile) return

  await page.getByRole('button', { name: 'Đổi phiên bản' }).click()
  const versionMenu = page.getByRole('menu', { name: 'Đổi phiên bản' })
  await expect(versionMenu.getByRole('menuitemradio', { name: 'Ads Check V6' })).toBeVisible()
  await page.keyboard.press('Tab')
  await expect(versionMenu).toBeHidden()
  await expect(page.getByRole('button', { name: 'Ngôn ngữ' })).toBeFocused()
  await page.getByRole('button', { name: 'Đổi phiên bản' }).click()
  await expect(versionMenu.getByRole('menuitemradio', { name: 'Ads Check', exact: true })).toBeVisible()
  await expect(versionMenu.getByRole('menuitemcheckbox', { name: 'Đặt V6 làm mặc định' })).toBeVisible()
  await versionMenu.getByRole('menuitemradio', { name: 'Ads Check V6' }).click()
  await expect(page.getByRole('button', { name: 'Đổi phiên bản' })).toContainText('v6')

  await page.getByRole('button', { name: 'Ngôn ngữ' }).click()
  const languageMenu = page.getByRole('menu', { name: 'Ngôn ngữ' })
  for (const language of ['Tiếng Việt', 'English', 'Русский', 'ไทย', '中文']) {
    await expect(languageMenu.getByRole('menuitemradio', { name: language })).toBeVisible()
  }
  await languageMenu.getByRole('menuitemradio', { name: 'English' }).click()
  await expect(page.locator('.ads-toast')).toContainText('English')
})

test('opens the implemented source destinations from account and purchase controls', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('dialog', { name: 'Menu di động' }).getByRole('button', { name: /Tài khoản/ }).click()
  } else {
    await page.getByRole('button', { name: /TÀI KHOẢN ADSCHECK/ }).click()
  }
  await page.getByRole('dialog', { name: 'Trình duyệt hiện tại' }).getByRole('button', { name: 'Tới trang quản lý' }).click()
  await expect(page).toHaveURL(/\/app\/account$/)
  await expect(page.getByRole('heading', { name: 'Tài khoản Adscheck' })).toBeVisible()

  await page.goto(adAccountsPath)
  await dismissDeviceLogin(page)

  await page.getByRole('button', { name: 'Mua gói' }).first().click()
  await expect(page).toHaveURL(/\/app\/billing\/payment$/)
  await expect(page.getByRole('tab', { name: 'Mua gói' })).toBeVisible()

  await page.goto(adAccountsPath)
  await dismissDeviceLogin(page)

  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    await page.getByRole('dialog', { name: 'Menu di động' }).getByRole('button', { name: /Mua gói Priority/ }).click()
  } else {
    await page.getByRole('button', { name: /Mua gói Priority/ }).click()
  }
  await expect(page).toHaveURL(/\/app\/billing\/payment$/)
  await expect(page.getByRole('button', { name: /Priority Khách hàng Priority/ })).toBeVisible()
})

test('navigates between the two implemented Ads Check modules', async ({ page, isMobile }) => {
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
  } else {
    await page.getByRole('button', { name: 'Đổi phiên bản' }).click()
    await page.getByRole('menu', { name: 'Đổi phiên bản' }).getByRole('menuitemradio', { name: 'Ads Check V6' }).click()
    await page.getByRole('link', { name: 'Ads Save' }).click()
  }
  if (isMobile) await page.getByRole('link', { name: 'Ads Save' }).click()
  await expect(page).toHaveURL(/\/app\/ads-save$/)
  if (isMobile) {
    await page.getByRole('button', { name: 'Menu' }).click()
    await expect(page.getByRole('dialog', { name: 'Menu di động' }).getByRole('link', { name: 'Ads Save' })).toHaveAttribute('aria-current', 'page')
  } else {
    await expect(page.getByRole('link', { name: 'Ads Save' })).toHaveAttribute('aria-current', 'page')
    await expect(page.getByRole('button', { name: 'Đổi phiên bản' })).toContainText('v6')
  }
})

test('keeps the current-session version ahead of the saved default', async ({ page }) => {
  await page.evaluate(() => {
    window.localStorage.setItem('ads-check-version-preference', 'v6')
    window.sessionStorage.setItem('ads-check-session-version', 'v8')
  })
  await page.reload()
  await expect(page.locator('button[aria-label="Đổi phiên bản"]')).toContainText('v8')
})

test.describe('shared top row: asset tabs + action toolbar', () => {
  // Desktop-only concept — the drawer/mobile viewport keeps the toolbar in
  // its pre-existing spot above the table (unchanged, out of scope here).
  test.skip(({ isMobile }) => isMobile, 'desktop-only shared top row + width-based compact toolbar')

  test('toolbar shares the same row as the asset tabs and the table is not pushed down by a second row', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const tabsBox = await page.locator('.ads-asset-tabs').boundingBox()
    const toolbarBox = await page.locator('.ads-pro-toolbar').boundingBox()
    const tableTop = (await page.locator('.ads-pro-asset-panel').boundingBox())!.y
    expect(tabsBox).not.toBeNull()
    expect(toolbarBox).not.toBeNull()
    // Same vertical band, not a second row.
    expect(Math.abs(tabsBox!.y - toolbarBox!.y)).toBeLessThan(4)
    expect(Math.abs((tabsBox!.y + tabsBox!.height) - (toolbarBox!.y + toolbarBox!.height))).toBeLessThan(4)
    // No second toolbar row pushing the table down — table starts right at
    // the shared row's own bottom edge.
    expect(Math.abs(tableTop - (tabsBox!.y + tabsBox!.height))).toBeLessThan(4)
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0)
  })

  test('state 00: full width — normal toolbar, no dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.getByRole('button', { name: 'Tùy chỉnh cột' })).toBeVisible()
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0)
  })

  test('state 10: Function open, still enough width at 1920 — normal toolbar', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await expect(page.locator('.ads-function-library.is-open')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tùy chỉnh cột' })).toBeVisible()
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0)
  })

  test('width-driven compact: state 11 stays full at 1920 but goes compact at 1440, keeping Tải/Refresh/Search inline', async ({ page }) => {
    await page.setViewportSize({ width: 1920, height: 1080 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await expect(page.locator('.ads-workflow-panel.is-open')).toBeVisible()
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0, { timeout: 2000 })

    await page.setViewportSize({ width: 1440, height: 900 })
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tải TK' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Làm mới TKQC' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Tìm kiếm tài sản' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Tùy chỉnh cột' })).toHaveCount(0)

    const toolbarBox = (await page.locator('.ads-pro-toolbar').boundingBox())!
    const curveBBox = (await page.locator('.ads-pro-main-region').boundingBox())!
    expect(toolbarBox.x + toolbarBox.width).toBeLessThanOrEqual(curveBBox.x + curveBBox.width + 1)
    const wrapped = await page.locator('.ads-pro-toolbar').evaluate((el) => el.scrollHeight > el.clientHeight + 2)
    expect(wrapped).toBe(false)
    // Final Update P0 regression: the toolbar's own left edge must never sit
    // to the left of the last asset tab's right edge (the exact bug found —
    // "Tải TK" bleeding into the "Pixel" tab at this width/state).
    const lastTabBox = (await page.getByRole('tab').last().boundingBox())!
    expect(lastTabBox.x + lastTabBox.width).toBeLessThanOrEqual(toolbarBox.x + 0.5)

    // resize back up — full mode returns automatically, no residual dropdown
    await page.setViewportSize({ width: 1920, height: 1080 })
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Tùy chỉnh cột' })).toBeVisible()
  })

  test('toolbar bounding-box regression at 1440/1600/1720/1920 — no tab overlap, no child clipping, no wrap', async ({ page }) => {
    // A toBeVisible()-only assertion (as most tests above use) does not catch
    // geometry bugs: Playwright's visibility check ignores whether an
    // ancestor's overflow silently clips part of an element, or whether an
    // unrelated sibling visually overlaps it. This test asserts real
    // bounding boxes instead, at every width/state the Final Update spec
    // calls out.
    const widthsAndStates: { width: number; openBoth: boolean }[] = [
      { width: 1440, openBoth: true },
      { width: 1600, openBoth: true },
      { width: 1720, openBoth: false },
      { width: 1720, openBoth: true },
      { width: 1920, openBoth: true },
    ]
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    for (const { width, openBoth } of widthsAndStates) {
      await page.setViewportSize({ width, height: 900 })
      const functionOpen = await page.locator('#ads-pro-function-library.is-open').isVisible().catch(() => false)
      if (openBoth && !functionOpen) await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
      if (openBoth) {
        const workflowOpen = await page.locator('.ads-workflow-panel.is-open').isVisible().catch(() => false)
        if (!workflowOpen) await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
      } else {
        if (functionOpen) await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
        const workflowOpen = await page.locator('.ads-workflow-panel.is-open').isVisible().catch(() => false)
        if (workflowOpen) await page.getByRole('button', { name: 'Đóng quy trình' }).click()
      }
      await page.waitForTimeout(150)

      const toolbarBox = (await page.locator('.ads-pro-toolbar').boundingBox())!
      const lastTabBox = (await page.getByRole('tab').last().boundingBox())!
      expect(lastTabBox.x + lastTabBox.width, `tab/toolbar overlap at ${width}px openBoth=${openBoth}`).toBeLessThanOrEqual(toolbarBox.x + 0.5)

      const wrapped = await page.locator('.ads-pro-toolbar').evaluate((el) => el.scrollHeight > el.clientHeight + 2)
      expect(wrapped, `toolbar wrapped at ${width}px openBoth=${openBoth}`).toBe(false)

      // Every visible toolbar child (excluding the mobile buttons, hidden on
      // desktop, and the permanently-hidden measurement clone) must sit
      // fully within the toolbar's own box — no clipping, no escaping.
      const childBoxes = await page.locator('.ads-pro-toolbar > *').evaluateAll((els) =>
        els
          .filter((el) => !el.classList.contains('ads-pro-mobile-panel-buttons') && !el.classList.contains('ads-pro-toolbar-measure'))
          .map((el) => JSON.parse(JSON.stringify(el.getBoundingClientRect()))),
      )
      for (const child of childBoxes) {
        expect(child.left, `child left within toolbar at ${width}px openBoth=${openBoth}`).toBeGreaterThanOrEqual(toolbarBox.x - 0.5)
        expect(child.right, `child right within toolbar at ${width}px openBoth=${openBoth}`).toBeLessThanOrEqual(toolbarBox.x + toolbarBox.width + 0.5)
      }
    }
  })

  test('Hành động dropdown contains the overflow actions and invokes the original handler', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    const trigger = page.getByRole('button', { name: 'Hành động' })
    await expect(trigger).toBeVisible()
    await trigger.click()
    const menu = page.locator('.ads-pro-actions-menu')
    await expect(menu).toBeVisible()
    // VIA Audit Batch 1 Part D: the old density toggle button was replaced
    // by "Tùy chỉnh cột" (opens the Column Settings modal, no aria-pressed
    // toggle state) — picking it from the compact dropdown must still open
    // the modal and close the dropdown, not leave a stale/detached anchor.
    await menu.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    await expect(menu).toBeHidden()
    await expect(page.locator('.ads-column-settings-modal')).toBeVisible()
    await page.getByRole('button', { name: 'Hủy' }).click()
    await expect(page.locator('.ads-column-settings-modal')).toBeHidden()

    await trigger.click()
    await expect(menu).toBeVisible()
    // click outside closes it without side effects on the parent toolbar
    await page.mouse.click(20, 20)
    await expect(menu).toBeHidden()
  })

  test('asset switch while Workflow is open: dropdown updates to the current asset\'s own actions', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toBeVisible()
    await page.getByRole('button', { name: 'Hành động' }).click()
    // TKQC-only controls present (Round 1: date range picker, currency filter)
    await expect(page.locator('.ads-pro-actions-menu').getByLabel('Chọn khoảng thời gian Tổng tiêu')).toBeVisible()

    await page.getByRole('tab', { name: /^Page/ }).click()
    await expect(page.locator('.ads-pro-actions-menu')).toHaveCount(0)
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toBeVisible()
    await page.getByRole('button', { name: 'Hành động' }).click()
    // Page has no date-range picker / currency filter — stale TKQC items must not linger
    await expect(page.locator('.ads-pro-actions-menu').getByLabel('Chọn khoảng thời gian Tổng tiêu')).toHaveCount(0)
    await expect(page.locator('.ads-pro-actions-menu').getByLabel('Chỉ hiển thị tài sản khả dụng')).toBeVisible()
  })

  test('VIA: full toolbar on its own row band, no stale Workflow-compact dropdown', async ({ page }) => {
    await page.setViewportSize({ width: 1300, height: 900 })
    await openAssetWorkspace(page)
    await expect(page.getByRole('tab', { name: /VIA/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.ads-pro-actions-menu-wrapper')).toHaveCount(0)
    await expect(page.getByRole('button', { name: 'Cài đặt Control Hub' })).toBeVisible()
    const tabsBox = (await page.locator('.ads-asset-tabs').boundingBox())!
    const toolbarBox = (await page.locator('.ads-pro-toolbar').boundingBox())!
    expect(Math.abs(tabsBox.y - toolbarBox.y)).toBeLessThan(4)
  })
})

test.describe('Function Store: production catalog data & identity', () => {
  test('TKQC: exact production groups in canonical order, 23 visible functions', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const groupNames = await library.locator('.ads-function-group-heading strong').allTextContents()
    expect(groupNames).toEqual(['Asset Management', 'Super Share', 'Xóa QTV ẩn', 'Đổi Info', 'Payment & Billing', 'Trình quản lý quảng cáo', 'Kháng TKQC'])
    await expect(library.locator('.ads-function-group li')).toHaveCount(23)
    // Previously-wrong/truncated labels, now exact production text.
    await expect(library.getByRole('button', { name: 'Xóa quyền người dùng trong BM', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Đổi tên TKQC', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Đổi thông tin TKQC', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Set thẻ mặc định', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Check Hold', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Lên camp XLSX', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Kháng tài khoản', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Lấy link TKBM', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Lấy link XMDT', exact: true })).toBeVisible()
  })

  test('TKQC: hidden production functions are never rendered', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    for (const hiddenLabel of ['Thêm thẻ', 'Quản lý chiến dịch', 'Lên camp mồi', 'Tạo cuộc gọi Meta Pro']) {
      await expect(library.getByRole('button', { name: hiddenLabel, exact: true })).toHaveCount(0)
    }
  })

  test('BM: exact production groups — no fake "Xóa QTV ẩn" group, "Kích hoạt Page" replaced by real "Quản lý Page", 28 visible functions', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng BM' }).click()
    const library = page.locator('#ads-pro-function-library')
    const groupNames = await library.locator('.ads-function-group-heading strong').allTextContents()
    expect(groupNames).toEqual(['Asset Management', 'Super Share', 'Đổi Info', 'Kháng TKQC'])
    await expect(library.locator('.ads-function-group li')).toHaveCount(28)
    await expect(library.getByRole('button', { name: 'Quản lý Page', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Kích hoạt Page', exact: true })).toHaveCount(0)
    await expect(library.getByRole('button', { name: 'Lấy link kháng BM', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Backup BM sang tài khoản khác', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Tạo TKQC Read-Only trong BM', exact: true })).toBeVisible()
    // These invented items from the earlier round must be gone entirely.
    for (const fakeLabel of ['Gỡ quyền nhân viên', 'Chia sẻ Page', 'Chia sẻ Pixel', 'Gỡ Pixel']) {
      await expect(library.getByRole('button', { name: fakeLabel, exact: true })).toHaveCount(0)
    }
  })

  test('Page: 17 visible functions, "Quản lý Page" present, exact QTV invite label', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng Page' }).click()
    const library = page.locator('#ads-pro-function-library')
    await expect(library.locator('.ads-function-group li')).toHaveCount(17)
    await expect(library.getByRole('button', { name: 'Quản lý Page', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Chấp nhận / xem lời mời QTV', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Quản lý Page vị trí', exact: true })).toHaveCount(0)
  })

  test('search matches group name and function name, and auto-opens matching groups', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')

    // Manually collapse a group first, then search for a function belonging
    // to it — production auto-opens matching groups regardless of their own
    // manually-collapsed state.
    await library.getByRole('button', { name: /Payment & Billing/ }).click()
    await expect(library.getByRole('button', { name: 'Check Hold', exact: true })).toBeHidden()
    await library.getByRole('textbox', { name: 'Tìm chức năng' }).fill('check hold')
    await expect(library.getByRole('button', { name: 'Check Hold', exact: true })).toBeVisible()

    // Search matching the GROUP name (not any function name) surfaces every
    // function in that group.
    await library.getByRole('textbox', { name: 'Tìm chức năng' }).fill('Kháng TKQC')
    await expect(library.getByRole('button', { name: 'Kháng tài khoản', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Lấy link TKBM', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Đổi tên TKQC', exact: true })).toHaveCount(0)
  })

  test('group collapse/open toggles independently of other groups', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const assetGroupToggle = library.getByRole('button', { name: /Asset Management/ })
    const shareGroupToggle = library.getByRole('button', { name: /Super Share/ })
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
    await assetGroupToggle.click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeHidden()
    // Collapsing one group does not affect a sibling group.
    await expect(library.getByRole('button', { name: 'Share đối tác', exact: true })).toBeVisible()
    await shareGroupToggle.click()
    await expect(library.getByRole('button', { name: 'Share đối tác', exact: true })).toBeHidden()
    await assetGroupToggle.click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
  })

  test('switching asset updates the catalog without stale rows from the previous asset, and functionId identity survives selection', async ({ page, isMobile }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()

    await page.getByRole('tab', { name: /^BM/ }).click()
    // TKQC-only rows must not linger after switching to BM.
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toHaveCount(0)
    await expect(library.getByRole('button', { name: 'Tạo BM mới', exact: true })).toBeVisible()

    await page.getByRole('tab', { name: /^Page/ }).click()
    await expect(library.getByRole('button', { name: 'Tạo BM mới', exact: true })).toHaveCount(0)
    await expect(library.getByRole('button', { name: 'Tạo Page', exact: true })).toBeVisible()

    // Add the same-named-looking function from two different assets back to
    // back — stable functionId identity (not label, not array index) must
    // keep each asset's own workflow selection independent, no key collision.
    await page.getByRole('tab', { name: /TKQC/ }).click()
    // Adding a function auto-opens the Workflow panel (existing approved
    // state-machine behavior) — no separate "Mở quy trình" click needed.
    await page.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
    const closeWf = page.getByRole('button', { name: 'Đóng quy trình' })
    if (await closeWf.isVisible().catch(() => false)) await closeWf.click()

    expect(consoleErrors.filter((e) => /key|duplicate/i.test(e))).toEqual([])
  })
})

test.describe('Folder panel: collapse becomes a persistent mini rail, not display:none', () => {
  // Desktop-only concept — the mobile drawer overlay hides Folder entirely
  // when closed (unchanged, out of this round's scope).
  test.skip(({ isMobile }) => isMobile, 'desktop-only mini rail (production .folder-panel--collapsed, 84px)')

  test('collapsing keeps a visible 84px mini rail (active folder, +, expand) and the table never overlaps it; expanding restores the same active folder', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()

    const folder = page.locator('#ads-pro-folders')
    const expandedBox = (await folder.boundingBox())!
    expect(expandedBox.width).toBeGreaterThan(100)
    await expect(folder.getByRole('button', { name: 'Tất cả' })).toBeVisible()

    await page.getByRole('button', { name: 'Đóng thư mục' }).click()

    // Mini rail persists — never display:none.
    await expect(folder).toBeVisible()
    const collapsedBox = (await folder.boundingBox())!
    expect(collapsedBox.width).toBe(84)
    await expect(page.locator('.ads-pro-folders-mini-active')).toBeVisible()
    await expect(page.locator('.ads-pro-folders-mini-active')).toHaveText('Tất cả')
    await expect(page.getByRole('button', { name: 'Thêm thư mục', exact: true })).toBeVisible()
    const expandControl = page.getByRole('button', { name: 'Mở rộng thư mục' })
    await expect(expandControl).toBeVisible()

    // Table starts at (not before) the collapsed rail's right edge — no
    // overlap, and the table keeps the asset panel's full height.
    const tableBox = (await page.locator('.ads-pro-asset-panel').boundingBox())!
    expect(tableBox.x).toBeGreaterThanOrEqual(collapsedBox.x + collapsedBox.width - 1)
    const mainRegionBox = (await page.locator('.ads-pro-main-region').boundingBox())!
    expect(Math.abs(tableBox.height - mainRegionBox.height)).toBeLessThan(2)

    // Selecting a different folder while expanded, collapsing, then
    // re-expanding must preserve that selection (no reset on collapse).
    await expandControl.click()
    await expect(folder.getByRole('button', { name: 'Tất cả' })).toBeVisible()
    await folder.getByRole('button', { name: 'Nhóm mẫu A' }).click()
    await page.getByRole('button', { name: 'Đóng thư mục' }).click()
    await expect(page.locator('.ads-pro-folders-mini-active')).toHaveText('Nhóm mẫu A')
    await page.getByRole('button', { name: 'Mở rộng thư mục' }).click()
    await expect(folder.getByRole('button', { name: 'Nhóm mẫu A' })).toHaveAttribute('aria-pressed', 'true')
    const reExpandedBox = (await folder.boundingBox())!
    expect(reExpandedBox.width).toBeGreaterThan(100)
  })
})

test.describe('Function Store: row interaction & states (Round 2)', () => {
  test('normal/hover/selected states: row is unselected by default, aria-pressed toggles on add, and the row itself carries the accessible name', async ({ page, isMobile }) => {
    // Mobile drawer auto-closes Function Store on an unpinned add (pre-existing,
    // approved state-machine behavior — pin mechanics are out of this round's scope).
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await expect(row).toBeVisible()
    await expect(row).toHaveAttribute('aria-pressed', 'false')

    await row.click()
    await expect(row).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
  })

  test('add is idempotent: clicking an already-selected row again does not create a duplicate workflow step', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await row.click()
    await row.click()
    await row.click()
    await expect(page.getByRole('heading', { name: /Quy trình.*1 bước/ })).toBeVisible()
  })

  test('remove via the trailing control: only the small control removes, not a click anywhere on an already-selected row', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await row.click()
    await expect(row).toHaveAttribute('aria-pressed', 'true')

    const removeControl = library.getByRole('button', { name: 'Bỏ chọn Mở / Đóng TK' })
    await expect(removeControl).toBeVisible()
    await removeControl.click()
    await expect(row).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
  })

  test('multiple selections: workflow count goes 0→1→2→3, removing the middle one leaves the other two, then 0 restores the empty state', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    // Workflow panel isn't rendered as open (and so isn't in the a11y tree)
    // until the first add auto-opens it — matches the existing approved
    // Function/Workflow state machine, not asserted again here.
    const workflowHeading = page.getByRole('heading', { name: /Quy trình/ })
    const workflowList = page.getByRole('list', { name: 'Các bước trong quy trình' })

    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(workflowHeading).toContainText('1 bước')
    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    await expect(workflowHeading).toContainText('2 bước')
    await library.getByRole('button', { name: 'Đổi thông tin TKQC', exact: true }).click()
    await expect(workflowHeading).toContainText('3 bước')

    await library.getByRole('button', { name: 'Bỏ chọn Giới hạn chi tiêu' }).click()
    await expect(workflowHeading).toContainText('2 bước')
    await expect(workflowList).toContainText('Mở / Đóng TK')
    await expect(workflowList).toContainText('Đổi thông tin TKQC')
    await expect(workflowList).not.toContainText('Giới hạn chi tiêu')

    await library.getByRole('button', { name: 'Bỏ chọn Mở / Đóng TK' }).click()
    await library.getByRole('button', { name: 'Bỏ chọn Đổi thông tin TKQC' }).click()
    await expect(workflowHeading).toContainText('0 bước')
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
  })

  test('Guide click never adds/removes, and shows either the real video link or the exact production placeholder when absent', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')

    // Has a real production videoUrl.
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await library.locator('.ads-function-row', { hasText: 'Mở / Đóng TK' }).getByRole('button', { name: 'Xem cách sử dụng' }).click()
    const dialog = page.getByRole('dialog', { name: 'Hướng dẫn sử dụng' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Xem video hướng dẫn' })).toHaveAttribute('href', /youtube\.com/)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(row).toHaveAttribute('aria-pressed', 'false')

    // "Check Hold" has no production videoUrl — shows the exact i18n placeholder.
    await library.locator('.ads-function-row', { hasText: 'Check Hold' }).getByRole('button', { name: 'Xem cách sử dụng' }).click()
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Nội dung hướng dẫn đang được cập nhật.', { exact: true })).toBeVisible()
    await expect(dialog.getByRole('link', { name: 'Xem video hướng dẫn' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('drag handle click never adds/removes (visual-only, no reorder wiring yet)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.locator('.ads-function-row', { hasText: 'Mở / Đóng TK' })
    await row.locator('.ads-function-row-handle').click({ force: true })
    await expect(row).toHaveAttribute('aria-pressed', 'false')
  })

  test('keyboard: Enter/Space on a focused row adds, Enter on the trailing control removes', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await row.focus()
    await page.keyboard.press('Enter')
    await expect(row).toHaveAttribute('aria-pressed', 'true')

    const removeControl = library.getByRole('button', { name: 'Bỏ chọn Mở / Đóng TK' })
    await removeControl.focus()
    await page.keyboard.press('Enter')
    await expect(row).toHaveAttribute('aria-pressed', 'false')
  })

  test('functionId collision: "Quản lý nhóm tài sản" exists under 3 different assets — selecting it in one asset never selects it in another (composite-key identity)', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const tkqcRow = library.getByRole('button', { name: 'Quản lý nhóm tài sản', exact: true })
    await tkqcRow.click()
    await expect(tkqcRow).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('tab', { name: /^BM/ }).click()
    const bmRow = library.getByRole('button', { name: 'Quản lý nhóm tài sản', exact: true })
    await expect(bmRow).toHaveAttribute('aria-pressed', 'false')

    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(library.getByRole('button', { name: 'Quản lý nhóm tài sản', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('no console errors across add/remove/guide/keyboard interaction', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; not this round\'s concern')
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở kho chức năng' }).click()
    else await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await row.click()
    await row.click()
    await library.locator('.ads-function-row', { hasText: 'Mở / Đóng TK' }).getByRole('button', { name: 'Xem cách sử dụng' }).click()
    await page.keyboard.press('Escape')
    await library.getByRole('button', { name: 'Bỏ chọn Mở / Đóng TK' }).click()

    expect(consoleErrors).toEqual([])
  })
})

test.describe('Function Store: Workflow Mode (Round 3)', () => {
  test('no storage: defaults to Workflow mode; dialog shows the exact production options', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const trigger = library.locator('.ads-function-workflow-mode-trigger')
    await expect(trigger).toHaveText(/Chế độ Workflow/)
    await expect(page.evaluate(() => localStorage.getItem('adaccounts.workflow-mode.v1'))).resolves.toBeNull()

    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await expect(dialog).toBeVisible()
    const singleOption = dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ })
    const workflowOption = dialog.getByRole('radio', { name: /Chạy nhiều chức năng\/lượt/ })
    await expect(singleOption).toBeVisible()
    await expect(workflowOption).toBeVisible()
    await expect(workflowOption).toBeChecked()
    await expect(singleOption).not.toBeChecked()
    await expect(dialog.getByText('Thực hiện một chức năng cho mỗi lượt chạy, phù hợp khi cần kiểm soát từng thao tác.')).toBeVisible()
    await expect(dialog.getByText('Thực hiện nhiều chức năng trong một lần chạy, phù hợp khi cần chạy nhiều chức năng lặp lại.')).toBeVisible()
  })

  test('Escape discards the draft: selecting Single then closing without Save changes nothing', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const trigger = library.locator('.ads-function-workflow-mode-trigger')
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveText(/Chế độ Workflow/)
    await expect(page.evaluate(() => localStorage.getItem('adaccounts.workflow-mode.v1'))).resolves.toBeNull()
  })

  test('Cancel button also discards the draft (same as Escape)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const trigger = library.locator('.ads-function-workflow-mode-trigger')
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.locator('footer').getByRole('button', { name: 'Hủy' }).click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveText(/Chế độ Workflow/)
  })

  test('Save applies Single mode: trigger label + localStorage update, and it survives reload', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, isMobile, 'TKQC')
    let trigger = library.locator('.ads-function-workflow-mode-trigger')
    await trigger.click()
    let dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect(dialog).toBeHidden()
    await expect(trigger).toHaveText(/Chế độ chạy đơn/)
    await expect(page.evaluate(() => localStorage.getItem('adaccounts.workflow-mode.v1'))).resolves.toBe('single')

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    library = await openFunctionLibrary(page, isMobile, 'TKQC')
    trigger = library.locator('.ads-function-workflow-mode-trigger')
    await expect(trigger).toHaveText(/Chế độ chạy đơn/)

    // Switch back to Workflow and confirm that persists too.
    await trigger.click()
    dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy nhiều chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect(trigger).toHaveText(/Chế độ Workflow/)
    await expect(page.evaluate(() => localStorage.getItem('adaccounts.workflow-mode.v1'))).resolves.toBe('workflow')
  })

  test('invalid stored value falls back to the Workflow default', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.evaluate(() => localStorage.setItem('adaccounts.workflow-mode.v1', 'banana'))
    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await expect(library.locator('.ads-function-workflow-mode-trigger')).toHaveText(/Chế độ Workflow/)
  })

  test('switching to Single prunes every asset down to its first step and reports the exact removed count', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; needs 3 adds with the panel staying open')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    await library.getByRole('button', { name: 'Đổi thông tin TKQC', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('3 bước')

    const trigger = library.locator('.ads-function-workflow-mode-trigger')
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()

    await expect(page.locator('.ads-toast')).toContainText('Đã chuyển sang chế độ 1 chức năng, đã bỏ 2 bước')
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')

    // Single mode: selecting a different function REPLACES the selection,
    // it never accumulates (traced from production's selectFunction).
    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Giới hạn chi tiêu')
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).not.toContainText('Mở / Đóng TK')
  })

  test('switching mode with 0 or 1 existing steps prunes nothing and shows no toast', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store after add; the trigger needed for this flow lives inside it')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')

    const trigger = library.locator('.ads-function-workflow-mode-trigger')
    await trigger.click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()
    await expect(page.locator('.ads-toast')).toHaveCount(0)
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')
  })
})

test.describe('Function Store: Per-function Pin + Pin Filter (Round 3)', () => {
  test('pin click never selects/adds; pinned visual (aria-pressed) is independent of row selection', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    const pinButton = library.getByRole('button', { name: 'Ghim Mở / Đóng TK' })
    await pinButton.click()
    await expect(row).toHaveAttribute('aria-pressed', 'false')
    await expect(library.getByRole('button', { name: 'Bỏ ghim Mở / Đóng TK' })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toHaveCount(0)
  })

  test('pin filter: disabled with 0 pins, exact tooltip text at each state, hides groups with no pinned function entirely', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const pinFilter = library.locator('.ads-function-pin-filter')
    await expect(pinFilter).toBeDisabled()
    await expect(pinFilter).toHaveAccessibleName('Chưa ghim chức năng nào')

    await library.getByRole('button', { name: 'Ghim Mở / Đóng TK', exact: true }).click()
    await expect(pinFilter).toBeEnabled()
    await expect(pinFilter).toHaveAccessibleName('Chỉ hiện chức năng đã ghim')
    await expect(pinFilter.locator('.ads-function-pin-count-badge')).toHaveText('1')

    await pinFilter.click()
    await expect(pinFilter).toHaveAttribute('aria-pressed', 'true')
    await expect(pinFilter).toHaveAccessibleName('Hiện tất cả chức năng')
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
    // A group with zero pinned functions disappears entirely (not just its
    // functions) — "Super Share" has none pinned here.
    await expect(library.getByText('Super Share', { exact: true })).toHaveCount(0)
    await expect(library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true })).toHaveCount(0)
  })

  test('search + pin filter combine (AND, not OR)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Ghim Mở / Đóng TK', exact: true }).click()
    await library.getByRole('button', { name: 'Ghim Giới hạn chi tiêu', exact: true }).click()
    await library.locator('.ads-function-pin-filter').click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true })).toBeVisible()

    await library.getByRole('textbox', { name: 'Tìm chức năng' }).fill('Mở / Đóng')
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
    await expect(library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true })).toHaveCount(0)
  })

  test('unpinning the last pinned function auto-disables the pin filter', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const pinFilter = library.locator('.ads-function-pin-filter')
    await library.getByRole('button', { name: 'Ghim Mở / Đóng TK', exact: true }).click()
    await pinFilter.click()
    await expect(pinFilter).toHaveAttribute('aria-pressed', 'true')

    await library.getByRole('button', { name: 'Bỏ ghim Mở / Đóng TK', exact: true }).click()
    await expect(pinFilter).toBeDisabled()
    await expect(pinFilter).toHaveAttribute('aria-pressed', 'false')
    // Filter auto-off means every function is visible again immediately.
    await expect(library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true })).toBeVisible()
  })

  test('pins are independent per asset tab (TKQC vs BM vs Page vs Pixel) and persist across reload using the exact production storage keys', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Ghim Mở / Đóng TK', exact: true }).click()
    if (isMobile) await library.getByRole('button', { name: 'Đóng kho chức năng' }).click()

    await page.getByRole('tab', { name: /^BM/ }).click()
    library = await openFunctionLibrary(page, isMobile, 'BM')
    await expect(library.getByRole('button', { name: 'Ghim Tạo BM mới', exact: true })).toBeVisible()
    // TKQC's pin must not leak in as a BM pin.
    await expect(library.locator('.ads-function-pin-filter')).toBeDisabled()
    await library.getByRole('button', { name: 'Ghim Tạo BM mới', exact: true }).click()
    if (isMobile) await library.getByRole('button', { name: 'Đóng kho chức năng' }).click()

    await expect(page.evaluate(() => localStorage.getItem('adaccounts.tkqc-tool-pinned.v1'))).resolves.toBe(JSON.stringify(['open-close-account']))
    await expect(page.evaluate(() => localStorage.getItem('adaccounts.bm-tool-pinned.v1'))).resolves.toBe(JSON.stringify(['create-bm']))

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await expect(library.getByRole('button', { name: 'Bỏ ghim Mở / Đóng TK', exact: true })).toBeVisible()
    await page.getByRole('tab', { name: /^BM/ }).click()
    library = await openFunctionLibrary(page, isMobile, 'BM')
    await expect(library.getByRole('button', { name: 'Bỏ ghim Tạo BM mới', exact: true })).toBeVisible()
  })

  test('malformed pin storage falls back to no pins, no crash, no ghost rows', async ({ page, isMobile }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.evaluate(() => localStorage.setItem('adaccounts.tkqc-tool-pinned.v1', '{"not":"an array"}'))
    await page.evaluate(() => localStorage.setItem('adaccounts.pixel-tool-pinned.v1', JSON.stringify(['no-such-function-id', 'assign-people'])))
    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)

    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await expect(library.locator('.ads-function-pin-filter')).toBeDisabled()

    // Pixel: the unknown persisted id must not render a ghost row, but the
    // real pinned function still restores correctly.
    await page.getByRole('tab', { name: /^Pixel/ }).click()
    library = await openFunctionLibrary(page, isMobile, 'Pixel')
    await expect(library.getByRole('button', { name: 'Bỏ ghim Chỉ định người dùng', exact: true })).toBeVisible()
    // The count badge mirrors production's own pinnedCount = pinnedIds.size
    // (the raw stored Set, not filtered against the current catalog) — it's
    // 2 here (1 real + 1 orphaned id), even though only 1 row actually
    // renders. No ghost row, no crash — just an accurate reflection of what
    // is genuinely persisted.
    await expect(library.locator('.ads-function-pin-filter .ads-function-pin-count-badge')).toHaveText('2')
    await expect(library.locator('.ads-function-row')).toHaveCount(6)

    expect(consoleErrors).toEqual([])
  })

  test('manually collapsed group state survives toggling the pin filter on and off', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Ghim Mở / Đóng TK', exact: true }).click()
    await library.getByRole('button', { name: /Super Share/ }).click()
    await expect(library.getByRole('button', { name: 'Share đối tác', exact: true })).toBeHidden()

    await library.locator('.ads-function-pin-filter').click()
    await library.locator('.ads-function-pin-filter').click()
    await expect(library.getByRole('button', { name: 'Share đối tác', exact: true })).toBeHidden()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeVisible()
  })
})

// Keyboard-driven reorder (dnd-kit's KeyboardSensor: focus the handle, Space
// to pick up, Arrow keys to move, Space to drop) — far more reliable in
// Playwright than simulating raw pointer drag coordinates, and doubles as
// real accessibility coverage since this session added keyboard support
// beyond production's own (pointer-only) capability.
async function reorderByKeyboard(page: Page, handle: ReturnType<Page['locator']>, key: 'ArrowUp' | 'ArrowDown', times: number) {
  await handle.focus()
  await page.keyboard.press('Space')
  for (let i = 0; i < times; i++) {
    await page.keyboard.press(key)
    await page.waitForTimeout(60)
  }
  await page.keyboard.press('Space')
}

const superShareOrder = ['Share đối tác', 'Xóa đối tác', 'Thêm admin', 'Chỉ định quyền', 'Quản lý nhóm tài sản', 'Thêm dòng 2 BM']

test.describe('Function Store: Drag Reorder + Order/Collapse Persistence (Round 4)', () => {
  // Desktop-only: same reasoning as Round 2/3 mobile skips — keyboard
  // reorder needs the handle to hold focus across the whole sequence,
  // which the mobile drawer's own overlay/viewport handling makes brittle;
  // production itself doesn't offer touch drag reorder as a resilient
  // mobile pattern either (see report for the mobile audit result).
  test.skip(({ isMobile }) => isMobile, 'keyboard-driven reorder sequence targets desktop; see Round 4 mobile audit in the report')

  test('same-group reorder: moving one row changes only that group\'s order, no duplicate/lost function, reload restores it', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, false, 'TKQC')
    const group = library.locator('.ads-function-group.is-super-share')
    await expect(group.locator('.ads-function-row-label')).toHaveText(superShareOrder)

    const handle = group.locator('.ads-function-row').nth(3).locator('.ads-function-row-handle') // "Chỉ định quyền"
    await reorderByKeyboard(page, handle, 'ArrowUp', 3)

    const expected = ['Chỉ định quyền', 'Share đối tác', 'Xóa đối tác', 'Thêm admin', 'Quản lý nhóm tài sản', 'Thêm dòng 2 BM']
    await expect(group.locator('.ads-function-row-label')).toHaveText(expected)
    await expect(group.locator('.ads-function-row')).toHaveCount(6)

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    library = await openFunctionLibrary(page, false, 'TKQC')
    await expect(library.locator('.ads-function-group.is-super-share .ads-function-row-label')).toHaveText(expected)
  })

  test('reorder preserves selected state, pin state, and Guide — none of it is tied to catalog position', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const group = library.locator('.ads-function-group.is-super-share')

    await group.getByRole('button', { name: 'Xóa đối tác', exact: true }).click() // select
    await group.getByRole('button', { name: 'Ghim Thêm admin', exact: true }).click() // pin

    const handle = group.locator('.ads-function-row').nth(0).locator('.ads-function-row-handle') // "Share đối tác"
    await reorderByKeyboard(page, handle, 'ArrowDown', 4) // moves to the end, past the selected/pinned rows

    await expect(group.getByRole('button', { name: 'Xóa đối tác', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(group.getByRole('button', { name: 'Bỏ ghim Thêm admin', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')

    await group.locator('.ads-function-row', { hasText: 'Thêm admin' }).getByRole('button', { name: 'Xem cách sử dụng' }).click()
    const dialog = page.getByRole('dialog', { name: 'Hướng dẫn sử dụng' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('Thêm admin', { exact: true })).toBeVisible()
  })

  test('cross-group: reordering never moves a function into a different group (no group-membership drag exists in production)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const superShare = library.locator('.ads-function-group.is-super-share')
    const assetMgmt = library.locator('.ads-function-group.is-ads-check-pro')
    await expect(assetMgmt.locator('.ads-function-row')).toHaveCount(2)

    // Push the last Super Share row down repeatedly — far more than needed
    // to reach the group's own end — and confirm it never crosses into the
    // adjacent "Asset Management" group above it.
    const lastHandle = superShare.locator('.ads-function-row').last().locator('.ads-function-row-handle')
    await reorderByKeyboard(page, lastHandle, 'ArrowDown', 10)
    await expect(superShare.locator('.ads-function-row')).toHaveCount(6)
    await expect(assetMgmt.locator('.ads-function-row')).toHaveCount(2)
    await expect(assetMgmt.locator('.ads-function-row-label')).toHaveText(['Mở / Đóng TK', 'Giới hạn chi tiêu'])
  })

  test('group order itself is fixed — no drag handle on group headers, canonical order survives reload', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, false, 'TKQC')
    const canonicalOrder = ['Asset Management', 'Super Share', 'Xóa QTV ẩn', 'Đổi Info', 'Payment & Billing', 'Trình quản lý quảng cáo', 'Kháng TKQC']
    await expect(library.locator('.ads-function-group-heading strong')).toHaveText(canonicalOrder)
    await expect(library.locator('.ads-function-group-heading .ads-function-row-handle')).toHaveCount(0)

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    library = await openFunctionLibrary(page, false, 'TKQC')
    await expect(library.locator('.ads-function-group-heading strong')).toHaveText(canonicalOrder)
  })

  test('group collapse is a single global key — collapsing on TKQC also collapses the same group on BM; reload restores across both', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, false, 'TKQC')
    await library.getByRole('button', { name: /^Asset Management/ }).click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeHidden()

    await page.getByRole('tab', { name: /^BM/ }).click()
    await expect(library.locator('.ads-function-group.is-ads-check-pro .ads-function-group-heading')).toHaveAttribute('aria-expanded', 'false')
    await expect(library.getByRole('button', { name: 'Tạo BM mới', exact: true })).toBeHidden()

    await page.evaluate(() => localStorage.getItem('adaccounts.tool-group-collapsed.v1')).then((value) =>
      expect(value).toBe(JSON.stringify(['ads-check-pro'])))

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    library = await openFunctionLibrary(page, false, 'BM')
    await expect(library.getByRole('button', { name: 'Tạo BM mới', exact: true })).toBeHidden()
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toBeHidden()
  })

  test('search temporarily reveals a collapsed group without touching its persisted collapse; pin filter never auto-opens it', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const superShare = library.locator('.ads-function-group.is-super-share')
    await superShare.getByRole('button', { name: 'Ghim Thêm admin', exact: true }).click()
    await library.getByRole('button', { name: /^Super Share/ }).click()
    await expect(superShare.locator('.ads-function-group-heading')).toHaveAttribute('aria-expanded', 'false')

    // Search temporarily shows it.
    await library.getByRole('textbox', { name: 'Tìm chức năng' }).fill('Thêm admin')
    await expect(superShare.locator('.ads-function-group-heading')).toHaveAttribute('aria-expanded', 'true')
    await expect(superShare.getByRole('button', { name: 'Thêm admin', exact: true })).toBeVisible()

    // Clearing it returns to collapsed — the manual state was never touched.
    await library.getByRole('button', { name: 'Xóa tìm kiếm' }).click()
    await expect(superShare.locator('.ads-function-group-heading')).toHaveAttribute('aria-expanded', 'false')

    // Pin filter does NOT auto-open it, even though the pinned function is inside.
    await library.locator('.ads-function-pin-filter').click()
    await expect(superShare.locator('.ads-function-group-heading')).toHaveAttribute('aria-expanded', 'false')
    await expect(superShare.getByRole('button', { name: 'Thêm admin', exact: true })).toBeHidden()

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const libraryAfter = await openFunctionLibrary(page, false, 'TKQC')
    await expect(libraryAfter.locator('.ads-function-group.is-super-share .ads-function-group-heading')).toHaveAttribute('aria-expanded', 'false')
  })

  test('order persistence is isolated per asset tab using the exact production storage keys — TKQC/BM/Page/Pixel reorders never leak', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const tkqcHandle = library.locator('.ads-function-group.is-super-share .ads-function-row').nth(2).locator('.ads-function-row-handle')
    await reorderByKeyboard(page, tkqcHandle, 'ArrowUp', 2)
    await expect(library.locator('.ads-function-group.is-super-share .ads-function-row-label')).toHaveText(
      ['Thêm admin', 'Share đối tác', 'Xóa đối tác', 'Chỉ định quyền', 'Quản lý nhóm tài sản', 'Thêm dòng 2 BM'])

    await page.getByRole('tab', { name: /^BM/ }).click()
    // BM's own Super Share group must still be in its untouched catalog order.
    const bmSuperShare = library.locator('.ads-function-group.is-super-share')
    const bmOrderBefore = await bmSuperShare.locator('.ads-function-row-label').allTextContents()
    expect(bmOrderBefore[0]).not.toBe('Thêm admin')

    const tkqcKey = await page.evaluate(() => localStorage.getItem('adaccounts.tool-ui-group-order.v2'))
    const bmKey = await page.evaluate(() => localStorage.getItem('adaccounts.bm-tool-ui-group-order.v1'))
    expect(JSON.parse(tkqcKey ?? '{}')['super-share']?.[0]).toBe('add-user')
    expect(bmKey === null || JSON.parse(bmKey)['super-share']?.[0] !== 'add-user').toBe(true)

    await page.getByRole('tab', { name: /^Page/ }).click()
    const pageKeyBefore = await page.evaluate(() => localStorage.getItem('adaccounts.page-tool-ui-group-order.v1'))
    expect(pageKeyBefore).toBeNull()
    await page.getByRole('tab', { name: /^Pixel/ }).click()
    const pixelKeyBefore = await page.evaluate(() => localStorage.getItem('adaccounts.pixel-tool-ui-group-order.v1'))
    expect(pixelKeyBefore).toBeNull()
  })

  test('Single mode: reordering the catalog never changes which function is currently selected', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    await library.locator('.ads-function-workflow-mode-trigger').click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()

    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')

    const group = library.locator('.ads-function-group.is-super-share')
    const handle = group.locator('.ads-function-row').first().locator('.ads-function-row-handle')
    await reorderByKeyboard(page, handle, 'ArrowDown', 2)

    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('1 bước')
  })

  test('Workflow mode: the step order in Quy trình reflects add order, not the catalog\'s current visual (post-reorder) order', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const group = library.locator('.ads-function-group.is-super-share')

    await group.getByRole('button', { name: 'Share đối tác', exact: true }).click() // step 1
    await group.getByRole('button', { name: 'Xóa đối tác', exact: true }).click() // step 2

    // Move "Xóa đối tác" ahead of "Share đối tác" in the catalog visually.
    const handle = group.locator('.ads-function-row').nth(1).locator('.ads-function-row-handle')
    await reorderByKeyboard(page, handle, 'ArrowUp', 1)
    await expect(group.locator('.ads-function-row-label').first()).toHaveText('Xóa đối tác')

    const steps = page.getByRole('list', { name: 'Các bước trong quy trình' }).getByRole('listitem')
    await expect(steps.nth(0)).toContainText('Share đối tác')
    await expect(steps.nth(1)).toContainText('Xóa đối tác')
  })

  test('malformed/unknown/hidden ids in stored order fall back safely — no crash, no ghost row, real functions still ordered', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.evaluate(() => localStorage.setItem('adaccounts.tool-ui-group-order.v2', '"not an object"'))
    await page.evaluate(() => localStorage.setItem(
      'adaccounts.bm-tool-ui-group-order.v1',
      JSON.stringify({ 'super-share': ['no-such-function-id', 'add-card', 'manage-bm-admins', 'share-bm-users'] }),
    ))
    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)

    // TKQC: malformed (a JSON string, not an object) falls back to canonical order, no crash.
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, false, 'TKQC')
    await expect(library.locator('.ads-function-group.is-super-share .ads-function-row-label')).toHaveText(superShareOrder)

    // BM: "no-such-function-id" (unknown) and "add-card" (a different asset's
    // hidden id — never even a BM function) are both silently dropped; the
    // 2 real, valid ids ("manage-bm-admins", "share-bm-users") reorder
    // correctly, and no blank/ghost row appears (still exactly the group's
    // real function count).
    await page.getByRole('tab', { name: /^BM/ }).click()
    library = await openFunctionLibrary(page, false, 'BM')
    const bmSuperShare = library.locator('.ads-function-group.is-super-share')
    const bmLabels = await bmSuperShare.locator('.ads-function-row-label').allTextContents()
    expect(bmLabels[0]).toBe('Quản lý quyền QTV') // manage-bm-admins
    expect(bmLabels[1]).toBe('Share quyền QTV/NV') // share-bm-users
    expect(bmLabels).not.toContain('')

    expect(consoleErrors).toEqual([])
  })

  test('no console errors across a full reorder + pin + collapse + reload cycle', async ({ page }) => {
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    const group = library.locator('.ads-function-group.is-super-share')
    await group.getByRole('button', { name: 'Ghim Thêm admin', exact: true }).click()
    await group.getByRole('button', { name: 'Share đối tác', exact: true }).click()
    const handle = group.locator('.ads-function-row').nth(2).locator('.ads-function-row-handle')
    await reorderByKeyboard(page, handle, 'ArrowUp', 2)
    await library.getByRole('button', { name: /^Payment & Billing/ }).click()

    await page.reload()
    await dismissDeviceLogin(page)
    await openAssetWorkspace(page)

    expect(consoleErrors).toEqual([])
  })
})

test.describe('Function Store: Round 4 mobile audit', () => {
  test('mobile: opening the panel, adding, pinning and collapsing all still work; the drag handle does not break row keyboard selection', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'mobile-only audit')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    const row = library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })
    await expect(row).toBeVisible()
    await expect(row.locator('.ads-function-row-handle')).toBeVisible()

    await row.focus()
    await page.keyboard.press('Enter')
    // Mobile drawer auto-closes Function Store on add (pre-existing,
    // approved behavior — see Round 2/3 notes) — check the Workflow list
    // instead of the now-hidden row's own aria-pressed.
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
  })
})

test.describe('Workflow Panel: step cards, config, runner, Start readiness (Round 5)', () => {
  test('empty state shows the exact production text (no asset-name interpolation)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
    else await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
    await expect(page.getByRole('heading', { name: /Quy trình/ })).toContainText('0 bước')
  })

  test('adding a step auto-expands only that step; adding a second collapses the first and expands the new one', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs 2 sequential adds; unpinned mobile drawer closes Function Store after the first (Round 2/3 behavior)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Thu gọn bước 1' })).toBeVisible()

    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    // The just-added step (now #2) is expanded; step #1 auto-collapsed.
    await expect(page.getByRole('button', { name: 'Mở bước 1' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Thu gọn bước 2' })).toBeVisible()
  })

  test('manual expand/collapse toggles independently — expanding one does not collapse another', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs 2 sequential adds; unpinned mobile drawer closes Function Store after the first (Round 2/3 behavior)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    // Step 2 is auto-expanded, step 1 auto-collapsed (previous test's finding).
    await page.getByRole('button', { name: 'Mở bước 1' }).click()
    await expect(page.getByRole('button', { name: 'Thu gọn bước 1' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Thu gọn bước 2' })).toBeVisible()
  })

  test('function with no modeled config shows the plain note; no required-field gate applies', async ({ page, isMobile }) => {
    test.skip(isMobile, 'mobile Workflow drawer opens full-screen above the asset table after add, blocking the account checkbox underneath (pre-existing mobile stacking, unchanged)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByText('Chức năng này không cần cấu hình thêm.')).toBeVisible()
    await page.getByRole('checkbox', { name: /Chọn TKQC Demo 01/ }).check()
    await expect(page.getByRole('button', { name: 'Bắt đầu quy trình' })).toBeEnabled()
  })

  test('required text field ("Đổi tên TKQC") blocks Start until filled; select + required textarea ("Quản lý nhóm tài sản") likewise', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs 2 sequential adds; unpinned mobile drawer closes Function Store after the first (Round 2/3 behavior)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await page.getByRole('checkbox', { name: /Chọn TKQC Demo 01/ }).check()

    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    const startButton = page.getByRole('button', { name: 'Bắt đầu quy trình' })
    await expect(startButton).toBeDisabled()
    await expect(startButton).toHaveAttribute('title', 'Vui lòng điền đầy đủ thông tin bắt buộc trước khi chạy')
    await page.getByLabel('Tên mới').fill('Ten Moi Demo')
    await expect(startButton).toBeEnabled()

    await library.getByRole('button', { name: 'Quản lý nhóm tài sản', exact: true }).click()
    await expect(startButton).toBeDisabled()
    // Chromium's accessible name for a labelled <select> also folds in its
    // option text (Playwright then reports a long combined name), so a
    // plain getByLabel match is unreliable here — target by id instead.
    await page.locator('#ads-workflow-step-field-mode').selectOption('create')
    await expect(startButton).toBeDisabled()
    await page.getByLabel('Danh sách tên nhóm tài sản').fill('Nhom A')
    await expect(startButton).toBeEnabled()
  })

  test('removing a step from its own card unselects the matching Function Store row', async ({ page, isMobile }) => {
    test.skip(isMobile, 'unpinned mobile drawer closes Function Store immediately after add (Round 2/3 behavior) — nothing left open to re-check aria-pressed on')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toHaveAttribute('aria-pressed', 'true')

    await page.getByRole('button', { name: 'Xoá bước 1: Mở / Đóng TK' }).click()
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toHaveAttribute('aria-pressed', 'false')
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
  })

  test('Luồng/Delay(ms): defaults, clamping, and global state shared across asset tabs', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
    else await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    const threads = page.getByRole('spinbutton', { name: 'Luồng' })
    const delay = page.getByRole('spinbutton', { name: 'Delay(ms)' })
    await expect(threads).toHaveValue('1')
    await expect(delay).toHaveValue('0')

    await threads.fill('99')
    await threads.blur()
    await expect(threads).toHaveValue('20')
    await threads.fill('0')
    await threads.blur()
    await expect(threads).toHaveValue('1')
    await page.getByRole('button', { name: 'Tăng số luồng' }).click()
    await expect(threads).toHaveValue('2')

    await delay.fill('-5')
    await delay.blur()
    await expect(delay).toHaveValue('0')
    await page.getByRole('button', { name: 'Tăng delay' }).click()
    await expect(delay).toHaveValue('50')

    // Global — switching assets keeps the same values (traced: ij.L() is a
    // module-level singleton, not per-asset, unlike Function Store's own
    // pin/order systems).
    await page.getByRole('tab', { name: /^BM/ }).click()
    await expect(page.getByRole('spinbutton', { name: 'Luồng' })).toHaveValue('2')
    await expect(page.getByRole('spinbutton', { name: 'Delay(ms)' })).toHaveValue('50')
  })

  test('asset switch isolates workflow steps/config but NOT Luồng/Delay/Workflow Mode (global) — no leakage either way', async ({ page, isMobile }) => {
    test.skip(isMobile, 'reopening Function Store for BM is blocked by the still-open full-screen Workflow drawer from the TKQC add (pre-existing mobile stacking, unchanged)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    let library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByLabel('Tên mới').fill('TKQC Value')

    await page.getByRole('tab', { name: /^BM/ }).click()
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()
    library = await openFunctionLibrary(page, isMobile, 'BM')
    await library.getByRole('button', { name: 'Tạo BM mới', exact: true }).click()

    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Đổi tên TKQC')
    await expect(page.getByLabel('Tên mới')).toHaveValue('TKQC Value')
  })

  test('Single mode: remove aria-label reads "Xoá chức năng", not "Xoá bước N" (only ever one step)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.locator('.ads-function-workflow-mode-trigger').click()
    const dialog = page.getByRole('dialog', { name: 'Chế độ thao tác' })
    await dialog.getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await dialog.getByRole('button', { name: 'Lưu thay đổi' }).click()

    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Xoá chức năng: Mở / Đóng TK' })).toBeVisible()
    await expect(page.getByRole('button', { name: /^Xoá bước 1:/ })).toHaveCount(0)
  })

  test('Template: Save is disabled with an empty workflow; the panel lists "Chưa có template" until one is saved (Batch Update Part A)', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
    else await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await expect(page.getByRole('button', { name: 'Lưu Template' })).toBeDisabled()
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await expect(page.getByText('Chưa có template')).toBeVisible()
    await page.getByRole('button', { name: 'Đóng Template' }).click()
    await expect(page.getByText('Chưa có template')).toHaveCount(0)
  })

  test('Start button disabled reasons are the exact traced strings, surfaced as its title', async ({ page, isMobile }) => {
    test.skip(isMobile, 'the full-screen Workflow drawer opened first covers the Function Store row underneath (pre-existing mobile stacking, unchanged)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    if (isMobile) await page.getByRole('button', { name: 'Mở quy trình' }).click()
    else await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    const library = page.locator('#ads-pro-function-library')
    const startButton = page.getByRole('button', { name: 'Bắt đầu quy trình' })
    await expect(startButton).toHaveAttribute('title', 'Vui lòng chọn ít nhất một chức năng trước khi chạy')

    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await expect(startButton).toHaveAttribute('title', 'Vui lòng chọn ít nhất 1 TKQC trước khi thao tác')

    await page.getByRole('checkbox', { name: /Chọn TKQC Demo 01/ }).check()
    await expect(startButton).toBeEnabled()
  })

  test('same-list step reorder via keyboard; step order (not catalog order) drives the Workflow list', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs 3 sequential adds; unpinned mobile drawer closes Function Store after each one (Round 2/3 behavior)')
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await library.getByRole('button', { name: 'Giới hạn chi tiêu', exact: true }).click()
    await library.getByRole('button', { name: 'Đổi thông tin TKQC', exact: true }).click()

    const steps = page.getByRole('list', { name: 'Các bước trong quy trình' }).getByRole('listitem')
    await expect(steps).toHaveCount(3)
    const handle = page.getByRole('button', { name: 'Kéo để sắp xếp bước 3' })
    await handle.focus()
    await page.keyboard.press('Space')
    await page.waitForTimeout(80)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(80)
    await page.keyboard.press('ArrowUp')
    await page.waitForTimeout(80)
    await page.keyboard.press('Space')
    await page.waitForTimeout(150)

    await expect(steps.nth(0)).toContainText('Đổi thông tin TKQC')
    await expect(steps.nth(1)).toContainText('Mở / Đóng TK')
    await expect(steps.nth(2)).toContainText('Giới hạn chi tiêu')
  })

  test('no console errors across a full add/config/expand/reorder/remove/mode-switch cycle', async ({ page, isMobile }) => {
    test.skip(isMobile, 'needs 2 sequential adds; unpinned mobile drawer closes Function Store after the first (Round 2/3 behavior)')
    const consoleErrors: string[] = []
    page.on('console', (msg) => { if (msg.type() === 'error') consoleErrors.push(msg.text()) })
    page.on('pageerror', (err) => consoleErrors.push(err.message))

    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByLabel('Tên mới').fill('Demo')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Mở bước 1' }).click()
    const handle = page.getByRole('button', { name: 'Kéo để sắp xếp bước 1' })
    await handle.focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Space')
    await library.locator('.ads-function-workflow-mode-trigger').click()
    await page.getByRole('dialog', { name: 'Chế độ thao tác' }).getByRole('radio', { name: /Chạy 1 chức năng\/lượt/ }).click()
    await page.getByRole('dialog', { name: 'Chế độ thao tác' }).getByRole('button', { name: 'Lưu thay đổi' }).click()

    expect(consoleErrors).toEqual([])
  })
})

// ===========================================================================
// BATCH UPDATE — Template + Tag + Folder + TKQC/BM table (Part L)
// Desktop-only: every scenario here targets desktop-table interactions
// (column menus, sticky/frozen columns, multi-row tag pickers). Mobile
// keeps the same underlying data/logic — already exercised by the
// mobile-applicable tests above — but a bespoke mobile audit of these new
// desktop-table interactions is out of this batch's scope.
test.describe('Batch Update: Workflow Template save/list/load', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only workflow/table interactions')

  test('save captures name + steps; count increments; panel lists it immediately; reload persists it', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await expect(page.getByRole('textbox', { name: 'Nhập tên Template' })).toHaveValue('Template 1')
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Quy trình mở TK')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect(page.getByText('Template đã lưu (1)')).toBeVisible()
    await expect(page.getByRole('button', { name: /Quy trình mở TK 1 bước/ })).toBeVisible()

    await page.reload()
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await expect(page.getByText('Template đã lưu (1)')).toBeVisible()
    await expect(page.getByRole('button', { name: /Quy trình mở TK 1 bước/ })).toBeVisible()
  })

  test('load reconstructs step order, config values, threads/delay, and re-syncs Function Store selection', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByLabel('Tên mới').fill('Từ template')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('spinbutton', { name: 'Luồng' }).fill('5')
    await page.getByRole('spinbutton', { name: 'Delay(ms)' }).fill('250')
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()

    // Remove everything, reset the runner fields, then reload from the template.
    await page.getByRole('button', { name: /^Xoá bước 1:/ }).click()
    await page.getByRole('button', { name: /^Xoá bước 1:/ }).click().catch(() => {})
    await page.getByRole('spinbutton', { name: 'Luồng' }).fill('1')
    await page.getByRole('spinbutton', { name: 'Delay(ms)' }).fill('0')
    await expect(page.getByText('Chọn chức năng ở Panel 1 để thêm bước vào quy trình.')).toBeVisible()

    // Template panel is still open from the earlier save (Lưu Template ->
    // Lưu keeps it open in list mode) — no need to re-toggle it.
    await page.getByRole('button', { name: 'Template 1 2 bước' }).click()
    const stepList = page.getByRole('list', { name: 'Các bước trong quy trình' })
    await expect(stepList).toContainText('Đổi tên TKQC')
    await expect(stepList).toContainText('Mở / Đóng TK')
    await expect(page.getByRole('spinbutton', { name: 'Luồng' })).toHaveValue('5')
    await expect(page.getByRole('spinbutton', { name: 'Delay(ms)' })).toHaveValue('250')
    await page.getByRole('button', { name: 'Mở bước 1' }).click()
    await expect(page.getByLabel('Tên mới')).toHaveValue('Từ template')
    // Function Store selection reflects the reconstructed steps (workflows[asset] drives selectedStepIds).
    await expect(library.getByRole('button', { name: 'Đổi tên TKQC', exact: true })).toHaveAttribute('aria-pressed', 'true')
    await expect(library.getByRole('button', { name: 'Mở / Đóng TK', exact: true })).toHaveAttribute('aria-pressed', 'true')
  })

  test('deleting a template removes it from the list without touching the still-loaded workflow', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect(page.getByText('Template đã lưu (1)')).toBeVisible()
    await page.getByRole('button', { name: 'Xóa template Template 1' }).click()
    await page.getByRole('button', { name: 'Xác nhận xóa template Template 1' }).click()
    await expect(page.getByText('Chưa có template')).toBeVisible()
    await page.getByRole('button', { name: 'Đóng Template' }).click()
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Mở / Đóng TK')
  })
})

test.describe('Batch Update: Tag Manager (VIA + TKQC shared)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only column/table interactions')

  test('VIA "+" opens the picker at 0/0 with the exact empty state', async ({ page }) => {
    await openAssetWorkspace(page)
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    const picker = page.getByRole('dialog', { name: 'Chọn Tag' })
    await expect(picker).toBeVisible()
    await expect(picker).toContainText('Chọn Tag 0/0')
    await expect(picker.getByText('Không tìm thấy tag')).toBeVisible()
  })

  test('create flow: name + color palette, Hủy while empty, ✓ once named, appears in the list immediately', async ({ page }) => {
    await openAssetWorkspace(page)
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await page.getByRole('button', { name: 'Tạo mới' }).click()
    await expect(page.getByRole('dialog', { name: 'Thêm Tag mới' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Hủy', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Xác nhận tạo Tag' })).toHaveCount(0)
    await page.getByRole('textbox', { name: 'Nhập tên Tag' }).fill('Khách VIP')
    await expect(page.getByRole('button', { name: 'Xác nhận tạo Tag' })).toBeVisible()
    const swatches = page.getByRole('radio', { name: /^Màu #/ })
    await expect(swatches).toHaveCount(10)
    await swatches.nth(4).click()
    await expect(swatches.nth(4)).toHaveAttribute('aria-checked', 'true')
    await page.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toContainText('Chọn Tag 0/1')
    await expect(page.locator('.ads-tag-picker-item', { hasText: 'Khách VIP' })).toBeVisible()
  })

  test('assign toggles the row chip; removing the association keeps the tag in the global catalog', async ({ page }) => {
    await openAssetWorkspace(page)
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await page.getByRole('button', { name: 'Tạo mới' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Tag' }).fill('Ưu tiên')
    await page.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()
    await page.locator('.ads-tag-picker-item', { hasText: 'Ưu tiên' }).click()
    await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()
    await expect(row.locator('.ads-pro-tag-chip')).toContainText('Ưu tiên')

    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toContainText('Chọn Tag 1/1')
    await page.locator('.ads-tag-picker-item', { hasText: 'Ưu tiên' }).click()
    await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()
    await expect(row.locator('.ads-pro-tag-chip')).toHaveCount(0)
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toContainText('Chọn Tag 0/1')
    await expect(page.locator('.ads-tag-picker-item', { hasText: 'Ưu tiên' })).toBeVisible()
  })

  test('deleting the global tag removes it everywhere it was assigned (with confirm)', async ({ page }) => {
    await openAssetWorkspace(page)
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await page.getByRole('button', { name: 'Tạo mới' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Tag' }).fill('Xóa thử')
    await page.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()
    await page.locator('.ads-tag-picker-item', { hasText: 'Xóa thử' }).click()
    await page.getByRole('button', { name: 'Xóa Tag Xóa thử khỏi danh sách' }).click()
    await page.getByRole('button', { name: 'Xác nhận xóa Tag Xóa thử' }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toContainText('Chọn Tag 0/0')
    await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()
    await expect(row.locator('.ads-pro-tag-chip')).toHaveCount(0)
  })

  test('reorder via keyboard drag persists across reload; TKQC reuses the exact same global tag definitions', async ({ page }) => {
    await openAssetWorkspace(page)
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('button', { name: 'Gắn Tag' }).click()
    await page.getByRole('button', { name: 'Tạo mới' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Tag' }).fill('Tag A')
    await page.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()
    await page.getByRole('button', { name: 'Tạo mới' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Tag' }).fill('Tag B')
    await page.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()

    const list = page.locator('.ads-tag-picker-list')
    await expect(list.locator('.ads-tag-picker-item')).toHaveText(['Tag A', 'Tag B'])
    await page.getByRole('button', { name: 'Kéo để sắp xếp Tag Tag A' }).focus()
    await page.keyboard.press('Space')
    await page.keyboard.press('ArrowDown')
    await page.keyboard.press('Space')
    await expect(list.locator('.ads-tag-picker-item')).toHaveText(['Tag B', 'Tag A'])
    await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()

    await page.reload()
    const row2 = page.getByRole('row', { name: /VIA Demo 01/ })
    await row2.getByRole('button', { name: 'Gắn Tag' }).click()
    await expect(page.locator('.ads-tag-picker-list .ads-tag-picker-item')).toHaveText(['Tag B', 'Tag A'])
    await page.getByRole('button', { name: 'Đóng chọn Tag' }).click()

    await page.getByRole('tab', { name: /TKQC/ }).click()
    const tkqcRow = page.getByRole('row', { name: /TKQC Demo 01/ }).first()
    await tkqcRow.getByRole('button', { name: 'Gắn Tag' }).click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toContainText('Chọn Tag 0/2')
    await expect(page.locator('.ads-tag-picker-list .ads-tag-picker-item')).toHaveText(['Tag B', 'Tag A'])
  })
})

test.describe('Batch Update: Folder collapsed rail renders every folder', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only mini rail')

  test('collapsed shows all folders (not just active); switching folder while collapsed filters the table and stays collapsed; expand restores the full list; compact + exists', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Đóng thư mục' }).click()

    const rows = page.locator('.ads-pro-folders-mini-row')
    await expect(rows).toHaveCount(3)
    await expect(rows).toHaveText(['Tất cả', 'Nhóm mẫu A', 'Nhóm mẫu B'])
    await expect(page.locator('.ads-pro-folders-mini-row.ads-pro-folders-mini-active')).toHaveText('Tất cả')
    await expect(page.getByRole('button', { name: 'Thêm thư mục', exact: true })).toBeVisible()

    await rows.filter({ hasText: 'Nhóm mẫu A' }).click()
    await expect(page.locator('.ads-pro-folders-mini-row.ads-pro-folders-mini-active')).toHaveText('Nhóm mẫu A')
    const folder = page.locator('#ads-pro-folders')
    await expect(folder).toHaveClass(/is-collapsed/)
    // Footer's own total stays the asset-wide count (matches every other
    // asset's convention — it is not folder-scoped); folder filtering is
    // instead verified via the actually-rendered row count.
    await expect(page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr')).toHaveCount(20)

    await page.getByRole('button', { name: 'Mở rộng thư mục' }).click()
    await expect(folder.getByRole('button', { name: 'Tất cả' })).toBeVisible()
    await expect(folder.getByRole('button', { name: 'Nhóm mẫu A' })).toHaveAttribute('aria-pressed', 'true')
  })
})

test.describe('Batch Update: TKQC column schema, spend limit, HOLD/NEED, unauthorized section', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('exact column order 3-31 (spot check) and horizontal scroll reaches the Tag column', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const headers = page.locator('.ads-pro-table.is-tkqc-full thead th')
    await expect(headers.nth(2)).toContainText('Trạng thái')
    await expect(headers.nth(3)).toContainText('Tài khoản')
    await expect(headers.nth(4)).toContainText('ID TKQC')
    await expect(headers.last()).toContainText('Tag')
    await page.locator('.ads-pro-table-scroll').evaluate((el) => { el.scrollLeft = el.scrollWidth })
    await expect(page.getByRole('row', { name: /TKQC Demo 01/ }).first().locator('.ads-pro-tag-add')).toBeInViewport()
  })

  test('spend-limit cell opens "Đặt giới hạn chi tiêu" modal and change-limit updates the cell locally', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 02/ }).first()
    await row.getByRole('button', { name: /Đặt giới hạn chi tiêu/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Đặt giới hạn chi tiêu' })
    await expect(dialog).toBeVisible()
    await dialog.getByRole('textbox', { name: 'Mức giới hạn mới' }).fill('123456')
    await dialog.getByRole('button', { name: 'Đổi giới hạn', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(row).toContainText('123,456 USD')
  })

  test('HOLD/NEED eye check resolves to OK for a row with no traced non-OK condition', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 01/ }).first()
    const checkButton = row.getByRole('button', { name: /Kiểm tra HOLD\/NEED/ })
    await expect(checkButton).toHaveAttribute('title', 'Kiểm tra trạng thái hold của tài khoản này')
    await checkButton.click()
    await expect(row.getByText('Đang kiểm tra…')).toBeVisible()
    await expect(row.getByText('OK')).toBeVisible({ timeout: 2000 })
  })

  test('unauthorized section: exact tooltip, expand/collapse, same column grid, never removed from the dataset', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const summary = page.locator('.ads-pro-restricted-summary')
    await expect(summary).toContainText('Tài khoản quảng cáo không có quyền')
    await expect(page.locator('.ads-pro-restricted-badge')).toHaveText('8')
    await expect(page.locator('.ads-pro-restricted-help')).toHaveAttribute('title', 'TKQC bạn nhìn thấy nhưng chưa có quyền quản lý. Bấm để tải danh sách.')
    const restrictedTable = page.locator('table.is-restricted')
    await expect(restrictedTable).toBeVisible()
    const restrictedHeadCount = await page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) thead th').count()
    const restrictedColCount = await restrictedTable.locator('colgroup col').count()
    expect(restrictedColCount).toBe(restrictedHeadCount)

    // Round 1 Part 1 — the toggle is the single right-side "Xem"/"Ẩn" pill
    // (production i18n: same control, label swaps), not the left summary.
    const toggle = page.locator('.ads-pro-restricted-view')
    await expect(toggle).toHaveText('Ẩn')
    await toggle.click()
    await expect(restrictedTable).toBeHidden()
    await expect(toggle).toHaveText('Xem')
    await toggle.click()
    await expect(restrictedTable).toBeVisible()
  })
})

test.describe('Batch Update: shared column-header menu (TKQC + BM)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('menu opens with the exact traced order and reuses the same component on BM', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    const menu = page.getByRole('menu', { name: 'Menu cột Số dư' })
    const items = menu.getByRole('menuitem')
    await expect(items).toHaveCount(6)
    await expect(items.nth(0)).toContainText('Lọc nâng cao')
    await expect(items.nth(1)).toContainText('Bỏ lọc')
    await expect(items.nth(2)).toContainText('Đóng băng cột')
    await expect(items.nth(3)).toContainText('Thấp đến cao')
    await expect(items.nth(4)).toContainText('Cao đến thấp')
    await expect(items.nth(5)).toContainText('Sắp xếp mặc định')
    await page.keyboard.press('Escape')

    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: 'Menu cột Nút kháng' }).click()
    await expect(page.getByRole('menu', { name: 'Menu cột Nút kháng' })).toBeVisible()
  })

  test('ascending / descending / default sort; filter then clear filter; freeze toggles the header/cell class', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const firstRowName = () => page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first().locator('td').nth(3).innerText()

    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: /Thấp đến cao/ }).click()
    const ascFirst = await page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first().locator('td').nth(5).innerText()

    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: /Cao đến thấp/ }).click()
    const descFirst = await page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first().locator('td').nth(5).innerText()
    expect(ascFirst).not.toBe(descFirst)

    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await expect(page.getByRole('menuitem', { name: /Sắp xếp mặc định/ })).toBeEnabled()
    await page.getByRole('menuitem', { name: /Sắp xếp mặc định/ }).click()
    await expect(await firstRowName()).toContain('TKQC Demo 01')

    // Filter → clear filter, on a string column.
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await expect(page.getByRole('menuitem', { name: 'Bỏ lọc' })).toBeDisabled()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    await page.getByRole('textbox', { name: 'Giá trị điều kiện' }).fill('TKQC Demo 02')
    await page.getByRole('button', { name: 'Áp dụng' }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr')).toHaveCount(1)
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await expect(page.getByRole('menuitem', { name: 'Bỏ lọc' })).toBeEnabled()
    await page.getByRole('menuitem', { name: 'Bỏ lọc' }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first()).not.toHaveCount(0)

    // Freeze / unfreeze. STT itself ships frozen by default (Correction
    // Batch 3 Part C5), so the baseline is 1, not 0.
    const frozenHeaders = page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')
    await expect(frozenHeaders).toHaveCount(1)
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await expect(frozenHeaders).toHaveCount(2)
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Bỏ đóng băng cột' }).click()
    await expect(frozenHeaders).toHaveCount(1)
  })
})

test.describe('Batch Update: footer aggregation (dataset rule, MIXED currency)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('totals include authorized + unauthorized; collapsing unauthorized does not change them; pagination does not change them', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const totals = page.locator('.ads-tkqc-footer-summary-track')
    const before = await totals.innerText()
    await page.locator('.ads-pro-restricted-view').click()
    await expect(await totals.innerText()).toBe(before)
    await page.getByRole('button', { name: 'Trang sau' }).click()
    await expect(await totals.innerText()).toBe(before)
  })

  test('same-currency numeric columns sum; mixed-currency columns show MIXED; empty aggregatable shows -', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const totals = page.locator('.ads-tkqc-footer-summary-track')
    // "Số dư" is the 3rd aggregatable span (checkbox, STT, status, name, id, balance = index 5).
    await expect(totals.locator('span').nth(5)).toHaveText('MIXED')
    await page.getByRole('button', { name: 'Menu cột Tiền tệ' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    await page.getByRole('textbox', { name: 'Giá trị điều kiện' }).fill('USD')
    await page.getByRole('button', { name: 'Áp dụng' }).click()
    await expect(totals.locator('span').nth(5)).not.toHaveText('MIXED')
    await expect(totals.locator('span').nth(5)).not.toHaveText('-')
  })
})

test.describe('Batch Update: BM new columns', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('new column sequence appears after Tiến trình; Verified/Hoạt động are distinct from Trạng thái; note editable; SL Admin/Ad Account are structured strings', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const headers = page.locator('.ads-pro-table.is-bm-full thead th')
    const headerTexts = await headers.allInnerTexts()
    const progressIndex = headerTexts.findIndex((text) => text.includes('Tiến trình'))
    expect(headerTexts[progressIndex + 1]).toContain('Quyền')
    expect(headerTexts[progressIndex + 2]).toContain('Ngày tạo')
    expect(headerTexts[progressIndex + 3]).toContain('Verified')
    // BM Round 1 Part 22: order corrected against the user's own production
    // Column Settings screenshot — Level BM precedes Loại BM.
    expect(headerTexts[progressIndex + 4]).toContain('Level BM')
    expect(headerTexts[progressIndex + 5]).toContain('Loại BM')
    expect(headerTexts[progressIndex + 6]).toContain('Hoạt động')
    expect(headerTexts[progressIndex + 7]).toContain('SL đối tác')
    expect(headerTexts[progressIndex + 8]).toContain('Ghi chú')
    expect(headerTexts[progressIndex + 9]).toContain('SL Admin')
    expect(headerTexts[progressIndex + 10]).toContain('SL Ad Account')

    const row = page.getByRole('row', { name: /BM Demo 06/ }).first()
    await expect(row).toContainText('Die')
    await expect(row.locator('.ads-bm-verified')).toBeVisible()
    await row.getByRole('button', { name: /Sửa ghi chú/ }).click()
    await page.getByLabel('Nội dung ghi chú').fill('Ghi chú demo BM')
    await page.getByRole('button', { name: 'Lưu ghi chú' }).click()
    await expect(row).toContainText('Ghi chú demo BM')
    // SL Admin/SL Ad Account are DERIVED from each resource array (Part W) —
    // rendered as a clickable pill / structured summary string, not a flat
    // stored count.
    await expect(row.locator('.ads-resource-count-pill', { hasText: /^Admin \d+$/ })).toBeVisible()
    await expect(row).toContainText(/Tổng: \d+ - Owned: \d+ - Share: \d+/)
  })
})

test.describe('Batch Update: demo data density (Part I)', () => {
  test('TKQC/BM/Page/Pixel each have the expected row count and support pagination', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.getByText('Đã chọn 0 / 60 TKQC', { exact: true })).toBeVisible()
    await expect(page.getByText('1/3', { exact: true })).toBeVisible()

    await page.getByRole('tab', { name: /^BM/ }).click()
    await expect(page.getByText('Đã chọn 0 / 40 business', { exact: true })).toBeVisible()
    await expect(page.getByText('1/2', { exact: true })).toBeVisible()

    if (!isMobile) {
      await page.getByRole('tab', { name: /^Page/ }).click()
      await expect(page.getByText('Đã chọn 0 / 45 Page', { exact: true })).toBeVisible()
      await expect(page.getByText('1/2', { exact: true })).toBeVisible()

      await page.getByRole('tab', { name: /^Pixel/ }).click()
      await expect(page.getByText('Đã chọn 0 / 30 Pixel', { exact: true })).toBeVisible()
      await expect(page.getByText('1/2', { exact: true })).toBeVisible()
    }
  })
})

test.describe('Correction Batch 2: Advanced Filter Builder', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('centered modal, match-mode ANY unions results, match-mode ALL intersects them', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog).toBeVisible()
    await expect(page.locator('.ads-advanced-filter-backdrop')).toBeVisible()

    await dialog.getByRole('textbox', { name: 'Giá trị điều kiện' }).fill('TKQC Demo 01')
    await dialog.getByRole('button', { name: 'Thêm điều kiện' }).click()
    const secondValue = dialog.getByRole('textbox', { name: 'Giá trị điều kiện' }).nth(1)
    await secondValue.fill('TKQC Demo 02')
    await dialog.getByRole('button', { name: 'Áp dụng' }).click()
    // ANY (default match mode) — union of the two conditions.
    await expect(page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr')).toHaveCount(2)

    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    await dialog.getByRole('combobox', { name: 'Điều kiện khớp' }).selectOption('all')
    await dialog.getByRole('button', { name: 'Áp dụng' }).click()
    // ALL — no single row's name contains both demo-01 and demo-02, so the
    // result set is empty (the empty-state placeholder row itself still
    // counts as one <tr>, hence asserting on its text, not row count).
    await expect(page.getByText('Không có dữ liệu')).toBeVisible()
  })

  test('numeric "Trong khoảng" operator adds a 2nd value input and filters by min/max', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    const dialog = page.getByRole('dialog')
    await dialog.getByRole('combobox', { name: 'Toán tử' }).selectOption('Trong khoảng')
    await expect(dialog.getByRole('spinbutton', { name: 'Giá trị nhỏ nhất' })).toBeVisible()
    await expect(dialog.getByRole('spinbutton', { name: 'Giá trị lớn nhất' })).toBeVisible()
    await dialog.getByRole('spinbutton', { name: 'Giá trị nhỏ nhất' }).fill('0')
    await dialog.getByRole('spinbutton', { name: 'Giá trị lớn nhất' }).fill('0')
    await dialog.getByRole('button', { name: 'Áp dụng' }).click()
    const rows = page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr')
    const count = await rows.count()
    expect(count).toBeGreaterThan(0)
    for (let i = 0; i < count; i++) await expect(rows.nth(i).locator('td').nth(5)).toHaveText('0')
  })

  test('"+ Thêm điều kiện" adds a row; trash is disabled while only one condition remains; reopening restores the saved conditions', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    const dialog = page.getByRole('dialog')
    await expect(dialog.getByRole('button', { name: 'Xóa điều kiện' })).toBeDisabled()
    await dialog.getByRole('textbox', { name: 'Giá trị điều kiện' }).fill('TKQC Demo 03')
    await dialog.getByRole('button', { name: 'Thêm điều kiện' }).click()
    await expect(dialog.getByRole('button', { name: 'Xóa điều kiện' }).first()).toBeEnabled()
    await dialog.getByRole('button', { name: 'Áp dụng' }).click()

    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    await expect(dialog.getByRole('textbox', { name: 'Giá trị điều kiện' }).first()).toHaveValue('TKQC Demo 03')
    await dialog.getByRole('button', { name: 'Hủy' }).click()
  })
})

test.describe('Correction Batch 2: Column Drag Reorder', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only drag interaction')

  test('checkbox/Hành động/STT have no drag handle (structurally excluded — BM Round 1 Shared Rule #3 locks STT too); other data columns do', async ({ page }) => {
    await openAssetWorkspace(page)
    const headers = page.locator('.ads-pro-table.is-via thead th')
    await expect(headers.nth(0).locator('.ads-column-drag-handle')).toHaveCount(0)
    await expect(headers.nth(1)).toContainText('STT')
    await expect(headers.nth(1).locator('.ads-column-drag-handle')).toHaveCount(0)
    await expect(headers.nth(1).locator('.ads-column-locked-handle')).toHaveCount(1)
    await expect(headers.last()).toHaveText('Hành động')
    await expect(headers.last().locator('.ads-column-drag-handle')).toHaveCount(0)
    await expect(headers.nth(2).locator('.ads-column-drag-handle')).toHaveCount(1)
  })

  test('dragging a TKQC header reorders header AND body cells together, and persists across reload via config_column', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const headerRow = page.locator('.ads-pro-table.is-tkqc-full thead tr')
    await expect(headerRow.locator('th').nth(2)).toContainText('Trạng thái')
    await expect(headerRow.locator('th').nth(3)).toContainText('Tài khoản')

    const source = headerRow.locator('th').nth(3) // "Tài khoản"
    const target = headerRow.locator('th').nth(2) // "Trạng thái"
    const sourceBox = await source.boundingBox()
    const targetBox = await target.boundingBox()
    if (!sourceBox || !targetBox) throw new Error('missing bounding box')
    await page.mouse.move(sourceBox.x + 10, sourceBox.y + sourceBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(targetBox.x + 10, targetBox.y + targetBox.height / 2, { steps: 5 })
    await page.mouse.up()

    await expect(headerRow.locator('th').nth(2)).toContainText('Tài khoản')
    await expect(headerRow.locator('th').nth(3)).toContainText('Trạng thái')
    const firstBodyRow = page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first()
    await expect(firstBodyRow.locator('td').nth(2)).toContainText('TKQC Demo 01')

    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead tr th').nth(2)).toContainText('Tài khoản')
  })
})

test.describe('Correction Batch 2: TKQC Spend Limit modal — Reset/Delete actions', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('Reset giới hạn zeroes spent-against-limit but keeps the limit; Xóa giới hạn clears the limit entirely', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 03/ }).first()
    await row.getByRole('button', { name: /Đặt giới hạn chi tiêu/ }).click()
    let dialog = page.getByRole('dialog', { name: 'Đặt giới hạn chi tiêu' })
    await dialog.getByRole('radio', { name: 'Reset giới hạn' }).click()
    await expect(dialog.getByText('Nếu mức mới nhỏ hơn số đã chi tiêu, TKQC sẽ ngừng phân phối quảng cáo.')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Reset giới hạn', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(row).toContainText('0%')

    await row.getByRole('button', { name: /Đặt giới hạn chi tiêu/ }).click()
    dialog = page.getByRole('dialog', { name: 'Đặt giới hạn chi tiêu' })
    await dialog.getByRole('radio', { name: 'Xóa giới hạn' }).click()
    await dialog.getByRole('button', { name: 'Xóa giới hạn', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(row.getByRole('button', { name: /Đặt giới hạn chi tiêu/ })).toContainText('/ -')
  })

  test('exact traced warning text appears only for the change-limit action', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 04/ }).first()
    await row.getByRole('button', { name: /Đặt giới hạn chi tiêu/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Đặt giới hạn chi tiêu' })
    await expect(dialog.getByText('Nếu mức mới nhỏ hơn số đã chi tiêu, TKQC sẽ ngừng phân phối quảng cáo.')).toBeVisible()
    await dialog.getByRole('button', { name: 'Hủy' }).click()
  })
})

test.describe('Correction Batch 2: Tiến trình is execution-linked, never random on mount', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('idle by default for TKQC/BM; ramps only the selected rows on Bắt đầu quy trình, then returns to idle', async ({ page, isMobile }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const selectedRow = page.getByRole('row', { name: /TKQC Demo 01/ }).first()
    const otherRow = page.getByRole('row', { name: /TKQC Demo 02/ }).first()
    await expect(selectedRow.locator('td').nth(8)).toHaveText('-')
    await expect(otherRow.locator('td').nth(8)).toHaveText('-')

    await selectedRow.locator('td').first().locator('input[type="checkbox"]').check()
    const library = await openFunctionLibrary(page, isMobile, 'TKQC')
    await library.locator('.ads-function-row').first().click()
    const startButton = page.getByRole('button', { name: 'Bắt đầu quy trình' })
    await expect(startButton).toBeEnabled()
    await startButton.click()

    await expect(selectedRow.locator('td').nth(8)).not.toHaveText('-', { timeout: 2000 })
    await expect(otherRow.locator('td').nth(8)).toHaveText('-')
    // Round 1 Part 11 — TKQC's progress cell now reads from the shared
    // execution-history model (completed/total + Eye opening "Nhật ký
    // chạy"), and stays PERSISTENT once finished rather than reverting to
    // "-" (matches the task's own "[green progress] 1/1" example). BM's
    // own simpler progress bar is untouched by this round and still
    // reverts — see the BM-specific test elsewhere in this suite.
    await expect(selectedRow.locator('td').nth(8)).toContainText('1/1', { timeout: 3000 })
    await page.waitForTimeout(2000)
    await expect(selectedRow.locator('td').nth(8)).toContainText('1/1')
    await expect(selectedRow.locator('td').nth(8).getByRole('button', { name: /Nhật ký chạy/ })).toBeVisible()
  })
})

test.describe('Correction Batch 2: TKQC Payment Method visual', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('single method shows [BRAND] - last4; multiple methods add "N more..."; no method shows -', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const withOne = page.getByRole('row', { name: /TKQC Demo 02/ }).first()
    await expect(withOne.locator('.ads-tkqc-payment-badge')).toHaveText('Mastercard')
    await expect(withOne).toContainText('- 0037')
    await expect(withOne.locator('.ads-tkqc-payment-more')).toHaveCount(0)

    const withMultiple = page.getByRole('row', { name: /TKQC Demo 05/ }).first()
    await expect(withMultiple.locator('.ads-tkqc-payment-more')).toContainText('more...')

    const withNone = page.getByRole('row', { name: /TKQC Demo 01/ }).first()
    await expect(withNone.locator('td').nth(13)).toHaveText('-')
  })
})

test.describe('Correction Batch 2: TKQC Admin panel', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('pill disabled at 0 admins; opens panel with role badges + BẠN badge; promote/demote respect the hierarchy; remove updates the panel and the pill count together', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const emptyRow = page.getByRole('row', { name: /TKQC Demo 01/ }).first()
    await expect(emptyRow.getByRole('button', { name: /Admin: 0/ })).toBeDisabled()

    const row = page.getByRole('row', { name: /TKQC Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin: \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Quản trị viên TKQC' })
    await expect(dialog).toBeVisible()
    await expect(dialog.getByText('BẠN')).toHaveCount(0) // TKQC Demo 05 is not the index-0 row
    const firstAdminRow = dialog.locator('.ads-resource-row').first()
    await expect(firstAdminRow.locator('.ads-resource-badge').first()).toContainText(/Quản trị viên|Nhà quảng cáo|Người phân tích/)

    const before = await dialog.locator('.ads-resource-row').count()
    await firstAdminRow.getByRole('button', { name: /Tùy chọn cho/ }).click()
    await dialog.getByRole('menuitem', { name: 'Xóa quản trị viên' }).click()
    await expect(dialog.locator('.ads-resource-row')).toHaveCount(before - 1)
    await dialog.locator('.ads-resource-panel-close').click()
    await expect(row.getByRole('button', { name: /Admin: \d+/ })).toContainText(String(before - 1))
  })

  test('search filters by name or UID', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin: \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Quản trị viên TKQC' })
    const before = await dialog.locator('.ads-resource-row').count()
    await dialog.getByRole('textbox', { name: 'Tìm theo tên hoặc UID...' }).fill('no-such-admin-xyz')
    await expect(dialog.locator('.ads-resource-row')).toHaveCount(0)
    await expect(dialog.getByText('Không có dữ liệu.')).toBeVisible()
    await dialog.getByRole('textbox', { name: 'Tìm theo tên hoặc UID...' }).fill('')
    await expect(dialog.locator('.ads-resource-row')).toHaveCount(before)
  })
})

test.describe('Correction Batch 2: BM field corrections', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('Quyền uses exact QTV/Nhân viên labels; Verified is a pure ✓/× visual with no "Đang xử lý" text; Loại BM and Level BM are independent values', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const table = page.locator('.ads-pro-table.is-bm-full')
    await expect(table).not.toContainText('Đang xử lý')
    const permissionCells = table.locator('tbody tr td', { hasText: /^(QTV|Nhân viên)$/ })
    expect(await permissionCells.count()).toBeGreaterThan(0)

    // Level BM only populated on every 3rd row (index % 3 === 0) — others show "-".
    const rowWithNullLevel = page.getByRole('row', { name: /BM Demo 02/ }).first() // index 1
    await expect(rowWithNullLevel).toContainText(/BM1|BM3|BM5/) // Loại BM always present
    const cells = rowWithNullLevel.locator('td')
    const cellCount = await cells.count()
    const texts = await cells.allInnerTexts()
    expect(texts.some((text) => text === '-')).toBe(true)
    expect(cellCount).toBeGreaterThan(0)
  })
})

test.describe('Correction Batch 2: BM Resource Panels (shared shell, 6 kinds)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('all 6 kinds open with the correct title/search placeholder; remove updates the cell count immediately', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 08/ }).first()

    await row.getByRole('button', { name: /Đối tác: \d+/ }).click()
    await expect(page.getByRole('dialog', { name: 'Đối tác BM' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Tìm đối tác...' })).toBeVisible()
    await page.locator('.ads-resource-panel-close').click()

    await row.getByRole('button', { name: /Admin \d+/ }).click()
    const adminDialog = page.getByRole('dialog', { name: 'Admin BM' })
    await expect(adminDialog).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Tìm admin...' })).toBeVisible()
    const beforeCount = await adminDialog.locator('.ads-resource-row').count()
    await adminDialog.locator('.ads-resource-row-main input[type="checkbox"]').first().check()
    await adminDialog.getByRole('button', { name: 'Xóa admin' }).click()
    // SHARED RULE D propagated to BM: destructive removal confirms first via
    // the same AdsProConfirmDialog TKQC's payment popover uses — no mutation
    // until the confirm dialog's own destructive button is clicked.
    const confirmDialog = page.getByRole('alertdialog', { name: 'Xóa admin?' })
    await expect(confirmDialog).toBeVisible()
    await expect(adminDialog.locator('.ads-resource-row')).toHaveCount(beforeCount)
    await confirmDialog.getByRole('button', { name: 'Xóa admin' }).click()
    await expect(adminDialog.locator('.ads-resource-row')).toHaveCount(beforeCount - 1)
    await page.locator('.ads-resource-panel-close').click()
    await expect(row.getByRole('button', { name: /Admin \d+/ })).toContainText(String(beforeCount - 1))

    await row.getByRole('button', { name: /Tổng: \d+ - Owned: \d+ - Share: \d+/ }).click()
    await expect(page.getByRole('dialog', { name: 'TKQC (Owned + Share)' })).toBeVisible()
    await expect(page.getByText(/^(Owned|Share) · ID:/).first()).toBeVisible()
    await page.locator('.ads-resource-panel-close').click()

    await row.getByRole('button', { name: /Page: \d+/ }).click()
    await expect(page.getByRole('dialog', { name: 'Page BM' })).toBeVisible()
    await page.locator('.ads-resource-panel-close').click()

    await row.getByRole('button', { name: /IG: \d+/ }).click()
    await expect(page.getByRole('dialog', { name: 'TK Instagram' })).toBeVisible()
    await page.locator('.ads-resource-panel-close').click()

    await row.getByRole('button', { name: /WABA: \d+/ }).click()
    await expect(page.getByRole('dialog', { name: 'TK WhatsApp (WABA)' })).toBeVisible()
    await page.locator('.ads-resource-panel-close').click()
  })

  test('empty resource (0 count) shows the disabled pill; a zero-count kind shows "Không có dữ liệu."', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 01/ }).first() // index 0: partners=0, ig=0, waba=0
    await expect(row.getByRole('button', { name: /Đối tác: 0/ })).toBeDisabled()
    await expect(row.getByRole('button', { name: /IG: 0/ })).toBeDisabled()
    await expect(row.getByRole('button', { name: /WABA: 0/ })).toBeDisabled()
  })
})

test.describe('Correction Batch 2: shared column behavior reaches Page/Pixel too', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('Tag picker, Ghi chú dialog, and Lọc nâng cao all work on the Page table using the exact same shared primitives', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const row = page.getByRole('row', { name: /Page Demo 01/ }).first()

    await row.locator('.ads-pro-tag-add').click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toBeVisible()
    await page.keyboard.press('Escape')

    await row.getByRole('button', { name: /Sửa ghi chú/ }).click()
    await page.getByLabel('Nội dung ghi chú').fill('Ghi chú demo Page')
    await page.getByRole('button', { name: 'Lưu ghi chú' }).click()
    await expect(row).toContainText('Ghi chú demo Page')

    await page.getByRole('button', { name: 'Menu cột Tên Page' }).click()
    await page.getByRole('menuitem', { name: 'Lọc nâng cao' }).click()
    await expect(page.getByRole('dialog')).toBeVisible()
    await page.getByRole('button', { name: 'Hủy', exact: true }).click()
  })
})

test.describe('Correction Batch 2: config_column persistence (order + freeze)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('freezing a column persists across reload and restores the correct cumulative multi-column sticky offsets', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    // STT ships frozen by default (Correction Batch 3 Part C5), so the
    // baseline is already 1 before freezing anything else here.
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await page.getByRole('button', { name: 'Menu cột Ngưỡng', exact: true }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(3)

    const stored = await page.evaluate(() => localStorage.getItem('config_column'))
    const parsed = JSON.parse(stored ?? '{}')
    const frozenFields = (parsed['config_adaccounts'] ?? []).filter((entry: { frozen: boolean }) => entry.frozen).map((entry: { field: string }) => entry.field)
    expect(frozenFields).toEqual(expect.arrayContaining(['stt', 'balance', 'threshold']))

    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const frozenTh = page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')
    await expect(frozenTh).toHaveCount(3)
    const sttLeft = await frozenTh.nth(0).evaluate((el) => (el as HTMLElement).style.left)
    const firstLeft = await frozenTh.nth(1).evaluate((el) => (el as HTMLElement).style.left)
    const secondLeft = await frozenTh.nth(2).evaluate((el) => (el as HTMLElement).style.left)
    expect(Number(firstLeft.replace('px', ''))).toBeGreaterThan(Number(sttLeft.replace('px', '')))
    expect(Number(secondLeft.replace('px', ''))).toBeGreaterThan(Number(firstLeft.replace('px', '')))
  })
})

async function dragResizeHandle(page: Page, th: ReturnType<Page['locator']>, deltaPx: number) {
  const handle = th.locator('.ads-column-resize-handle')
  const box = await handle.boundingBox()
  if (!box) throw new Error('resize handle has no bounding box')
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
  await page.mouse.down()
  await page.mouse.move(box.x + deltaPx, box.y + box.height / 2, { steps: 5 })
  await page.mouse.up()
}

test.describe('Correction Batch 3: Workflow Template lifecycle', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only workflow/table interactions')

  test('save creates a new template; a second save without loading anything creates a SECOND template with a different stable id', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Batch3 A')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect(page.getByText('Template đã lưu (1)')).toBeVisible()

    // Batch3 A just got created AND became "loaded" (Correction Batch 3
    // Part A3: saving always makes the just-saved/updated template the new
    // provenance pointer) — so this second save DOES show the checkbox,
    // and it must be checked to create a SECOND template instead of
    // updating "Batch3 A" in place.
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await expect(page.locator('.ads-template-create-new')).toBeVisible()
    await page.locator('.ads-template-create-new input').check()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Batch3 B')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()
    await expect(page.getByText('Template đã lưu (2)')).toBeVisible()

    const stored = await page.evaluate(() => localStorage.getItem('adaccounts.workflow-templates.v1'))
    const templates = JSON.parse(stored ?? '[]') as { id: string; name: string }[]
    expect(templates).toHaveLength(2)
    expect(templates[0].id).not.toBe(templates[1].id)
  })

  test('loading A then B restores each one\'s own steps; editing after loading A never mutates saved A', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Only Mo Dong')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()

    await page.getByRole('button', { name: /^Xoá bước 1:/ }).click()
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    // "Only Mo Dong" is now loaded — check "Tạo template mới" so this saves
    // as an INDEPENDENT second template instead of overwriting it.
    await page.locator('.ads-template-create-new input').check()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Only Doi Ten')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()

    const stepList = page.getByRole('list', { name: 'Các bước trong quy trình' })
    await page.getByRole('button', { name: 'Only Mo Dong 1 bước' }).click()
    await expect(stepList).toContainText('Mở / Đóng TK')
    await expect(stepList).not.toContainText('Đổi tên TKQC')

    // Edit the current workflow (loaded from "Only Mo Dong") WITHOUT saving.
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await expect(stepList).toContainText('Đổi tên TKQC')

    // Reload from storage directly — "Only Mo Dong" must still be exactly
    // what it was saved as (1 step), never silently mutated by the edit above.
    const stored = await page.evaluate(() => localStorage.getItem('adaccounts.workflow-templates.v1'))
    const templates = JSON.parse(stored ?? '[]') as { name: string; steps: unknown[] }[]
    const onlyMoDong = templates.find((template) => template.name === 'Only Mo Dong')
    expect(onlyMoDong?.steps).toHaveLength(1)

    await page.getByRole('button', { name: 'Only Doi Ten 1 bước' }).click()
    await expect(stepList).toContainText('Đổi tên TKQC')
    await expect(stepList).not.toContainText('Mở / Đóng TK')
  })

  test('reload preserves multiple templates; malformed storage and an unknown functionId are both handled safely', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const library = await openFunctionLibrary(page, false, 'TKQC')
    await library.getByRole('button', { name: 'Mở / Đóng TK', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Persist A')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()
    await library.getByRole('button', { name: 'Đổi tên TKQC', exact: true }).click()
    await page.getByRole('button', { name: 'Lưu Template' }).click()
    await page.locator('.ads-template-create-new input').check()
    await page.getByRole('textbox', { name: 'Nhập tên Template' }).fill('Persist B')
    await page.getByRole('button', { name: 'Lưu', exact: true }).click()

    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await expect(page.getByText('Template đã lưu (2)')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Persist A 1 bước' })).toBeVisible()
    await expect(page.getByRole('button', { name: 'Persist B 2 bước' })).toBeVisible()

    // Inject an unknown functionId into one template + fully malformed JSON,
    // in two separate reload passes.
    await page.evaluate(() => {
      const raw = localStorage.getItem('adaccounts.workflow-templates.v1')
      const templates = JSON.parse(raw ?? '[]')
      templates[0].steps.push({ itemId: 'ghost-1', functionId: 'no-such-function', icon: 'ghost', label: 'Ghost Fn', groupLabel: 'Ghost', config: {} })
      localStorage.setItem('adaccounts.workflow-templates.v1', JSON.stringify(templates))
    })
    await page.reload()
    await openAssetWorkspace(page)
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await page.getByRole('button', { name: 'Persist A 2 bước' }).click()
    await expect(page.getByRole('list', { name: 'Các bước trong quy trình' })).toContainText('Ghost Fn')

    await page.evaluate(() => localStorage.setItem('adaccounts.workflow-templates.v1', '{not valid json'))
    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    await page.getByRole('button', { name: 'Template', exact: true }).click()
    await expect(page.getByText('Chưa có template')).toBeVisible()
    expect(errors).toEqual([])
  })
})

test.describe('Correction Batch 3: Column Resize (shared architecture, all 5 tabs)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only drag interaction')

  test('VIA/TKQC/BM/Page/Pixel each resize independently; header+body+colgroup stay in sync', async ({ page }) => {
    await openAssetWorkspace(page)

    const viaTh = page.locator('.ads-pro-table.is-via thead th').filter({ hasText: 'Trạng thái' }).first()
    const viaBefore = await viaTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, viaTh, 100)
    const viaAfter = await viaTh.evaluate((el) => el.getBoundingClientRect().width)
    expect(viaAfter).toBeGreaterThan(viaBefore + 50)
    const viaBodyCell = page.locator('.ads-pro-table.is-via tbody tr').first().locator('td').nth(2)
    expect(Math.round(await viaBodyCell.evaluate((el) => el.getBoundingClientRect().width))).toBeCloseTo(Math.round(viaAfter), 0)

    await page.getByRole('tab', { name: /TKQC/ }).click()
    const tkqcTh = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    const tkqcBefore = await tkqcTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, tkqcTh, 100)
    expect(await tkqcTh.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(tkqcBefore + 50)

    await page.getByRole('tab', { name: /^BM/ }).click()
    const bmTh = page.locator('.ads-pro-table.is-bm-full thead th').filter({ hasText: 'Tên BM' }).first()
    const bmBefore = await bmTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, bmTh, 100)
    expect(await bmTh.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(bmBefore + 50)

    await page.getByRole('tab', { name: /^Page/ }).click()
    const pageTh = page.locator('.ads-pro-table.is-page thead th').filter({ hasText: 'Tên Page' }).first()
    const pageBefore = await pageTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, pageTh, 100)
    expect(await pageTh.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(pageBefore + 50)

    await page.getByRole('tab', { name: /^Pixel/ }).click()
    const pixelTh = page.locator('.ads-pro-table.is-pixel thead th').filter({ hasText: 'Tên Pixel' }).first()
    const pixelBefore = await pixelTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, pixelTh, 100)
    expect(await pixelTh.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(pixelBefore + 50)
  })

  test('TKQC footer totals stay pixel-aligned with header/body after a resize (Part B7 fix)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const th = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Số dư' }).first()
    await dragResizeHandle(page, th, 100)
    const headerWidth = Math.round(await th.evaluate((el) => el.getBoundingClientRect().width))
    const footerSpan = page.locator('.ads-tkqc-footer-summary-track span').nth(5) // checkbox, stt, status, name, accountId, balance
    const footerWidth = Math.round(await footerSpan.evaluate((el) => el.getBoundingClientRect().width))
    expect(Math.abs(headerWidth - footerWidth)).toBeLessThanOrEqual(1)
  })

  test('resize persists across reload; a pre-Part-B stored config with no meaningful width migrates to current defaults; malformed width falls back safely', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const th = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    await dragResizeHandle(page, th, 100)
    const resized = Math.round(await th.evaluate((el) => el.getBoundingClientRect().width))

    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const thAfterReload = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    expect(Math.round(await thAfterReload.evaluate((el) => el.getBoundingClientRect().width))).toBeCloseTo(resized, 0)

    // Malformed width (0/negative/non-finite) falls back to the column's
    // own default instead of crashing or rendering a broken layout.
    await page.evaluate(() => {
      const raw = localStorage.getItem('config_column')
      const parsed = JSON.parse(raw ?? '{}')
      parsed['config_adaccounts'] = parsed['config_adaccounts'].map((entry: { field: string; width: number; frozen: boolean }) => entry.field === 'name' ? { ...entry, width: -5 } : entry)
      localStorage.setItem('config_column', JSON.stringify(parsed))
    })
    await page.reload()
    await openAssetWorkspace(page)
    const errors: string[] = []
    page.on('pageerror', (err) => errors.push(String(err)))
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const thAfterMalformed = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    expect(await thAfterMalformed.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(60)
    expect(errors).toEqual([])
  })

  test('resizing a frozen column recalculates the OTHER frozen column\'s sticky offset immediately', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    const sttTh = page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen').nth(0)
    const balanceTh = page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen').nth(1)
    const beforeOffset = Number((await balanceTh.evaluate((el) => (el as HTMLElement).style.left)).replace('px', ''))

    await dragResizeHandle(page, sttTh, 40)
    const afterOffset = Number((await balanceTh.evaluate((el) => (el as HTMLElement).style.left)).replace('px', ''))
    expect(afterOffset).toBeGreaterThan(beforeOffset)
  })

  test('resize then reorder then freeze keeps the resized width; dropdown/drag-handle/resize-handle gestures never trigger each other', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const nameTh = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    await dragResizeHandle(page, nameTh, 100)
    const resizedWidth = Math.round(await nameTh.evaluate((el) => el.getBoundingClientRect().width))

    // D1: clicking the dropdown must not start a reorder/resize drag.
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await expect(page.getByRole('menu', { name: 'Menu cột Tài khoản' })).toBeVisible()
    await page.keyboard.press('Escape')
    expect(Math.round(await nameTh.evaluate((el) => el.getBoundingClientRect().width))).toBe(resizedWidth)

    // D2/D3: the reorder drag handle and the resize handle are independent —
    // dragging the header by its reorder handle must not resize it.
    const statusTh = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Trạng thái' }).first()
    const statusBox = await statusTh.boundingBox()
    const nameBox = await nameTh.boundingBox()
    if (!statusBox || !nameBox) throw new Error('missing bounding box')
    await page.mouse.move(statusBox.x + 10, statusBox.y + statusBox.height / 2)
    await page.mouse.down()
    await page.mouse.move(nameBox.x + 10, nameBox.y + nameBox.height / 2, { steps: 5 })
    await page.mouse.up()
    const nameThAfterReorder = page.locator('.ads-pro-table.is-tkqc-full thead th').filter({ hasText: 'Tài khoản' }).first()
    expect(Math.round(await nameThAfterReorder.evaluate((el) => el.getBoundingClientRect().width))).toBe(resizedWidth)

    // Freeze the (still-resized) column and confirm the width survives.
    await nameThAfterReorder.locator('.ads-column-menu-trigger').click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    expect(Math.round(await nameThAfterReorder.evaluate((el) => el.getBoundingClientRect().width))).toBe(resizedWidth)
  })
})

test.describe('Correction Batch 3: STT column dropdown (all 5 tabs)', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('STT has a full column menu (traced: same shared component, no per-column exclusion) on every tab', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: 'Menu cột STT' }).click()
    await expect(page.getByRole('menu', { name: 'Menu cột STT' })).toBeVisible()
    await page.keyboard.press('Escape')

    for (const tabName of [/TKQC/, /^BM/, /^Page/, /^Pixel/]) {
      await page.getByRole('tab', { name: tabName }).click()
      await page.getByRole('button', { name: 'Menu cột STT' }).click()
      await expect(page.getByRole('menu', { name: 'Menu cột STT' })).toBeVisible()
      await page.keyboard.press('Escape')
    }
  })

  test('BM Round 1 Shared Rule #3: STT is PERMANENTLY frozen — the menu has no freeze toggle at all, and it can never be unfrozen', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(1)
    await page.getByRole('button', { name: 'Menu cột STT' }).click()
    await expect(page.getByRole('menuitem', { name: 'Bỏ đóng băng cột' })).toHaveCount(0)
    await expect(page.getByRole('menuitem', { name: 'Đóng băng cột' })).toHaveCount(0)
    await page.keyboard.press('Escape')
    // Data-layer backstop: even a direct call can't unfreeze/reorder it —
    // covered structurally by useColumnConfig's own guards; here we assert
    // the observable outcome stays frozen after a reload too.
    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(1)
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th').nth(1)).toContainText('STT')
  })

  test('STT sort: ascending is a no-op (already ascending by construction), descending reverses the current row list', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const firstRowName = () => page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first().locator('td').nth(3).innerText()
    await expect(await firstRowName()).toContain('TKQC Demo 01')
    await page.getByRole('button', { name: 'Menu cột STT' }).click()
    await page.getByRole('menuitem', { name: 'Thấp đến cao' }).click()
    await expect(await firstRowName()).toContain('TKQC Demo 01')
    await page.getByRole('button', { name: 'Menu cột STT' }).click()
    await page.getByRole('menuitem', { name: 'Cao đến thấp' }).click()
    await expect(await firstRowName()).toContain('TKQC Demo 60')
  })

  test('BM Round 1 Shared Rule #3: STT is resizable but NOT draggable (locked first, no reorder), unlike a normal column', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const sttTh = page.locator('.ads-pro-table.is-tkqc-full thead th').nth(1) // 0 = checkbox, 1 = STT
    await expect(sttTh).toHaveAttribute('draggable', 'false')
    await expect(sttTh.locator('.ads-column-resize-handle')).toHaveCount(1)
    const before = await sttTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, sttTh, 30)
    expect(await sttTh.evaluate((el) => el.getBoundingClientRect().width)).toBeGreaterThan(before)
  })

  test('BM Round 1 Shared Rule #2/#3: no column can ever be dropped before STT (drag a normal column onto STT is a no-op)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const sttTh = page.locator('.ads-pro-table.is-tkqc-full thead th').nth(1)
    await expect(sttTh).toContainText('STT')
    // Simulate a drop of "Trạng thái" directly onto STT's own <th> (the
    // DataTransfer must be constructed IN the browser context, not Node).
    await sttTh.evaluate((el) => {
      const dt = new DataTransfer()
      dt.setData('text/tkqc-column', 'status')
      el.dispatchEvent(new DragEvent('drop', { bubbles: true, dataTransfer: dt }))
    })
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th').nth(1)).toContainText('STT')
  })

  test('BM Round 1 Shared Rule #2/#3: STT stays locked/first/frozen on BM and Page/Pixel too (freeze menu absent, not draggable)', async ({ page }) => {
    await openAssetWorkspace(page)
    // Page Round 1: production traces `status`+`name` as ALSO
    // defaultFrozen (not just STT) — see ads-check-pro-generic-data.ts's
    // own trace note — so Page alone ships with 3 frozen headers by
    // default, not 1; Pixel (same shared table component) is untouched.
    for (const { tab, key, frozenCount } of [{ tab: /^BM/, key: 'stt', frozenCount: 1 }, { tab: /^Page/, key: 'order', frozenCount: 3 }, { tab: /^Pixel/, key: 'order', frozenCount: 1 }]) {
      await page.getByRole('tab', { name: tab }).click()
      const table = key === 'stt' ? '.ads-pro-table.is-bm-full' : '.ads-pro-table.is-generic'
      await expect(page.locator(`${table} thead th.is-frozen`)).toHaveCount(frozenCount)
      await expect(page.locator(`${table} thead th`).nth(1)).toContainText('STT')
      await expect(page.locator(`${table} thead th`).nth(1)).toHaveAttribute('draggable', 'false')
      await page.getByRole('button', { name: 'Menu cột STT' }).click()
      await expect(page.getByRole('menuitem', { name: /Đóng băng cột|Bỏ đóng băng cột/ })).toHaveCount(0)
      await page.keyboard.press('Escape')
    }
  })
})

test.describe('VIA Audit Batch 1: Refresh splash, Download, Column Settings, UI Settings', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only toolbar/panel interactions')

  test('Refresh re-shows the existing splash overlay (reused, not recreated) and clears when done', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Làm mới/ }).click()
    await expect(page.locator('.ads-pro-refresh-overlay .ads-v8-loading-shell')).toBeVisible()
    await expect(page.locator('.ads-pro-refresh-overlay')).toBeHidden({ timeout: 5_000 })
    await expect(page.getByRole('tab', { name: /VIA/ })).toHaveAttribute('aria-selected', 'true')
  })

  test('Download panel is an anchored popover (not a centered modal), with count/description/format pills matching the traced spec', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const panel = page.locator('.ads-download-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('h2')).toContainText('Tải xuống')
    await expect(panel.locator('.ads-download-panel-count')).toHaveText('(97)')
    await expect(panel.locator('.ads-download-panel-hint')).toHaveText('Khi chọn tài khoản cụ thể, hệ thống sẽ tải những tài khoản đó, mặc định nếu không chọn thì sẽ tải toàn bộ trong bảng.')
    await expect(panel.getByRole('radio', { name: 'Text', exact: true })).toHaveAttribute('aria-checked', 'true')
    await expect(panel.locator('.ads-download-preview')).toBeVisible()
    await expect(panel.locator('.ads-download-copy-hint')).toHaveText('Giữ Ctrl + C để Copy')
    // anchored under the toolbar, not centered — no full-viewport dim backdrop sibling
    await expect(page.locator('.ads-advanced-filter-backdrop')).toHaveCount(0)
  })

  test('Download text preview auto-selects on focus (Ctrl+C hint is backed by real behavior)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const textarea = page.locator('.ads-download-preview')
    await textarea.click()
    const selected = await textarea.evaluate((el: HTMLTextAreaElement) => el.selectionEnd - el.selectionStart)
    expect(selected).toBeGreaterThan(0)
  })

  test('Download produces a real .xlsx file named from the traced production formula', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const panel = page.locator('.ads-download-panel')
    await panel.getByRole('radio', { name: '.xlsx' }).click()
    await expect(panel.locator('.ads-download-preview')).toBeHidden()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      panel.locator('.ads-download-cta').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^adscheck-via-list-v2-\d{4}-\d{2}-\d{2}\.xlsx$/)
    await expect(panel).toBeHidden()
  })

  test('Download produces a real .csv file; leaving Tên File empty falls back to the generated default', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const panel = page.locator('.ads-download-panel')
    await panel.getByRole('radio', { name: '.csv' }).click()
    await expect(panel.getByLabel('Tên File')).toHaveValue('')
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      panel.locator('.ads-download-cta').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^adscheck-via-list-v2-\d{4}-\d{2}-\d{2}\.csv$/)
  })

  test('Download dataset semantics: header count matches selection when rows are selected, else the full filtered dataset', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('VIA Demo 01')
    const row = page.getByRole('row', { name: /VIA Demo 01/ })
    await row.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    await expect(page.locator('.ads-download-panel-count')).toHaveText('(1)')
  })

  test('Column Settings modal: VIA shows 9/9 (8 reorderable + the locked Hành động row), search filters the list only', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    const modal = page.locator('.ads-column-settings-modal')
    await expect(modal).toBeVisible()
    await expect(modal.locator('.ads-column-settings-count')).toHaveText('Hiển thị cột 9/9')
    await expect(modal.getByText('Hành động')).toBeVisible()
    await expect(modal.locator('.ads-column-settings-row.is-locked')).toHaveCount(1)

    await modal.getByLabel('Tìm kiếm cột').fill('Ghi chú')
    await expect(modal.locator('.ads-column-settings-row')).toHaveCount(1)
    // the underlying data table must stay untouched by the search pill
    await expect(page.locator('.ads-pro-table th', { hasText: 'Tag' })).toBeVisible()
  })

  test('Column Settings Save commits the pending hide (persists across reload); Hủy discards it', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    let modal = page.locator('.ads-column-settings-modal')
    await modal.getByLabel('Hiện cột Ghi chú').uncheck()
    await modal.getByRole('button', { name: 'Hủy' }).click()
    await expect(modal).toBeHidden()
    await expect(page.locator('.ads-pro-table th', { hasText: 'Ghi chú' })).toBeVisible()

    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    modal = page.locator('.ads-column-settings-modal')
    await modal.getByLabel('Hiện cột Ghi chú').uncheck()
    await modal.getByRole('button', { name: 'Lưu tùy chỉnh' }).click()
    await expect(modal).toBeHidden()
    await expect(page.locator('.ads-pro-table th', { hasText: 'Ghi chú' })).toHaveCount(0)

    await page.reload()
    await openAssetWorkspace(page)
    await expect(page.locator('.ads-pro-table th', { hasText: 'Ghi chú' })).toHaveCount(0)
  })

  test('Column Settings freeze toggle shares the same source of truth as the direct header dropdown', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    const modal = page.locator('.ads-column-settings-modal')
    await modal.getByRole('button', { name: 'Đóng băng cột Trạng thái' }).click()
    await modal.getByRole('button', { name: 'Lưu tùy chỉnh' }).click()
    await page.getByRole('button', { name: 'Menu cột Trạng thái' }).click()
    await expect(page.getByRole('menuitem', { name: 'Bỏ đóng băng cột' })).toBeVisible()
  })

  test('Column Settings Save preserves an existing width override from a prior resize', async ({ page }) => {
    await openAssetWorkspace(page)
    const nameTh = page.locator('.ads-pro-table.is-via thead th', { hasText: 'Tài khoản Facebook' })
    const before = await nameTh.evaluate((el) => el.getBoundingClientRect().width)
    await dragResizeHandle(page, nameTh, 40)
    const resized = await nameTh.evaluate((el) => el.getBoundingClientRect().width)
    expect(resized).toBeGreaterThan(before)

    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    await page.getByRole('button', { name: 'Lưu tùy chỉnh' }).click()
    expect(await nameTh.evaluate((el) => el.getBoundingClientRect().width)).toBe(resized)
  })

  test('UI Settings panel: surface/grid-lines/font-size/font-weight/row-spacing/decimal all live-apply and persist across reload', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: 'Cài đặt giao diện' }).click()
    const panel = page.locator('.ads-ui-settings-panel')
    const shell = page.locator('.ads-pro-table-shell').first()

    await expect(shell).toHaveAttribute('data-ac-surface', 'default')
    await panel.getByRole('button', { name: 'Màu nền trắng' }).click()
    await expect(shell).toHaveAttribute('data-ac-surface', 'white')

    await panel.getByRole('button', { name: 'Tắt đường kẻ viền' }).click()
    await expect(shell).toHaveAttribute('data-ac-grid-lines', 'default')

    await panel.getByRole('button', { name: 'Cỡ chữ 16px' }).click()
    await expect(shell).toHaveAttribute('data-ac-font-size', '16')

    await panel.getByRole('button', { name: 'Độ dày vừa' }).click()
    await expect(shell).toHaveAttribute('data-ac-font-weight', 'medium')

    await panel.getByRole('button', { name: 'Lớn · 58' }).click()
    await expect(shell).toHaveAttribute('data-ac-row-spacing', '58')

    await panel.getByRole('button', { name: 'Dấu chấm (1.234,56)' }).click()

    await expect(page.evaluate(() => localStorage.getItem('adaccounts.display-settings.v1'))).resolves.toBe(
      JSON.stringify({ surface: 'white', gridLines: 'default', fontSize: '16', fontWeight: 'medium', rowSpacing: '58', decimalSeparator: 'dot' }),
    )

    await page.reload()
    await openAssetWorkspace(page)
    await expect(page.locator('.ads-pro-table-shell').first()).toHaveAttribute('data-ac-font-size', '16')
  })

  test('opening UI Settings closes an already-open Download panel via its own outside-click handler (no bespoke exclusivity rule, but no stacking either)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    await expect(page.locator('.ads-download-panel')).toBeVisible()
    await page.getByRole('button', { name: 'Cài đặt giao diện' }).click()
    await expect(page.locator('.ads-ui-settings-panel')).toBeVisible()
    await expect(page.locator('.ads-download-panel')).toBeHidden()
  })

  // Download is wired for VIA only this batch (Part B's own scope — the
  // export column set/dataset semantics were only traced for VIA), and
  // VIA's toolbar never enters the compact "Hành động" dropdown tier (its
  // own full-row policy, unrelated to this batch) — so the DOMRect-capture
  // anchor fix for Download is exercised via code review, not this
  // dropdown path. UI Settings IS wired for every tab, and TKQC does go
  // compact, so it can exercise the real anchor-from-dropdown path here.
  test('UI Settings anchors correctly when opened from the compact "Hành động" dropdown (TKQC)', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 })
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.getByRole('button', { name: 'Mở quy trình TKQC' }).click()
    const trigger = page.getByRole('button', { name: 'Hành động' })
    await expect(trigger).toBeVisible()

    const menu = page.locator('.ads-pro-actions-menu')
    await trigger.click()
    await expect(menu).toBeVisible()
    await menu.getByRole('button', { name: 'Cài đặt giao diện' }).click()
    await expect(menu).toBeHidden()
    const panel = page.locator('.ads-ui-settings-panel')
    await expect(panel).toBeVisible()
    const uiBox = await panel.boundingBox()
    expect(uiBox?.width).toBeGreaterThan(0)
    expect(uiBox?.height).toBeGreaterThan(0)
  })
})

test.describe('VIA correction: floating bulk selection actions', () => {
  test.skip(({ isMobile }) => isMobile, 'covered with explicit responsive desktop viewports below')

  test('selection drives the floating bar and All folder never renders remove-from-folder', async ({ page }) => {
    await openAssetWorkspace(page)
    const bar = page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' })
    await expect(bar).toHaveCount(0)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await expect(bar).toBeVisible()
    await expect(bar).toContainText('Đã chọn 1/97')
    await expect(bar.getByRole('button', { name: 'Gỡ khỏi thư mục' })).toHaveCount(0)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 02/ }).check()
    await expect(bar).toContainText('Đã chọn 2/97')
    await bar.getByRole('button', { name: 'Bỏ chọn tất cả' }).click()
    await expect(bar).toHaveCount(0)
  })

  test('Move Folder searches, creates a real folder, moves every selected row and clears selection', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 02/ }).check()
    await page.getByRole('button', { name: 'Chuyển thư mục' }).click()
    const dialog = page.getByRole('dialog', { name: 'Chọn thư mục chuyển' })
    await expect(dialog).toBeVisible()
    await dialog.getByLabel('Tìm kiếm thư mục').fill('không tồn tại')
    await expect(dialog.getByText('Không tìm thấy thư mục')).toBeVisible()
    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    const createInput = dialog.getByLabel('Tên thư mục mới')
    await expect(createInput).toBeFocused()
    await expect(createInput).toHaveValue('Thư mục 1')
    await createInput.fill('Khách VIP')
    await createInput.fill('  Khách VIP 2026  ')
    await createInput.press('Enter')
    const createdFolder = dialog.getByRole('radio', { name: /Khách VIP 2026.*0/ })
    await expect(createdFolder).toHaveAttribute('aria-checked', 'true')
    await expect(dialog.getByRole('radio', { name: /Thư mục 1/ })).toHaveCount(0)
    await expect(dialog.getByRole('button', { name: 'Chuyển', exact: true })).toBeEnabled()
    await dialog.getByRole('button', { name: 'Chuyển', exact: true }).click()
    await expect(dialog).toBeHidden()
    await expect(page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' })).toHaveCount(0)
    await page.getByRole('button', { name: 'Khách VIP 2026' }).click()
    await expect(page.getByRole('row', { name: /VIA Demo 01/ })).toBeVisible()
    await expect(page.getByRole('row', { name: /VIA Demo 02/ })).toBeVisible()
  })

  test('inline create rejects empty names and Escape/cancel creates nothing without closing Move Folder', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('button', { name: 'Chuyển thư mục' }).click()
    const dialog = page.getByRole('dialog', { name: 'Chọn thư mục chuyển' })
    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    const confirmCreate = dialog.getByRole('button', { name: 'Xác nhận tạo thư mục' })
    await expect(dialog.getByLabel('Tên thư mục mới')).toHaveValue('Thư mục 1')
    await dialog.getByLabel('Tên thư mục mới').fill('   ')
    await expect(confirmCreate).toBeDisabled()
    await dialog.getByLabel('Tên thư mục mới').press('Escape')
    await expect(dialog).toBeVisible()
    await expect(dialog.getByLabel('Tên thư mục mới')).toHaveCount(0)
    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await dialog.getByLabel('Tên thư mục mới').fill('Không tạo')
    await dialog.getByRole('button', { name: 'Hủy tạo thư mục' }).click()
    await expect(dialog.getByRole('radio', { name: /Không tạo/ })).toHaveCount(0)
    await expect(dialog).toBeVisible()
  })

  test('default folder naming uses max numbered folder plus one and ignores custom names', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('button', { name: 'Chuyển thư mục' }).click()
    const dialog = page.getByRole('dialog', { name: 'Chọn thư mục chuyển' })

    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await expect(dialog.getByLabel('Tên thư mục mới')).toHaveValue('Thư mục 1')
    await dialog.getByLabel('Tên thư mục mới').press('Enter')

    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await expect(dialog.getByLabel('Tên thư mục mới')).toHaveValue('Thư mục 2')
    await dialog.getByLabel('Tên thư mục mới').press('Enter')

    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await dialog.getByLabel('Tên thư mục mới').fill('Team Ngọc Anh')
    await dialog.getByLabel('Tên thư mục mới').press('Enter')

    await dialog.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await expect(dialog.getByLabel('Tên thư mục mới')).toHaveValue('Thư mục 3')
    await dialog.getByRole('button', { name: 'Hủy tạo thư mục' }).click()
    await expect(dialog.getByRole('radio', { name: /Thư mục 3/ })).toHaveCount(0)
  })

  test('child folder shows remove action; confirmed removal updates count and current table', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('button', { name: 'Chuyển thư mục' }).click()
    const move = page.getByRole('dialog', { name: 'Chọn thư mục chuyển' })
    await move.getByRole('button', { name: 'Tạo thư mục mới' }).click()
    await move.getByLabel('Tên thư mục mới').fill('Thư mục 1')
    await move.getByRole('button', { name: 'Xác nhận tạo thư mục' }).click()
    await move.getByRole('button', { name: 'Chuyển', exact: true }).click()
    await page.getByRole('button', { name: 'Thư mục 1' }).click()
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    const bar = page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' })
    await expect(bar.getByRole('button', { name: 'Gỡ khỏi thư mục' })).toBeVisible()
    await bar.getByRole('button', { name: 'Gỡ khỏi thư mục' }).click()
    const confirm = page.getByRole('alertdialog', { name: 'Gỡ khỏi thư mục' })
    await confirm.getByRole('button', { name: 'Gỡ khỏi thư mục' }).click()
    await expect(page.getByRole('row', { name: /VIA Demo 01/ })).toHaveCount(0)
    await expect(bar).toHaveCount(0)
  })

  test('bulk Tag is anchored above the bar, searches, creates and attaches through the shared store', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    await page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' }).getByRole('button', { name: 'Gắn Tag', exact: true }).click()
    let picker = page.getByRole('dialog', { name: 'Chọn Tag' })
    await expect(picker).toBeVisible()
    const pickerBox = await picker.boundingBox()
    const barBox = await page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' }).boundingBox()
    expect(pickerBox!.y + pickerBox!.height).toBeLessThanOrEqual(barBox!.y)
    await picker.getByLabel('Tìm kiếm Tag').fill('missing')
    await expect(picker.getByText('Không tìm thấy tag')).toBeVisible()
    await picker.getByRole('button', { name: 'Tạo mới' }).click()
    const createPicker = page.getByRole('dialog', { name: 'Thêm Tag mới' })
    await createPicker.getByLabel('Nhập tên Tag').fill('Bulk Test')
    await createPicker.getByRole('button', { name: 'Xác nhận tạo Tag' }).click()
    picker = page.getByRole('dialog', { name: 'Chọn Tag' })
    await picker.getByRole('button', { name: 'Bulk Test', exact: true }).click()
    await picker.getByRole('button', { name: 'Đóng chọn Tag' }).click()
    await expect(page.getByRole('row', { name: /VIA Demo 01/ })).toContainText('Bulk Test')
  })

  for (const width of [1024, 768]) test(`bulk bar stays viewport-fixed above usable pagination at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 })
    await openAssetWorkspace(page)
    await page.getByRole('checkbox', { name: /Chọn VIA Demo 01/ }).check()
    const bar = page.getByRole('toolbar', { name: 'Thao tác tài sản đã chọn' })
    const box = await bar.boundingBox()
    expect(box!.x).toBeGreaterThanOrEqual(0)
    expect(box!.x + box!.width).toBeLessThanOrEqual(width)
    await expect(page.getByRole('button', { name: 'Trang sau' })).toBeVisible()
    await page.getByRole('button', { name: 'Trang sau' }).click()
    await expect(page.getByText('2/2', { exact: true })).toBeVisible()
  })
})

test.describe('TKQC Round 1: unauthorized bar, Meta links, payment/load/history modals, shared freeze rule', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only toolbar/table interactions')

  test('unauthorized bar + footer overlay stay fixed during horizontal scroll; Xem/Ẩn is one toggle', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const bar = page.locator('.ads-tkqc-restricted-divider')
    const overlay = page.locator('.ads-tkqc-footer-overlay')
    const before = { bar: (await bar.boundingBox())!.x, overlay: (await overlay.boundingBox())!.x }
    await page.locator('.ads-pro-table-scroll').evaluate((el) => { el.scrollLeft = 500 })
    await expect.poll(async () => (await bar.boundingBox())!.x).toBe(before.bar)
    await expect.poll(async () => (await overlay.boundingBox())!.x).toBe(before.overlay)

    const toggle = page.locator('.ads-pro-restricted-view')
    await expect(toggle).toHaveText('Ẩn')
    await toggle.click()
    await expect(toggle).toHaveText('Xem')
    await expect(page.locator('table.is-restricted')).toBeHidden()
  })

  test('FINAL CORRECTION B: Ngày đến hạn TT shows a bare day count when not yet due (no "ngày"/date), keeps the existing "Quá hạn N ngày" wording when overdue', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const dueDateColumnIndex = await page.locator('.ads-pro-table.is-tkqc-full thead th').evaluateAll((ths) => ths.findIndex((th) => th.textContent?.includes('Ngày đến hạn TT')))
    const texts = await page.locator('.ads-pro-table.is-tkqc-full tbody tr').evaluateAll((rows, index) => rows.map((row) => row.querySelectorAll('td')[index]?.textContent ?? ''), dueDateColumnIndex)
    expect(texts.length).toBeGreaterThan(0)
    for (const text of texts) {
      expect(text === '-' || /^\d+$/.test(text) || /^Quá hạn \d+ ngày$/.test(text), `unexpected due-date text: "${text}"`).toBe(true)
    }
  })

  test('Số dư/Ngưỡng/Limit/Trạng thái/Tài khoản open the traced Meta destination for that row\'s real account id', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 02/ }).first()
    const cells = row.locator('td')
    await expect(cells.nth(2).locator('a')).toHaveAttribute('href', /facebook\.com\/accountquality\/890000000000002/)
    await expect(cells.nth(3).locator('a')).toHaveAttribute('href', /adsmanager\.facebook\.com.*campaigns\?act=890000000000002/)
    await expect(cells.nth(4).locator('a')).toHaveAttribute('href', /adsmanager\.facebook\.com.*campaigns\?act=890000000000002/)
    await expect(cells.nth(5).locator('a')).toHaveAttribute('href', /business\.facebook\.com.*billing_hub.*payment_account_id=890000000000002/)
    await expect(cells.nth(6).locator('a')).toHaveAttribute('href', /adsmanager\.facebook\.com.*ad_account_setup\?act=890000000000002/)
  })

  test('ID mask is presentation-only: masks the cell, keeps the real id in the Meta link href', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const idCell = page.getByRole('row', { name: /TKQC Demo 02/ }).first().locator('td').nth(4)
    await expect(idCell).toHaveText('890000000000002')
    await page.getByRole('button', { name: 'Ẩn ID TKQC' }).click()
    await expect(idCell).toHaveText('*'.repeat(15))
    await expect(idCell.locator('a')).toHaveAttribute('href', /act=890000000000002/)
    await page.getByRole('button', { name: 'Hiện ID TKQC' }).click()
    await expect(idCell).toHaveText('890000000000002')
  })

  test('Currency filter narrows the dataset and composes with Search/Folder', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Lọc theo tiền tệ' }).click()
    await page.locator('.ads-pro-currency-panel').getByRole('button', { name: 'USD', exact: true }).click()
    await expect(page.getByRole('button', { name: 'Lọc theo tiền tệ' })).toHaveText('USD')
    const currencyCells = await page.locator('.ads-pro-table.is-tkqc-full tbody tr td').filter({ hasText: /USD|AUD|₫/ }).allInnerTexts()
    expect(currencyCells.some((text) => text.includes('AUD') || text.includes('₫'))).toBe(false)
    await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('TKQC Demo 02')
    await expect(page.getByRole('row', { name: /TKQC Demo 02/ })).toBeVisible()
  })

  test('Download panel: TKQC "Chỉ tải ID" actually restricts the export to the ID column', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const panel = page.locator('.ads-download-panel')
    await expect(panel).toBeVisible()
    await expect(panel.locator('.ads-download-preview')).toContainText('ID TKQC')
    await panel.getByLabel('Chỉ tải ID').check()
    const preview = await panel.locator('.ads-download-preview').inputValue()
    expect(preview.split('\n')[0].split('\t')).toEqual(['ID TKQC'])
  })

  test('Column Settings: TKQC modal shares the same architecture (count, search, drag, freeze) and persists after Save', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    const modal = page.locator('.ads-column-settings-modal')
    await expect(modal).toBeVisible()
    await expect(modal.locator('.ads-column-settings-count')).toBeVisible()
    await modal.getByLabel('Tìm kiếm cột').fill('Ghi chú')
    await expect(modal.locator('.ads-column-settings-row')).toHaveCount(1)
    await modal.getByLabel('Tìm kiếm cột').fill('')
    await modal.getByRole('button', { name: 'Hủy' }).click()
    await expect(modal).toBeHidden()
  })

  test('Payment popover: current cards have delete + external link, history cards have only external link, Xóa toàn bộ thẻ requires confirmation before moving cards to history', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('row', { name: /TKQC Demo 02/ }).locator('.ads-tkqc-payment-methods').click()
    const popover = page.locator('.ads-tkqc-payment-popover')
    await expect(popover).toBeVisible()
    await expect(popover.locator('.ads-tkqc-payment-popover-list:not(.is-history) button')).toHaveCount(1)
    // Shared Rule D — no mutation before the confirm dialog's own destructive button.
    await popover.getByRole('button', { name: 'Xóa toàn bộ thẻ' }).click()
    const confirm = page.locator('.ads-pro-confirm-dialog')
    await expect(confirm).toBeVisible()
    await expect(confirm).toContainText('Xóa toàn bộ thẻ?')
    await expect(confirm).toContainText('TKQC Demo 02')
    await expect(popover.locator('.ads-tkqc-payment-popover-remove-all')).toHaveCount(1)
    await confirm.getByRole('button', { name: 'Xóa', exact: true }).click()
    await expect(confirm).toBeHidden()
    await expect(popover.locator('.ads-tkqc-payment-popover-remove-all')).toHaveCount(0)
    await expect(popover.locator('.ads-tkqc-payment-popover-section')).toContainText('Đã gỡ trước đây')
  })

  test('Payment popover: single-card delete asks for confirmation with the real last4 and account name', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('row', { name: /TKQC Demo 02/ }).locator('.ads-tkqc-payment-methods').click()
    const popover = page.locator('.ads-tkqc-payment-popover')
    await popover.getByRole('button', { name: /^Xóa thẻ/ }).click()
    const confirm = page.locator('.ads-pro-confirm-dialog')
    await expect(confirm).toContainText('Xoá thẻ này?')
    await expect(confirm).toContainText('0037')
    await expect(confirm).toContainText('TKQC Demo 02')
    await confirm.getByRole('button', { name: 'Hủy' }).click()
    await expect(confirm).toBeHidden()
    // Hủy discards — the card must still be present.
    await expect(popover.locator('.ads-tkqc-payment-popover-list:not(.is-history) button')).toHaveCount(1)
  })

  test('"Tải TK" modal: Nguồn tải variants show/hide the ID textarea; idle → loading → Vừa xong; no duplicate concurrent start', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: /^Tải TK/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal.getByText('Danh sách ID TKQC')).toHaveCount(0)
    await modal.getByLabel('Nguồn tải').selectOption('by-bm-id')
    await expect(modal.getByText('Danh sách ID BM')).toBeVisible()
    await modal.getByLabel('Nguồn tải').selectOption('all')
    await expect(modal.getByText('Danh sách ID BM')).toHaveCount(0)
    await modal.getByRole('button', { name: 'Bắt đầu tải' }).click()
    const loadButton = page.getByRole('button', { name: 'Đang tải' })
    await expect(loadButton).toBeVisible()
    await expect(loadButton).toBeDisabled()
    await loadButton.click({ force: true })
    await expect(page.getByRole('button', { name: /Vừa xong/ })).toBeVisible({ timeout: 3000 })
  })

  test('Calendar: applying a preset marks the trigger active; does not reset Search/Folder/Currency', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('textbox', { name: 'Tìm kiếm tài sản' }).fill('TKQC Demo 02')
    await page.getByRole('button', { name: 'Chọn khoảng thời gian Tổng tiêu' }).click()
    await page.locator('.ads-pro-daterange-panel').getByRole('button', { name: '30 ngày trước' }).click()
    await page.locator('.ads-pro-daterange-panel').getByRole('button', { name: 'Áp dụng' }).click()
    await expect(page.getByRole('button', { name: 'Chọn khoảng thời gian Tổng tiêu' })).toHaveClass(/is-active/)
    await expect(page.getByRole('textbox', { name: 'Tìm kiếm tài sản' })).toHaveValue('TKQC Demo 02')
    await expect(page.getByRole('row', { name: /TKQC Demo 02/ })).toBeVisible()
  })

  test('Progress/Nhật ký: completed/total is real, persists after finishing, and Lịch sử hành động shares the same entries', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: 'Mở kho chức năng TKQC' }).click()
    await page.locator('.ads-function-row').first().click()
    await page.getByRole('row', { name: /TKQC Demo 03/ }).getByRole('checkbox').check()
    await page.getByRole('button', { name: 'Bắt đầu quy trình' }).click()
    const cell = page.getByRole('row', { name: /TKQC Demo 03/ }).locator('td').nth(8)
    await expect(cell).toContainText('1/1', { timeout: 3000 })
    // Close Function/Workflow first — with both open the toolbar can be
    // in its compact tier, moving "Lịch sử thao tác" into "Hành động".
    await page.getByRole('button', { name: 'Đóng quy trình' }).click()
    await page.getByRole('button', { name: 'Đóng kho chức năng' }).click()
    await page.getByRole('button', { name: 'Lịch sử thao tác' }).click()
    const history = page.locator('.ads-tkqc-history-modal')
    await expect(history).toBeVisible()
    await expect(history.getByText('TKQC Demo 03')).toBeVisible()
  })

  test('Shared Freeze Rule (5 assets): freezing moves the column into the contiguous frozen prefix; VIA still works', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    // th index: 0=checkbox, 1=STT (frozen by default), 2=Trạng thái, 3=Tài khoản, ...
    const headerLabel = () => page.locator('.ads-pro-table.is-tkqc-full thead th').nth(2).innerText()
    await expect(await headerLabel()).toContain('Trạng thái')
    await page.getByRole('button', { name: 'Menu cột Tài khoản' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    // STT ships frozen by default, so "Tài khoản" must land immediately
    // after it — index 2 (checkbox=0, STT=1, Tài khoản=2).
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th').nth(2)).toContainText('Tài khoản')

    await page.getByRole('tab', { name: /VIA/ }).click()
    await expect(page.getByRole('tab', { name: /VIA/ })).toHaveAttribute('aria-selected', 'true')
    await expect(page.locator('.ads-pro-table.is-via')).toBeVisible()
  })

  test('FINAL PROMPT Part 14/17: freeze is REAL sticky (not just reordered) across header/body/unauthorized/footer, offsets match, and persists across reload', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()

    // STT default frozen on a fresh (no persisted config) load.
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(1)
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th').nth(1)).toContainText('STT')

    // Freeze "Số dư" then "ID TKQC" — must land contiguously: STT, Số dư, ID TKQC.
    await page.getByRole('button', { name: 'Menu cột Số dư' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await page.getByRole('button', { name: 'Menu cột ID TKQC' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()

    const headerLabels = await page.locator('.ads-pro-table.is-tkqc-full thead th').allInnerTexts()
    expect(headerLabels[1]).toContain('STT')
    expect(headerLabels[2]).toContain('Số dư')
    expect(headerLabels[3]).toContain('ID TKQC')
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(3)

    // Unauthorized rows share the exact same frozen offsets as the header.
    const restrictedTable = page.locator('table.is-restricted')
    await expect(restrictedTable).toBeVisible()
    const headerOffsets = await page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen').evaluateAll((ths) => ths.map((th) => th.getBoundingClientRect().left))
    const restrictedOffsets = await restrictedTable.locator('td.is-frozen').evaluateAll((tds) => tds.slice(0, 3).map((td) => td.getBoundingClientRect().left))
    expect(restrictedOffsets).toEqual(headerOffsets)

    // Real sticky: scroll and confirm header, authorized body, unauthorized
    // body, AND the footer summary track's frozen cells all stay at the
    // exact same X — not merely covered by the pagination overlay.
    const bodyFrozenCell = page.locator('.ads-pro-table.is-tkqc-full:not(.is-restricted) tbody tr').first().locator('td.is-frozen').nth(2)
    const restrictedFrozenCell = restrictedTable.locator('tbody tr').first().locator('td.is-frozen').nth(2)
    const footerFrozenCell = page.locator('.ads-tkqc-footer-summary-track span.is-frozen').nth(1)
    const beforeX = {
      header: (await page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen').nth(2).boundingBox())!.x,
      body: (await bodyFrozenCell.boundingBox())!.x,
      restricted: (await restrictedFrozenCell.boundingBox())!.x,
      footer: (await footerFrozenCell.boundingBox())!.x,
    }
    await page.locator('.ads-pro-table-scroll').evaluate((el) => { el.scrollLeft = 700 })
    await page.waitForTimeout(150)
    const afterX = {
      header: (await page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen').nth(2).boundingBox())!.x,
      body: (await bodyFrozenCell.boundingBox())!.x,
      restricted: (await restrictedFrozenCell.boundingBox())!.x,
      footer: (await footerFrozenCell.boundingBox())!.x,
    }
    expect(afterX).toEqual(beforeX)

    // Reload — order/frozen must persist, still contiguous.
    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    const reloadedLabels = await page.locator('.ads-pro-table.is-tkqc-full thead th').allInnerTexts()
    expect(reloadedLabels[1]).toContain('STT')
    expect(reloadedLabels[2]).toContain('Số dư')
    expect(reloadedLabels[3]).toContain('ID TKQC')
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(3)
  })
})

test.describe('Shared Controls Propagation: BM/Page/Pixel brought in line with VIA/TKQC-approved shared controls', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only toolbar/table interactions')

  test('Download panel is now wired for BM/Page/Pixel (was a silent no-op before this propagation), each with its own real ID field', async ({ page }) => {
    await openAssetWorkspace(page)

    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const bmPanel = page.locator('.ads-download-panel')
    await expect(bmPanel).toBeVisible()
    await expect(bmPanel.locator('.ads-download-panel-count')).toHaveText('(40)')
    await bmPanel.getByLabel('Chỉ tải ID').check()
    await expect(bmPanel.locator('.ads-download-preview')).toContainText('ID BM')
    await page.keyboard.press('Escape')
    await expect(bmPanel).toBeHidden()

    await page.getByRole('tab', { name: /^Page/ }).click()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const pagePanel = page.locator('.ads-download-panel')
    await expect(pagePanel).toBeVisible()
    await expect(pagePanel.locator('.ads-download-panel-count')).toHaveText('(45)')
    await pagePanel.getByLabel('Chỉ tải ID').check()
    await expect(pagePanel.locator('.ads-download-preview')).toContainText('Page ID')
    await page.keyboard.press('Escape')
    await expect(pagePanel).toBeHidden()

    await page.getByRole('tab', { name: /^Pixel/ }).click()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const pixelPanel = page.locator('.ads-download-panel')
    await expect(pixelPanel).toBeVisible()
    await expect(pixelPanel.locator('.ads-download-panel-count')).toHaveText('(30)')
    await pixelPanel.getByLabel('Chỉ tải ID').check()
    await expect(pixelPanel.locator('.ads-download-preview')).toContainText('ID Pixel')
    await page.keyboard.press('Escape')
    await expect(pixelPanel).toBeHidden()
  })

  test('BM footer summary track is now real sticky (Part 17 propagated from TKQC): frozen header/footer cells keep the same X across a real scroll, non-frozen cells actually move', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()

    await page.getByRole('button', { name: 'Menu cột Tên BM' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await expect(page.locator('.ads-pro-table.is-bm-full thead th').nth(2)).toContainText('Tên BM')
    await expect(page.locator('.ads-pro-table.is-bm-full thead th.is-frozen')).toHaveCount(2)

    const headerFrozenCell = page.locator('.ads-pro-table.is-bm-full thead th.is-frozen').nth(1)
    const footerFrozenCell = page.locator('.ads-tkqc-footer-summary-track span.is-frozen').nth(1)
    const nonFrozenHeaderCell = page.locator('.ads-pro-table.is-bm-full thead th').nth(3)

    const before = {
      header: (await headerFrozenCell.boundingBox())!.x,
      footer: (await footerFrozenCell.boundingBox())!.x,
      nonFrozen: (await nonFrozenHeaderCell.boundingBox())!.x,
    }
    await page.locator('.ads-pro-table-scroll').evaluate((el) => { el.scrollLeft = 500 })
    await page.waitForTimeout(150)
    const after = {
      header: (await headerFrozenCell.boundingBox())!.x,
      footer: (await footerFrozenCell.boundingBox())!.x,
      nonFrozen: (await nonFrozenHeaderCell.boundingBox())!.x,
    }
    expect(Math.abs(after.header - before.header)).toBeLessThanOrEqual(1)
    expect(Math.abs(after.footer - before.footer)).toBeLessThanOrEqual(1)
    expect(after.header).toBeCloseTo(after.footer, 0)
    // Prove the scroll genuinely happened — a non-frozen column must move.
    expect(Math.abs(after.nonFrozen - before.nonFrozen)).toBeGreaterThan(10)
  })

  test('BM destructive removal: Hủy performs no mutation; only the confirm dialog\'s own destructive button mutates', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 08/ }).first()
    await row.getByRole('button', { name: /Admin \d+/ }).click()
    const adminDialog = page.getByRole('dialog', { name: 'Admin BM' })
    const beforeCount = await adminDialog.locator('.ads-resource-row').count()
    await adminDialog.locator('.ads-resource-row-main input[type="checkbox"]').first().check()
    await adminDialog.getByRole('button', { name: 'Xóa admin' }).click()
    const confirmDialog = page.getByRole('alertdialog', { name: 'Xóa admin?' })
    await expect(confirmDialog).toBeVisible()
    await confirmDialog.getByRole('button', { name: 'Hủy' }).click()
    await expect(confirmDialog).toBeHidden()
    await expect(adminDialog.locator('.ads-resource-row')).toHaveCount(beforeCount)
  })

  test('BM Tag column is now wired to the shared tag system (was a static "-" placeholder, same as VIA/TKQC/Page/Pixel now)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 01/ }).first()
    await row.locator('.ads-pro-tag-add').click()
    await expect(page.getByRole('dialog', { name: 'Chọn Tag' })).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('Curve C state machine and Function/Workflow panels remain asset-generic and unaffected on BM/Page/Pixel', async ({ page }) => {
    await openAssetWorkspace(page)
    for (const { tab, asset } of [{ tab: /^BM/, asset: 'BM' }, { tab: /^Page/, asset: 'Page' }, { tab: /^Pixel/, asset: 'Pixel' }]) {
      await page.getByRole('tab', { name: tab }).click()
      await expect(page.getByRole('button', { name: `Mở kho chức năng ${asset}` })).toBeVisible()
      await expect(page.getByRole('button', { name: `Mở quy trình ${asset}` })).toBeVisible()
    }
  })
})

test.describe('BM Round 1: links, Nút kháng, Verified, SL Admin, Tải BM, Eye, Download, frozen boundary/resize indicators', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('Tên BM and ID BM both open the traced Meta Business People-settings URL for that row\'s real bmId', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    // BM Demo 02 (index 1): not the isLongName/isDie special-cased row, so
    // its accessible name is the plain "BM Demo 02" the link label expects.
    const row = page.getByRole('row', { name: /BM Demo 02/ }).first()
    const nameLink = row.getByRole('link', { name: /Mở BM Demo 02 trên Meta Business/ }).nth(0)
    const idLink = row.getByRole('link', { name: /Mở BM Demo 02 trên Meta Business/ }).nth(1)
    await expect(nameLink).toHaveAttribute('href', /^https:\/\/business\.facebook\.com\/settings\/people\/\?business_id=bm-demo-02$/)
    await expect(idLink).toHaveAttribute('href', /^https:\/\/business\.facebook\.com\/settings\/people\/\?business_id=bm-demo-02$/)
    await expect(idLink).toHaveAttribute('target', '_blank')
  })

  test('Eye masks the ID BM cell display only — the Meta link href still uses the real bmId', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: 'Ẩn ID BM' }).click()
    const row = page.getByRole('row', { name: /BM Demo 02/ }).first()
    const idLink = row.getByRole('link', { name: /Mở BM Demo 02 trên Meta Business/ }).nth(1)
    await expect(idLink).toHaveText('*'.repeat(15))
    await expect(idLink).toHaveAttribute('href', /business_id=bm-demo-02$/)
    await expect(page.getByRole('button', { name: 'Hiện ID BM' })).toBeVisible()
  })

  test('Nút kháng shows plain-text Live/Die (no pill/badge), a separate column from Trạng thái\'s colored badge', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const dieRow = page.getByRole('row', { name: /BM Demo 06/ }).first() // index 5: isDie
    const liveRow = page.getByRole('row', { name: /BM Demo 01/ }).first() // index 0: live
    // "Nút kháng" is column index 6 among data cells (after checkbox+STT):
    // checkbox, STT, Trạng thái, Tên BM, ID BM, Tag, Nút kháng.
    const nutKhangCellDie = dieRow.locator('td').nth(6)
    const nutKhangCellLive = liveRow.locator('td').nth(6)
    await expect(nutKhangCellDie).toHaveText('Die')
    await expect(nutKhangCellLive).toHaveText('Live')
    // Not rendered as a pill/badge (no .ads-pro-status wrapper here, unlike Trạng thái).
    await expect(nutKhangCellDie.locator('.ads-pro-status')).toHaveCount(0)
  })

  test('Verified renders distinct green-check / red-X icons (not text glyphs), comparable size/weight', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 01/ }).first() // index 0: 0 % 5 === 0 -> unverified
    const verifiedCell = row.locator('.ads-bm-verified')
    await expect(verifiedCell).toHaveClass(/is-unverified/)
    await expect(verifiedCell.locator('svg')).toHaveCount(1)
    const color = await verifiedCell.evaluate((el) => getComputedStyle(el).color)
    expect(color).not.toBe('rgb(183, 196, 185)') // the old pale/near-invisible red
  })

  test('SL Admin pill shows the real total (no fabricated FB/IG breakdown) using the shared resource-count pill system style', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 01/ }).first() // index 0: (0%8)+1 = 1 admin
    const pill = row.locator('.ads-resource-count-pill', { hasText: /^Admin \d+$/ })
    await expect(pill).toHaveText('Admin 1')
    await expect(pill).not.toContainText('FB')
    await expect(pill).not.toContainText('IG')
  })

  test('"Tải BM" modal: simpler than TKQC\'s (no Loại tài khoản section), 2 source options, "Danh sách BM ID" textarea, idle → loading → Vừa xong', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: /^Tải BM/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal.locator('h2')).toHaveText('Cấu hình tải Business Manager')
    await expect(modal.getByText('Chọn nguồn BM và nhóm dữ liệu cần thiết để lấy thông tin danh sách tài khoản.')).toBeVisible()
    await expect(modal.getByLabel('Loại tài khoản')).toHaveCount(0)
    await expect(modal.getByText('Danh sách BM ID')).toHaveCount(0)
    await modal.getByLabel('Nguồn tải dữ liệu').selectOption('by-bm-id')
    await expect(modal.getByText('Danh sách BM ID')).toBeVisible()
    await expect(modal.getByPlaceholder('Nhập ID, mỗi ID cách nhau bằng dấu xuống dòng, tab hoặc dấu chấm phẩy')).toBeVisible()
    await modal.getByLabel('Nguồn tải dữ liệu').selectOption('all')
    await expect(modal.getByText('Danh sách BM ID')).toHaveCount(0)
    await modal.getByRole('button', { name: 'Bắt đầu tải' }).click()
    const loadButton = page.getByRole('button', { name: 'Đang tải' })
    await expect(loadButton).toBeVisible()
    await expect(loadButton).toBeDisabled()
    await loadButton.click({ force: true })
    await expect(page.getByRole('button', { name: /Vừa xong/ })).toBeVisible({ timeout: 3000 })
  })

  test('Download produces the traced "bm-data-loading-v5" filename pattern', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: /^Tải xuống/ }).click()
    const panel = page.locator('.ads-download-panel')
    await panel.getByRole('radio', { name: '.xlsx' }).click()
    const [download] = await Promise.all([
      page.waitForEvent('download'),
      panel.locator('.ads-download-cta').click(),
    ])
    expect(download.suggestedFilename()).toMatch(/^adscheck-bm-data-loading-v5-\d{4}-\d{2}-\d{2}\.xlsx$/)
  })

  test('Frozen boundary shadow moves to whichever column is currently last-frozen (header + footer), and disappears from a previously-last column', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    // STT alone: STT itself is last-frozen.
    const sttTh = page.locator('.ads-pro-table.is-bm-full thead th').nth(1)
    await expect(sttTh).toHaveClass(/is-frozen-boundary/)

    await page.getByRole('button', { name: 'Menu cột Tên BM' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    // Now "Tên BM" (index 2) is last-frozen; STT no longer carries the shadow.
    await expect(sttTh).not.toHaveClass(/is-frozen-boundary/)
    const nameTh = page.locator('.ads-pro-table.is-bm-full thead th').nth(2)
    await expect(nameTh).toContainText('Tên BM')
    await expect(nameTh).toHaveClass(/is-frozen-boundary/)
    const footerBoundary = page.locator('.ads-tkqc-footer-summary-track span.is-frozen-boundary')
    await expect(footerBoundary).toHaveCount(1)
  })

  test('Column resize hover shows a sharp green line (not the old translucent wash) exactly at the boundary', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const sttTh = page.locator('.ads-pro-table.is-bm-full thead th').nth(1)
    const handle = sttTh.locator('.ads-column-resize-handle')
    const box = (await handle.boundingBox())!
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    const afterColor = await handle.evaluate((el) => getComputedStyle(el, '::after').backgroundColor)
    expect(afterColor).toBe('rgb(13, 159, 57)')
    const baseBg = await handle.evaluate((el) => getComputedStyle(el).backgroundColor)
    expect(baseBg).toMatch(/rgba\(0, 0, 0, 0\)|transparent/)
  })
})

test.describe('BM Round 1 Final Corrections: permanent frozen system columns + cell-detail outside-close', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  const TABS: { tab: RegExp; table: string; sttKey: string; storageTable: string; nonFrozenIndex?: number }[] = [
    { tab: /^VIA/, table: '.ads-pro-table.is-via', sttKey: 'stt', storageTable: 'via' },
    { tab: /^TKQC/, table: '.ads-pro-table.is-tkqc-full', sttKey: 'stt', storageTable: 'adaccounts' },
    { tab: /^BM/, table: '.ads-pro-table.is-bm-full', sttKey: 'stt', storageTable: 'business' },
    // Page Round 1: production traces `status`+`name` as ALSO
    // defaultFrozen (not just STT) — see ads-check-pro-generic-data.ts's
    // own trace note — so Page's first genuinely non-frozen column is
    // pushed out to index 4 ('id'), not index 3 ('name').
    { tab: /^Page/, table: '.ads-pro-table.is-page', sttKey: 'order', storageTable: 'page', nonFrozenIndex: 4 },
    { tab: /^Pixel/, table: '.ads-pro-table.is-pixel', sttKey: 'order', storageTable: 'pixel' },
  ]

  test('A/B/C/D: checkbox + STT stay pixel-stable (<=1px) across a real far-right scroll, on ALL 5 tabs; a non-frozen column genuinely moves', async ({ page }) => {
    await openAssetWorkspace(page)
    for (const { tab, table, nonFrozenIndex } of TABS) {
      await page.getByRole('tab', { name: tab }).click()
      const checkboxHeader = page.locator(`${table} thead th.is-sticky-checkbox`)
      const checkboxBody = page.locator(`${table} tbody tr`).first().locator('td.is-sticky-checkbox')
      const sttHeader = page.locator(`${table} thead th`).nth(1)
      const sttBody = page.locator(`${table} tbody tr`).first().locator('td').nth(1)
      const nonFrozenHeader = page.locator(`${table} thead th`).nth(nonFrozenIndex ?? 3)

      await expect(checkboxHeader).toBeVisible()
      await expect(sttHeader).toContainText('STT')
      const before = {
        checkboxHeader: (await checkboxHeader.boundingBox())!.x,
        checkboxBody: (await checkboxBody.boundingBox())!.x,
        sttHeader: (await sttHeader.boundingBox())!.x,
        sttBody: (await sttBody.boundingBox())!.x,
        nonFrozen: (await nonFrozenHeader.boundingBox())!.x,
      }
      const scroller = page.locator(`${table}`).locator('xpath=ancestor::div[contains(@class,"ads-pro-table-scroll")]').first()
      await scroller.evaluate((el) => { el.scrollLeft = el.scrollWidth })
      await page.waitForTimeout(150)
      const after = {
        checkboxHeader: (await checkboxHeader.boundingBox())!.x,
        checkboxBody: (await checkboxBody.boundingBox())!.x,
        sttHeader: (await sttHeader.boundingBox())!.x,
        sttBody: (await sttBody.boundingBox())!.x,
        nonFrozen: (await nonFrozenHeader.boundingBox())!.x,
      }
      expect(Math.abs(after.checkboxHeader - before.checkboxHeader)).toBeLessThanOrEqual(1)
      expect(Math.abs(after.checkboxBody - before.checkboxBody)).toBeLessThanOrEqual(1)
      expect(Math.abs(after.sttHeader - before.sttHeader)).toBeLessThanOrEqual(1)
      expect(Math.abs(after.sttBody - before.sttBody)).toBeLessThanOrEqual(1)
      await expect(checkboxHeader).toBeVisible()
      await expect(sttHeader).toBeVisible()
      expect(Math.abs(after.nonFrozen - before.nonFrozen)).toBeGreaterThan(20)
    }
  })

  test('E: multiple frozen columns (BM + TKQC) — checkbox/STT/Frozen-A/Frozen-B all stable <=1px after far-right scroll', async ({ page }) => {
    await openAssetWorkspace(page)
    for (const { tab, table, storageColumns } of [
      { tab: /^TKQC/, table: '.ads-pro-table.is-tkqc-full', storageColumns: ['Số dư', 'ID TKQC'] },
      { tab: /^BM/, table: '.ads-pro-table.is-bm-full', storageColumns: ['Tên BM', 'ID BM'] },
    ]) {
      await page.getByRole('tab', { name: tab }).click()
      for (const label of storageColumns) {
        await page.getByRole('button', { name: `Menu cột ${label}`, exact: true }).click()
        await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
      }
      await expect(page.locator(`${table} thead th.is-frozen`)).toHaveCount(3) // + STT

      const frozenHeaders = page.locator(`${table} thead th.is-frozen`)
      const count = await frozenHeaders.count()
      const before: number[] = []
      for (let i = 0; i < count; i++) before.push((await frozenHeaders.nth(i).boundingBox())!.x)

      const scroller = page.locator(table).locator('xpath=ancestor::div[contains(@class,"ads-pro-table-scroll")]').first()
      await scroller.evaluate((el) => { el.scrollLeft = el.scrollWidth })
      await page.waitForTimeout(150)

      for (let i = 0; i < count; i++) {
        const after = (await frozenHeaders.nth(i).boundingBox())!.x
        expect(Math.abs(after - before[i])).toBeLessThanOrEqual(1)
      }
    }
  })

  test('J: a persisted config_column with STT unfrozen/reordered is normalized back to a valid state on hydrate', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.evaluate(() => {
      const bad = {
        config_adaccounts: [
          { field: 'status', width: 130, frozen: false, hidden: false },
          { field: 'stt', width: 60, frozen: false, hidden: false }, // STT NOT first, NOT frozen
          { field: 'name', width: 220, frozen: false, hidden: false },
        ],
      }
      localStorage.setItem('config_column', JSON.stringify(bad))
    })
    await page.reload()
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^TKQC/ }).click()
    const headers = page.locator('.ads-pro-table.is-tkqc-full thead th')
    await expect(headers.nth(1)).toContainText('STT')
    await expect(page.locator('.ads-pro-table.is-tkqc-full thead th.is-frozen')).toHaveCount(1)
  })

  test('L/M/N/O: BM SL Admin panel — opens, stays open on inside clicks, closes on outside click, X still closes it too', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Admin BM' })
    await expect(dialog).toBeVisible()

    // Inside interactions must NOT close it.
    await dialog.getByRole('textbox', { name: 'Tìm admin...' }).fill('Demo')
    await expect(dialog).toBeVisible()
    await dialog.locator('.ads-resource-row').first().click()
    await expect(dialog).toBeVisible()

    // Click outside (the dim backdrop) closes it. (8,8) is avoided since the
    // app's own topbar occupies that corner above the modal layer; this
    // point is within the fixed backdrop, left of the centered panel.
    await page.locator('.ads-pro-local-dialog-layer').click({ position: { x: 300, y: 690 } })
    await expect(dialog).toBeHidden()

    // Reopen, close via X.
    await row.getByRole('button', { name: /Admin \d+/ }).click()
    await expect(dialog).toBeVisible()
    await dialog.locator('.ads-resource-panel-close').click()
    await expect(dialog).toBeHidden()
  })

  test('P: Esc closes the BM SL Admin panel', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Admin BM' })
    await expect(dialog).toBeVisible()
    await page.keyboard.press('Escape')
    await expect(dialog).toBeHidden()
  })

  test('R: destructive confirmation still fully works after the outside-close change (Hủy vs confirm)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Admin BM' })
    const before = await dialog.locator('.ads-resource-row').count()
    await dialog.locator('.ads-resource-row-main input[type="checkbox"]').first().check()
    await dialog.getByRole('button', { name: 'Xóa admin' }).click()
    const confirmDialog = page.getByRole('alertdialog', { name: 'Xóa admin?' })
    await expect(confirmDialog).toBeVisible()
    // A click meant for the confirm dialog's own content must not leak
    // through to the resource panel's outside-close handler underneath.
    await confirmDialog.getByRole('button', { name: 'Hủy' }).click()
    await expect(confirmDialog).toBeHidden()
    await expect(dialog).toBeVisible()
    await expect(dialog.locator('.ads-resource-row')).toHaveCount(before)

    await dialog.getByRole('button', { name: 'Xóa admin' }).click()
    await confirmDialog.getByRole('button', { name: 'Xóa admin' }).click()
    await expect(dialog.locator('.ads-resource-row')).toHaveCount(before - 1)
  })

  test('TKQC Admin panel (same shared AdsProResourcePanel) also inherits outside-close automatically', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^TKQC/ }).click()
    const row = page.getByRole('row', { name: /TKQC Demo 05/ }).first()
    await row.getByRole('button', { name: /Admin: \d+/ }).click()
    const dialog = page.getByRole('dialog', { name: 'Quản trị viên TKQC' })
    await expect(dialog).toBeVisible()
    await page.locator('.ads-pro-local-dialog-layer').click({ position: { x: 300, y: 690 } })
    await expect(dialog).toBeHidden()
  })
})

test.describe('Shared Resource/Modal UX: ResourceCountPill system style + Category A/B backdrop-dismissal rules', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table/modal interactions')

  test('SL đối tác / SL Admin / SL Ad Account / SL Page / SL IG all share the SAME system pill style (border/bg/color), content stays column-specific', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 08/ }).first()
    const pills = {
      partner: row.locator('.ads-resource-count-pill', { hasText: /^Đối tác: \d+$/ }),
      admin: row.locator('.ads-resource-count-pill', { hasText: /^Admin \d+$/ }),
      adAccount: row.locator('.ads-resource-count-pill', { hasText: /^Tổng: \d+ - Owned: \d+ - Share: \d+$/ }),
      page: row.locator('.ads-resource-count-pill', { hasText: /^Page: \d+$/ }),
      ig: row.locator('.ads-resource-count-pill', { hasText: /^IG: \d+$/ }),
    }
    for (const pill of Object.values(pills)) await expect(pill).toBeVisible()
    // Content stays column-specific (never all collapsed to "Đối tác: N").
    await expect(pills.admin).not.toContainText('Đối tác')
    await expect(pills.adAccount).not.toContainText('Đối tác')

    const styles = await Promise.all(Object.values(pills).map((pill) => pill.evaluate((el) => {
      const cs = getComputedStyle(el)
      return { border: cs.borderColor, background: cs.backgroundColor, color: cs.color, borderRadius: cs.borderRadius, boxShadow: cs.boxShadow }
    })))
    const [first, ...rest] = styles
    for (const style of rest) expect(style).toEqual(first)
    // Reference visual: thin green border, ~white bg, no glow/shadow.
    expect(first.background).toBe('rgb(255, 255, 255)')
    expect(first.boxShadow).toBe('none')
  })

  test('Lightweight panel (SL Admin) still opens/switches/closes correctly with the shared modal backdrop', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 08/ }).first()
    await row.locator('.ads-resource-count-pill', { hasText: /^Admin \d+$/ }).click()
    const adminDialog = page.getByRole('dialog', { name: 'Admin BM' })
    await expect(adminDialog).toBeVisible()
    // Switch to a different resource-count cell's detail — old closes, new opens.
    await page.locator('.ads-pro-local-dialog-layer').click({ position: { x: 300, y: 690 } })
    await expect(adminDialog).toBeHidden()
    await row.locator('.ads-resource-count-pill', { hasText: /^Đối tác: \d+$/ }).click()
    const partnerDialog = page.getByRole('dialog', { name: 'Đối tác BM' })
    await expect(partnerDialog).toBeVisible()
    await expect(adminDialog).toBeHidden()
  })

  test('Action History ("Lịch sử hành động"): backdrop click does NOT close, state/scroll preserved, backdrop still blocks click-through', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: 'Lịch sử thao tác' }).click()
    const modal = page.getByRole('dialog', { name: 'Lịch sử hành động' })
    await expect(modal).toBeVisible()
    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(modal).toBeVisible()
    // Backdrop intercepts the click — it must not reach the table underneath.
    await expect(page.locator('.ads-pro-table.is-bm-full tbody tr.is-selected')).toHaveCount(0)
    await modal.getByRole('button', { name: 'Đóng', exact: true }).click()
    await expect(modal).toBeHidden()
  })

  test('"Cấu hình tải Business Manager": backdrop click does NOT close and does NOT lose the entered source/ID-list/cache state', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: /^Tải BM/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal).toBeVisible()
    await modal.getByLabel('Nguồn tải dữ liệu').selectOption('by-bm-id')
    await modal.getByLabel('Danh sách BM ID').fill('bm-demo-01\nbm-demo-02')
    await modal.getByLabel('Bật cache dữ liệu').uncheck({ force: true })

    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel('Nguồn tải dữ liệu')).toHaveValue('by-bm-id')
    await expect(modal.getByLabel('Danh sách BM ID')).toHaveValue('bm-demo-01\nbm-demo-02')
    await expect(modal.getByLabel('Bật cache dữ liệu')).not.toBeChecked()

    await modal.getByRole('button', { name: 'Hủy' }).click()
    await expect(modal).toBeHidden()
  })

  test('"Cấu hình tải dữ liệu TKQC": same backdrop rule as BM\'s — click outside does NOT close', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /TKQC/ }).click()
    await page.getByRole('button', { name: /^Tải TK/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal).toBeVisible()
    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(modal).toBeVisible()
    await page.keyboard.press('Escape')
  })

  test('"Tùy chỉnh cột": backdrop click does NOT close and draft change is preserved', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    await page.getByRole('button', { name: 'Tùy chỉnh cột' }).click()
    const modal = page.locator('.ads-column-settings-modal')
    await expect(modal).toBeVisible()
    const firstRowVisibility = modal.locator('.ads-column-settings-row').nth(1).locator('.ads-column-settings-visibility input')
    await firstRowVisibility.uncheck()

    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(modal).toBeVisible()
    await expect(firstRowVisibility).not.toBeChecked()

    await modal.getByRole('button', { name: 'Hủy' }).click()
    await expect(modal).toBeHidden()
  })

  test('Destructive confirmation: backdrop click does NOT close and performs no mutation', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^BM/ }).click()
    const row = page.getByRole('row', { name: /BM Demo 08/ }).first()
    await row.locator('.ads-resource-count-pill', { hasText: /^Admin \d+$/ }).click()
    const adminDialog = page.getByRole('dialog', { name: 'Admin BM' })
    const before = await adminDialog.locator('.ads-resource-row').count()
    await adminDialog.locator('.ads-resource-row-main input[type="checkbox"]').first().check()
    await adminDialog.getByRole('button', { name: 'Xóa admin' }).click()
    const confirmDialog = page.getByRole('alertdialog', { name: 'Xóa admin?' })
    await expect(confirmDialog).toBeVisible()

    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(confirmDialog).toBeVisible()
    await expect(adminDialog.locator('.ads-resource-row')).toHaveCount(before)

    await confirmDialog.getByRole('button', { name: 'Hủy' }).click()
    await expect(confirmDialog).toBeHidden()
    await expect(adminDialog.locator('.ads-resource-row')).toHaveCount(before)
  })
})

test.describe('Page Round 1: status dot+text, Tên Page/Page ID links, renamed headers, SL Admin pill, Loại/Page live/Kiếm tiền presentation, Tải Page', () => {
  test.skip(({ isMobile }) => isMobile, 'desktop-only table interactions')

  test('Trạng thái renders dot+text only (no pill/badge) with the correct label for each of the 3 real states', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const liveRow = page.getByRole('row', { name: /Page Demo 01/ }).first() // index 0: live
    const hiddenRow = page.getByRole('row', { name: /Page Demo 02/ }).first() // index 1: hidden
    const dieRow = page.getByRole('row', { name: /Page Demo 03/ }).first() // index 2: die

    const liveStatus = liveRow.locator('.ads-page-status')
    const hiddenStatus = hiddenRow.locator('.ads-page-status')
    const dieStatus = dieRow.locator('.ads-page-status')
    await expect(liveStatus).toHaveText('Live')
    await expect(liveStatus).toHaveClass(/is-live/)
    await expect(hiddenStatus).toHaveText('Page ẩn')
    await expect(hiddenStatus).toHaveClass(/is-hidden/)
    await expect(dieStatus).toHaveText('Die')
    await expect(dieStatus).toHaveClass(/is-die/)
    // Distinct from the shared `.ads-pro-status` pill/badge convention used
    // elsewhere in this app — Page's status is dot+text only.
    await expect(liveStatus.locator('.ads-pro-status')).toHaveCount(0)
  })

  test('Tên Page and Page ID both open the row-specific real Fanpage URL (traced fb.com/{pageId}) in a new tab', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const row = page.getByRole('row', { name: /Page Demo 01/ }).first() // index 0 -> id 100000000001
    const nameLink = row.getByRole('link', { name: /Mở Page Demo 01 trên Facebook/ }).nth(0)
    const idLink = row.getByRole('link', { name: /Mở Page Demo 01 trên Facebook/ }).nth(1)
    await expect(nameLink).toHaveAttribute('href', 'https://fb.com/100000000001')
    await expect(idLink).toHaveAttribute('href', 'https://fb.com/100000000001')
    await expect(idLink).toHaveAttribute('target', '_blank')
  })

  test('Eye masks the Page ID cell display only — the Fanpage link href still uses the real Page ID', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    await page.getByRole('button', { name: 'Ẩn ID Page' }).click()
    const row = page.getByRole('row', { name: /Page Demo 01/ }).first()
    const idLink = row.getByRole('link', { name: /Mở Page Demo 01 trên Facebook/ }).nth(1)
    await expect(idLink).toHaveText('*'.repeat(15))
    await expect(idLink).toHaveAttribute('href', 'https://fb.com/100000000001')
    await expect(page.getByRole('button', { name: 'Hiện ID Page' })).toBeVisible()
  })

  test('Headers are renamed exactly: "Quyền", "SL Admin", "Lý do bị ban QC"', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const headers = page.locator('.ads-pro-table.is-page thead th')
    await expect(headers.filter({ hasText: 'Quyền' })).toHaveCount(1)
    await expect(headers.filter({ hasText: 'SL Admin' })).toHaveCount(1)
    await expect(headers.filter({ hasText: 'Lý do bị ban QC' })).toHaveCount(1)
  })

  test('Quyền shows a real per-Page permission/role name (Admin/Editor/Analyst), not a generic Có/Không', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const row = page.getByRole('row', { name: /Page Demo 01/ }).first()
    // "Quyền" is td index 8: checkbox(0), STT(1), Trạng thái(2), Tên
    // Page(3), Page ID(4), Tag(5), Page hủy đăng(6), Tiến trình(7), Quyền(8).
    const permissionCell = row.locator('td').nth(8)
    await expect(permissionCell).toHaveText(/^(Admin|Editor|Analyst)$/)
  })

  test('SL Admin renders as the shared non-interactive resource-count pill style (no fabricated Admin-detail click target)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const row = page.getByRole('row', { name: /Page Demo 01/ }).first() // index 0: admin = 1
    const pill = row.locator('.ads-resource-count-pill', { hasText: /^SL Admin: \d+$/ })
    await expect(pill).toHaveText('SL Admin: 1')
    await expect(pill).toHaveClass(/is-static/)
    await expect(pill.evaluate((el) => el.tagName)).resolves.toBe('SPAN')
  })

  test('Loại shows plain centered text (Cá nhân/Doanh nghiệp only) — no pill/badge/icon', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const rowCaNhan = page.getByRole('row', { name: /Page Demo 01/ }).first() // index 0
    const rowDoanhNghiep = page.getByRole('row', { name: /Page Demo 02/ }).first() // index 1
    const typeCellCaNhan = rowCaNhan.locator('.ads-page-type-cell')
    const typeCellDoanhNghiep = rowDoanhNghiep.locator('.ads-page-type-cell')
    await expect(typeCellCaNhan).toHaveText('Cá nhân')
    await expect(typeCellDoanhNghiep).toHaveText('Doanh nghiệp')
    await expect(typeCellCaNhan.locator('svg')).toHaveCount(0)
    await expect(typeCellCaNhan.locator('.ads-pro-status')).toHaveCount(0)
  })

  test('Page live and Kiếm tiền both render Đạt/Chưa đạt (presentation-only, shared boolean-eligibility renderer)', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const rowChuaDat = page.getByRole('row', { name: /Page Demo 01/ }).first() // index 0: live=false, monetization=false
    const rowDat = page.getByRole('row', { name: /Page Demo 02/ }).first() // index 1: live=true, monetization=true
    // td indices: checkbox(0) STT(1) Trạng thái(2) Tên Page(3) Page ID(4)
    // Tag(5) Page hủy đăng(6) Tiến trình(7) Quyền(8) ID BM(9) Tên BM(10)
    // SL Admin(11) Ngày tạo(12) Lượt thích(13) Người theo dõi(14) Loại(15)
    // Bài viết(16) Tick Page(17) Tiền tệ(18) Đủ điều kiện QC(19) Lý do bị
    // ban QC(20) Page Live(21) Kiếm tiền(22).
    const liveCellChuaDat = rowChuaDat.locator('td').nth(21)
    const monetizationCellChuaDat = rowChuaDat.locator('td').nth(22)
    const liveCellDat = rowDat.locator('td').nth(21)
    const monetizationCellDat = rowDat.locator('td').nth(22)
    await expect(liveCellChuaDat).toHaveText('Chưa đạt')
    await expect(monetizationCellChuaDat).toHaveText('Chưa đạt')
    await expect(liveCellDat).toHaveText('Đạt')
    await expect(monetizationCellDat).toHaveText('Đạt')
  })

  test('"Tải Page" modal: exact title/subtitle, 4 source options in order, per-mode ID-list textarea, cache defaults to Không thời hạn with the 30-min input disabled', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    await page.getByRole('button', { name: /^Tải Page/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal.locator('h2')).toHaveText('Cấu hình tải dữ liệu Page')
    await expect(modal.getByText('Chọn nguồn Page và nhóm dữ liệu cần thiết để lấy thông tin danh sách page.')).toBeVisible()

    const sourceSelect = modal.getByLabel('Nguồn tải dữ liệu')
    const optionLabels = await sourceSelect.locator('option').allTextContents()
    expect(optionLabels).toEqual(['Tải toàn bộ', 'Page của tôi', 'Theo ID BM', 'Theo ID Page'])

    // Modes 1-2: no textarea at all, straight to Cache section.
    await expect(modal.getByText('Danh sách ID BM')).toHaveCount(0)
    await expect(modal.getByText('Danh sách ID Page')).toHaveCount(0)
    await sourceSelect.selectOption('mine')
    await expect(modal.getByText('Danh sách ID BM')).toHaveCount(0)
    await expect(modal.getByText('Danh sách ID Page')).toHaveCount(0)

    // Mode 3: distinct "Danh sách ID BM" textarea.
    await sourceSelect.selectOption('by-bm-id')
    await expect(modal.getByText('Danh sách ID BM')).toBeVisible()
    await expect(modal.getByText('Danh sách ID Page')).toHaveCount(0)
    await expect(modal.getByPlaceholder('Nhập ID, mỗi ID cách nhau bằng dấu xuống dòng, tab hoặc dấu chấm phẩy')).toBeVisible()

    // Mode 4: distinct "Danh sách ID Page" textarea (never reused across modes).
    await sourceSelect.selectOption('by-page-id')
    await expect(modal.getByText('Danh sách ID Page')).toBeVisible()
    await expect(modal.getByText('Danh sách ID BM')).toHaveCount(0)

    // Cache section: "Không thời hạn" selected by default (Page's own
    // traced default, distinct from TKQC/BM's separate "custom" default).
    await expect(modal.getByText('Giữ lại dữ liệu đã tải để thao tác lần sau, không phải tải lại.')).toBeVisible()
    await expect(modal.getByRole('radio', { name: 'Không thời hạn' })).toBeChecked()
    await expect(modal.getByRole('radio', { name: 'Tùy chỉnh thời gian lưu' })).not.toBeChecked()
    await expect(modal.getByLabel('Thời gian lưu (phút)')).toBeDisabled()
    await expect(modal.getByLabel('Thời gian lưu (phút)')).toHaveValue('30')

    // Selecting "Tùy chỉnh" enables the 30-min input.
    await modal.getByRole('radio', { name: 'Tùy chỉnh thời gian lưu' }).click()
    await expect(modal.getByLabel('Thời gian lưu (phút)')).toBeEnabled()

    // Cache OFF disables both radio choices.
    await modal.getByLabel('Bật cache dữ liệu').uncheck({ force: true })
    await expect(modal.getByRole('radio', { name: 'Không thời hạn' })).toBeDisabled()
    await expect(modal.getByRole('radio', { name: 'Tùy chỉnh thời gian lưu' })).toBeDisabled()

    await expect(modal.getByRole('button', { name: 'Hủy' })).toBeVisible()
    await expect(modal.getByRole('button', { name: 'Bắt đầu tải' })).toBeVisible()
  })

  test('"Tải Page": backdrop click does NOT close and does NOT lose the entered source/ID-list/cache state', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    await page.getByRole('button', { name: /^Tải Page/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await expect(modal).toBeVisible()
    await modal.getByLabel('Nguồn tải dữ liệu').selectOption('by-page-id')
    await modal.getByLabel('Danh sách ID Page').fill('100000000001\n100000000002')
    await modal.getByRole('radio', { name: 'Tùy chỉnh thời gian lưu' }).click()

    await page.locator('.ads-advanced-filter-backdrop').click({ position: { x: 20, y: 20 } })
    await expect(modal).toBeVisible()
    await expect(modal.getByLabel('Nguồn tải dữ liệu')).toHaveValue('by-page-id')
    await expect(modal.getByLabel('Danh sách ID Page')).toHaveValue('100000000001\n100000000002')
    await expect(modal.getByRole('radio', { name: 'Tùy chỉnh thời gian lưu' })).toBeChecked()

    await modal.getByRole('button', { name: 'Hủy' }).click()
    await expect(modal).toBeHidden()
  })

  test('"Tải Page" idle → loading → Vừa xong, reusing the shared TKQC/BM load state machine', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    await page.getByRole('button', { name: /^Tải Page/ }).click()
    const modal = page.locator('.ads-tkqc-load-modal')
    await modal.getByRole('button', { name: 'Bắt đầu tải' }).click()
    const loadButton = page.getByRole('button', { name: 'Đang tải' })
    await expect(loadButton).toBeVisible()
    await expect(loadButton).toBeDisabled()
    await expect(page.getByRole('button', { name: /Vừa xong/ })).toBeVisible({ timeout: 3000 })
  })

  test('Frozen boundary shadow lands on "Tên Page" by default (production-traced status+name also frozen, not just STT), and moves when a further column is frozen', async ({ page }) => {
    await openAssetWorkspace(page)
    await page.getByRole('tab', { name: /^Page/ }).click()
    const nameTh = page.locator('.ads-pro-table.is-page thead th').nth(3)
    await expect(nameTh).toContainText('Tên Page')
    await expect(nameTh).toHaveClass(/is-frozen-boundary/)
    const sttTh = page.locator('.ads-pro-table.is-page thead th').nth(1)
    await expect(sttTh).not.toHaveClass(/is-frozen-boundary/)

    await page.getByRole('button', { name: 'Menu cột Page ID' }).click()
    await page.getByRole('menuitem', { name: 'Đóng băng cột' }).click()
    await expect(nameTh).not.toHaveClass(/is-frozen-boundary/)
    const idTh = page.locator('.ads-pro-table.is-page thead th').nth(4)
    await expect(idTh).toContainText('Page ID')
    await expect(idTh).toHaveClass(/is-frozen-boundary/)
  })
})
