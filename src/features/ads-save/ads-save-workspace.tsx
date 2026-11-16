import { useAppLanguage, t } from '@/i18n'
import type { FC } from 'react'
import { BarChart3, Bookmark, Plus } from 'lucide-react'

type AdsSaveWorkspaceProps = {
  onCreateConfig: () => void
}

// Ads Save Empty State Round 1 — renders INSIDE the existing shared shell
// (`.ads-save-app` / `.ads-workspace` / `<main className="ads-main-panel">`
// in ads-save-page.tsx), the same shell Ads Check Pro already uses. No
// second independent app shell is created here; this is only the content
// slot for the `variant="ads-save"` branch, which previously always fell
// through to the generic extension-install gate regardless of whether a
// configuration existed.
//
// Illustration note (see the batch report): no dedicated Ads Save
// empty-state image/SVG asset exists anywhere in this project (checked
// `public/`, `src/features/ads-save/*`, and every "*illustration*"/
// "*empty*" hit in the codebase — the only existing "EmptyState" is a
// generic Tailwind/shadcn component, which
// does not match Ads Save's own hand-rolled CSS visual language at all).
// Built here from the SAME lightweight technique already used elsewhere
// in this app (a lucide icon + small CSS-drawn accent dots/badge, e.g.
// the brand-mark/tag-chip dot pattern), not a generated or stock image.
// Extracted so the "Configured state" round's Add-Configuration card can
// reuse the EXACT same illustration (still no dedicated asset exists — see
// the note above) instead of duplicating/re-generating one.
export const AdsSaveIllustration: FC = () => { useAppLanguage(); return (
  <div className="ads-save-empty-illustration" aria-hidden="true">
    <i className="ads-save-empty-dot is-a" />
    <i className="ads-save-empty-dot is-b" />
    <i className="ads-save-empty-dot is-c" />
    <span className="ads-save-empty-illustration-core"><BarChart3 size={30} /></span>
    <span className="ads-save-empty-illustration-badge"><Plus size={13} /></span>
  </div>
) }

export const AdsSaveWorkspace: FC<AdsSaveWorkspaceProps> = ({ onCreateConfig }) => { useAppLanguage(); return (
  <div className="ads-save-workspace-panel">
    <header className="ads-save-workspace-header">
      <span className="ads-save-workspace-header-icon" aria-hidden="true"><Bookmark size={16} /></span>
      <h1>{t("ui.49758c4625")}</h1>
    </header>
    <div className="ads-save-empty-state">
      <AdsSaveIllustration />
      <h2>{t("ui.8943e53149")}</h2>
      <p>{t("ui.d5c1169c5e")}</p>
      <button type="button" className="ads-save-empty-cta" onClick={onCreateConfig}>{t("ui.ae3f2f47f7")}</button>
    </div>
  </div>
) }

export default AdsSaveWorkspace
