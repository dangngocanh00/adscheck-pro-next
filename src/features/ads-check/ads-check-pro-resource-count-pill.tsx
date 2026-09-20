import { useAppLanguage, tx } from '@/i18n'
import type { ReactNode } from 'react'

type ResourceCountPillProps = {
  count: number
  // Page Round 1 Part #4 — optional: Page's own "SL Admin" has no
  // underlying per-page admin LIST in this data model (unlike BM's real
  // `row.admins[]`), and no production evidence of a click-to-detail
  // interaction for that column either — so it renders the SAME shared
  // pill STYLE without being a fake-interactive control. Omitting
  // `onClick` renders a plain (non-button) span instead of fabricating a
  // click target with nothing real behind it.
  onClick?: () => void
  children: ReactNode
}

// Shared Resource/Modal UX correction — ONE system style for every
// resource-count cell (SL đối tác, SL Admin [BM + Page], SL Ad Account, SL
// Page, SL IG, TKQC's own admin pill, and any future Page/Pixel resource
// count). Reference visual is the pre-existing "SL đối tác" pill (thin
// green border, white background, green text, compact capsule, hugs
// content) — NOT the brief floating/glowing white pill SL Admin was given
// in an earlier pass, which this replaces. Shared STYLE, not shared TEXT:
// each caller supplies its own column-specific label/content as children.
export function ResourceCountPill({ count, onClick, children }: ResourceCountPillProps) {
  useAppLanguage();
  if (!onClick) return <span className="ads-resource-count-pill is-static">{tx(children)}</span>
  return <button type="button" className="ads-resource-count-pill" disabled={count === 0} onClick={onClick}>{tx(children)}</button>
}
