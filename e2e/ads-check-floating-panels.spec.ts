import { expect, test, type Locator } from './toolmeta-session.fixture'

test('floating panels keep table width, independent toggles, gaps and per-asset state', async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== 'desktop-chrome', 'Desktop matrix includes its own narrow-container fallback check.')
  test.setTimeout(120_000)
  const errors: string[] = []
  page.on('pageerror', (error) => errors.push(error.message))
  await page.addInitScript(() => {
    sessionStorage.setItem('ads-check-session-version', 'v8')
    sessionStorage.setItem('ads-check-selected-login-session', 'pro')
    sessionStorage.setItem('ads-check-extension-ready', 'true')
  })
  await page.goto('/app/adscheck-pro/adaccounts', { waitUntil: 'domcontentloaded' })
  await page.locator('.ads-notif-required-close').click()
  await expect(page.locator('.ads-pro-panel-launchers')).toHaveCount(0)
  await page.getByRole('tab', { name: /TKQC/ }).click()
  const library = page.locator('#ads-pro-function-library')
  const process = page.locator('#ads-pro-workflow')
  const libraryButton = page.locator('.ads-pro-panel-launcher.is-library')
  const processButton = page.locator('.ads-pro-panel-launcher.is-process')
  const table = page.locator('.ads-pro-main-region')
  const checkRestingAnchor = async () => {
    const help = (await page.locator('.ads-control-hub-help-fab').boundingBox())!
    const first = (await libraryButton.boundingBox())!
    const second = (await processButton.boundingBox())!
    expect(first.x + first.width / 2).toBeCloseTo(help.x + help.width / 2, 1)
    expect(second.x + second.width / 2).toBeCloseTo(help.x + help.width / 2, 1)
    expect(help.y - second.y - second.height).toBeCloseTo(10, 1)
    expect(second.y - first.y - first.height).toBeCloseTo(6, 1)
  }
  const width = async () => (await table.boundingBox())!.width
  const checkRightAnchor = async (panel: Locator) => {
    const workspace = (await page.locator('.ads-pro-workspace').boundingBox())!
    const box = (await panel.boundingBox())!
    expect(workspace.x + workspace.width - box.x - box.width).toBeCloseTo(8, 1)
    expect(box.x).toBeGreaterThanOrEqual(workspace.x)
  }

  for (const viewportWidth of [1366, 1536, 1600, 1720, 1920, 2560, 3440]) {
    await page.setViewportSize({ width: viewportWidth, height: viewportWidth === 1366 ? 768 : 1080 })
    await expect(libraryButton).toBeVisible()
    await expect(processButton).toBeVisible()
    await checkRestingAnchor()
    await expect(page.locator('.ads-pro-workspace-shape')).toHaveAttribute('data-curve-c-size', 'none')
    await expect(page.locator('.ads-pro-workspace-shape')).not.toHaveClass(/has-rail-reservation/)
    await page.screenshot({ path: testInfo.outputPath('closed-' + viewportWidth + '.png') })
    const baseline = await width()
    await libraryButton.click()
    await expect(library).toBeVisible()
    await expect(process).toBeHidden()
    await checkRightAnchor(library)
    expect(await width()).toBeCloseTo(baseline, 1)
    await libraryButton.click()
    await processButton.click()
    await expect(library).toBeHidden()
    await expect(process).toBeVisible()
    await checkRightAnchor(process)
    expect(await width()).toBeCloseTo(baseline, 1)
    await libraryButton.click()
    const a = (await library.boundingBox())!
    const b = (await process.boundingBox())!
    await checkRightAnchor(process)
    const launcher = (await libraryButton.boundingBox())!
    expect(a.x - launcher.x - launcher.width).toBeCloseTo(6, 1)
    expect(b.x - a.x - a.width).toBeCloseTo(6, 1)
    expect(b.x + b.width).toBeLessThan(viewportWidth)
    expect(a.y).toBeGreaterThan(0)
    expect(b.y + b.height).toBeLessThan(page.viewportSize()!.height)
    expect(await width()).toBeCloseTo(baseline, 1)
    await page.screenshot({ path: testInfo.outputPath(`both-${viewportWidth}.png`) })
    await library.locator('.ads-panel-heading > button').last().click()
    await expect(process).toBeVisible()
    await process.locator('.ads-workflow-close').click()
    await expect(process).toBeHidden()
    await checkRestingAnchor()
    console.log(`PASS ${viewportWidth}: table ${baseline}px, shared gap 6px`)
  }

  await page.setViewportSize({ width: 1536, height: 960 })
  await libraryButton.click()
  await library.locator('.ads-function-row').first().click()
  await expect(process).toBeVisible()
  await expect(process.locator('.ads-workflow-step')).toHaveCount(1)
  const query = library.locator('input')
  await query.fill('Share')
  await process.locator('.ads-runner-pill input').first().fill('3')
  for (const asset of ['BM', 'Page', 'Pixel', 'VIA', 'TKQC']) {
    await page.getByRole('tab', { name: new RegExp(asset) }).click()
    if (asset !== 'VIA') {
      await expect(library).toBeVisible()
      await expect(process).toBeVisible()
    } else {
      await expect(page.locator('.ads-pro-panel-launchers')).toHaveCount(0)
    }
  }
  await expect(query).toHaveValue('Share')
  await expect(process.locator('.ads-workflow-step')).toHaveCount(1)
  await expect(process.locator('.ads-runner-pill input').first()).toHaveValue('3')
  await query.fill('')
  await process.locator('.ads-workflow-actions button').first().click()
  await process.locator('.ads-template-name-field input').fill('Floating panel verification')
  await process.locator('.ads-template-name-actions .is-primary').click()
  await expect(process.locator('.ads-template-row-load')).toContainText('Floating panel verification')
  await process.locator('.ads-template-panel-close').click()
  await library.locator('.ads-function-guide-button').first().click()
  await expect(page.locator('.ads-pro-floating-panels [aria-modal="true"]')).toBeVisible()
  await page.locator('.ads-pro-floating-panels .ads-pro-local-dialog-close').click()
  await query.focus()
  await page.keyboard.press('Escape')
  await expect(library).toBeHidden()
  await expect(process).toBeVisible()
  await expect(libraryButton).toBeFocused()
  await libraryButton.click()
  await page.screenshot({ path: testInfo.outputPath('populated-desktop.png') })

  await page.setViewportSize({ width: 700, height: 900 })
  await expect(library).toBeVisible()
  await expect(process).toBeVisible()
  const a = (await library.boundingBox())!
  const b = (await process.boundingBox())!
  expect(b.y - a.y - a.height).toBeCloseTo(6, 1)
  expect(b.x + b.width).toBeLessThan(700)
  await checkRightAnchor(library)
  await checkRightAnchor(process)
  await expect(process.locator('.ads-workflow-actions')).toBeInViewport()
  await page.screenshot({ path: testInfo.outputPath('stacked-700.png') })
  expect(errors).toEqual([])
})
