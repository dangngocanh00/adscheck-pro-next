// Page Round 1 Part #2 — traced EXACTLY from production's own PageTable
// component (references/remotes/adaccounts/436.e5c83aa9.js): the row's
// name/ID click handler is `function X(e){ open(e.link||\`https://fb.com/${e.pageId}\`) }`
// — i.e. a real Fanpage URL keyed on the row's own real pageId (the
// `e.link` override, when a row carries one, is not modeled by this demo
// data set, so the fallback template is what every demo row uses).
export function buildFanpageUrl(pageId: string): string | null {
  const trimmed = pageId.trim()
  if (!trimmed) return null
  return `https://fb.com/${encodeURIComponent(trimmed)}`
}
