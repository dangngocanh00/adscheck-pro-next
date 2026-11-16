import { expect, test } from '@playwright/test'

const modules = [
  ['/app/adscheck-pro/adaccounts', ['top-right', 'bottom-right', 'bottom-left', 'b']],
  ['/app/ads-save', ['top-right', 'bottom-right', 'top-left', 'bottom-left']],
  ['/app/extended-payment', ['top-right', 'bottom-right', 'top-left', 'bottom-left']],
  ['/app/billing/payment', ['top-right', 'bottom-right', 'bottom-left', 'd']],
  ['/app/notification', ['top-right', 'bottom-right', 'top-left', 'bottom-left']],
  ['/app/account', ['top-right', 'bottom-right', 'top-left', 'bottom-left']],
] as const

for (const [route, curves] of modules) test(`shared neon: ${route}`, async ({ page }, info) => {
  test.skip(info.project.name !== 'desktop-chrome', 'Desktop curve matrix.')
  await page.addInitScript(() => {
    sessionStorage.setItem('ads-check-session-version', 'v8')
    sessionStorage.setItem('ads-check-selected-login-session', 'pro')
    sessionStorage.setItem('ads-check-extension-ready', 'true')
  })
  const errors: string[] = []
  page.on('pageerror', error => errors.push(error.message))
  await page.goto(route, { waitUntil: 'domcontentloaded' })
  await expect(page.locator('.ads-curve-neon:not(.is-inner)')).toHaveCount(curves.length)
  await expect(page.locator('.ads-curve-neon.is-c, .has-curve-c, .has-rail-reservation')).toHaveCount(0)
  if (route.includes('adaccounts')) await page.locator('.ads-notif-required-close').click()
  for (const [width, height] of [[1366, 768], [1536, 864], [1600, 900], [1720, 960], [1920, 1080], [2560, 1440], [3440, 1440]]) {
    await page.setViewportSize({ width, height })
    const corners = curves.filter(curve => curve.includes('-'))
    await expect(page.locator('.ads-content-corner-accents .ads-curve-neon')).toHaveCount(corners.length)
    for (const corner of corners) {
      const outer = page.locator(`.ads-pro-workspace-shape .is-${corner} .ads-curve-neon-runner`).first()
      const inner = page.locator(`.ads-content-corner-accents .is-${corner} .ads-curve-neon-runner`).first()
      const styles = await Promise.all([outer, inner].map(locator => locator.evaluate(el => {
        const css = getComputedStyle(el)
        return { duration: css.animationDuration, delay: parseFloat(css.animationDelay), direction: css.animationDirection }
      })))
      expect(styles[1].delay - styles[0].delay).toBeCloseTo(.45, 5)
      expect(styles[1].duration).toBe(styles[0].duration)
      expect(styles[1].direction).toBe(styles[0].direction)
      await expect(inner).toBeVisible()
    }
    await expect.poll(() => page.evaluate(() => {
      const overlay = document.querySelector('.ads-content-corner-accents')!
      const content = document.querySelector('.ads-main-panel, .ads-product-main')!
      const a = overlay.getBoundingClientRect(), b = content.getBoundingClientRect()
      return [a.left-b.left, a.top-b.top, a.width-b.width, a.height-b.height].map(value => Math.round(value * 10) / 10)
    })).toEqual([0, 0, 0, 0])
    await expect(page.locator('.ads-content-corner-accents')).toHaveCSS('pointer-events', 'none')
    for (const curve of curves) {
      const layer = page.locator(`.ads-curve-neon.is-${curve}:not(.is-inner)`)
      const base = layer.locator('.ads-curve-neon-base')
      await expect(base).toBeVisible()
      const runner = layer.locator('.ads-curve-neon-runner').first()
      await expect(runner).toHaveAttribute('pathLength', '100')
      const fourCorners = curves.some(value => value === 'top-left')
      if (fourCorners || curve === 'bottom-left') {
        const motion = await runner.evaluate(el => {
          const path = el as SVGPathElement
          const style = getComputedStyle(path)
          const reverse = style.animationDirection === 'reverse'
          const length = path.getTotalLength()
          const start = path.getPointAtLength(reverse ? length : 0)
          const end = path.getPointAtLength(reverse ? 0 : length)
          const animation = path.getAnimations()[0]
          const previousTime = animation.currentTime
          animation.pause()
          const delayMs = Math.max(0, Number.parseFloat(style.animationDelay) * 1000)
          animation.currentTime = delayMs + 1000
          const before = Number.parseFloat(getComputedStyle(path).strokeDashoffset)
          animation.currentTime = delayMs + 1200
          const after = Number.parseFloat(getComputedStyle(path).strokeDashoffset)
          animation.currentTime = previousTime
          animation.play()
          return { dx: end.x - start.x, dy: end.y - start.y, offsetChange: after - before, duration: style.animationDuration, delay: style.animationDelay }
        })
        const expected = {
          'top-left': [1, -1, 1, '0s'],
          'top-right': [1, 1, -1, '0.4s'],
          'bottom-right': [-1, 1, -1, '0.8s'],
          'bottom-left': [-1, -1, -1, fourCorners ? '1.2s' : '-3.95s'],
        }[curve]
        expect(expected).toBeDefined()
        expect([Math.sign(motion.dx), Math.sign(motion.dy), Math.sign(motion.offsetChange), motion.delay]).toEqual(expected)
        expect(motion.duration).toBe(fourCorners ? '3.6s' : '4.2s')
      }
      // All strokes share the live contour during resize; no approximate path.
      // Read atomically: ResizeObserver may update the entire contour between calls.
      const paths = await layer.locator('path').evaluateAll(paths => paths.map(path => path.getAttribute('d')))
      expect(new Set(paths).size).toBe(1)
      const before = await runner.evaluate(el => getComputedStyle(el).strokeDashoffset)
      await expect.poll(() => runner.evaluate(el => getComputedStyle(el).strokeDashoffset)).not.toBe(before)
    }
    const ids = await page.locator('svg [id]').evaluateAll(elements => elements.map(el => el.id))
    expect(new Set(ids).size).toBe(ids.length)
    await page.screenshot({ path: info.outputPath(`${width}.png`) })
  }
  await page.emulateMedia({ reducedMotion: 'reduce' })
  for (const inner of await page.locator('.ads-content-corner-accents .ads-curve-neon').all()) {
    await expect(inner.locator('.ads-curve-neon-pulse')).toBeHidden()
    await expect(inner.locator('.ads-curve-neon-base')).toBeVisible()
  }
  for (const curve of curves) {
    const layer = page.locator(`.ads-curve-neon.is-${curve}:not(.is-inner)`)
    await expect(layer.locator('.ads-curve-neon-pulse')).toBeHidden()
    await expect(layer.locator('.ads-curve-neon-base')).toBeVisible()
    await expect(layer.locator('.ads-curve-neon-glow')).toBeVisible()
    expect(await layer.locator('.ads-curve-neon-runner').first().evaluate(el => getComputedStyle(el).animationName)).toBe('none')
  }
  expect(errors).toEqual([])
})
