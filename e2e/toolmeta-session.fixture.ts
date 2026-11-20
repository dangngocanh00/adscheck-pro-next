import { test as base } from '@playwright/test'

export { expect, type Locator, type Page } from '@playwright/test'

export const test = base.extend({
  page: async ({ page }, runTest) => {
    await page.addInitScript(() => {
      if (!sessionStorage.getItem('toolmeta-e2e-initialized')) {
        sessionStorage.setItem('toolmeta-e2e-initialized', 'true')
        sessionStorage.setItem('toolmeta-demo-email', 'preview@example.com')
      }
    })
    await runTest(page)
  },
})
