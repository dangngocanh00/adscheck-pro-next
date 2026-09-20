// BM Round 1 Part 14 — traced production EXACTLY (references/remotes/
// adaccounts/436.e5c83aa9.js, same module family as the TKQC Meta URL
// builders): BM's `BmTable` component wires BOTH the Tên BM and ID BM cell
// onto the SAME destination, via the row's own real `bmId` (never a
// generic BM home page):
//   https://business.facebook.com/settings/people/?business_id=<bmId>
// (the Business Manager's own "People" settings tab). No extra query
// params (nav_ref/asset_id/etc.) exist for this one, unlike Billing Hub.
export function buildBmPeopleSettingsUrl(bmId: string): string | null {
  const trimmed = bmId.trim()
  if (!trimmed) return null
  return `https://business.facebook.com/settings/people/?business_id=${encodeURIComponent(trimmed)}`
}
