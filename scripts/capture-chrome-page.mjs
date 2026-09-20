import { mkdir, writeFile } from 'node:fs/promises'
import { resolve } from 'node:path'
import { chromium } from 'playwright'

const cdpUrl = process.env.CDP_URL ?? 'http://127.0.0.1:9222'
const targetUrl = process.argv[2] ?? 'https://adscheck.smit.vn/app/ads-save'
const outputDirectory = resolve(process.argv[3] ?? 'artifacts/chrome-capture')

const browser = await chromium.connectOverCDP(cdpUrl)

try {
  const context = browser.contexts()[0]
  if (!context) throw new Error(`No Chrome context is available at ${cdpUrl}`)

  const existingPage = context.pages().find((candidate) => candidate.url().startsWith(targetUrl))
  const page = existingPage ?? await context.newPage()
  if (!existingPage) await page.goto(targetUrl, { waitUntil: 'domcontentloaded' })

  await page.waitForLoadState('domcontentloaded')
  await mkdir(outputDirectory, { recursive: true })

  const capture = await page.evaluate(() => {
    const visibleElements = Array.from(document.querySelectorAll<HTMLElement>('a, button, input, select, textarea, [role], [tabindex]'))
      .filter((element) => {
        const rectangle = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return rectangle.width > 0 && rectangle.height > 0 && style.visibility !== 'hidden' && style.display !== 'none'
      })
      .map((element) => {
        const rectangle = element.getBoundingClientRect()
        const style = window.getComputedStyle(element)
        return {
          tag: element.tagName.toLowerCase(),
          role: element.getAttribute('role'),
          text: element.innerText.trim().replace(/\s+/g, ' ').slice(0, 240),
          ariaLabel: element.getAttribute('aria-label'),
          href: element instanceof HTMLAnchorElement ? element.href : null,
          disabled: element instanceof HTMLButtonElement || element instanceof HTMLInputElement ? element.disabled : false,
          rectangle: { x: rectangle.x, y: rectangle.y, width: rectangle.width, height: rectangle.height },
          style: {
            color: style.color,
            background: style.background,
            border: style.border,
            borderRadius: style.borderRadius,
            boxShadow: style.boxShadow,
            font: style.font,
            padding: style.padding,
          },
        }
      })

    const rootStyle = window.getComputedStyle(document.documentElement)
    const designTokens = Array.from(rootStyle)
      .filter((property) => property.startsWith('--'))
      .reduce((tokens, property) => {
        tokens[property] = rootStyle.getPropertyValue(property).trim()
        return tokens
      }, {})

    return {
      capturedAt: new Date().toISOString(),
      url: window.location.href,
      title: document.title,
      viewport: { width: window.innerWidth, height: window.innerHeight, devicePixelRatio: window.devicePixelRatio },
      designTokens,
      visibleElements,
    }
  })

  await Promise.all([
    page.screenshot({ path: resolve(outputDirectory, 'page.png'), fullPage: true }),
    writeFile(resolve(outputDirectory, 'page.html'), await page.content(), 'utf8'),
    writeFile(resolve(outputDirectory, 'ui-inventory.json'), `${JSON.stringify(capture, null, 2)}\n`, 'utf8'),
  ])

  console.log(`Captured ${capture.visibleElements.length} visible controls from ${capture.url}`)
  console.log(`Artifacts: ${outputDirectory}`)
} finally {
  await browser.close()
}
