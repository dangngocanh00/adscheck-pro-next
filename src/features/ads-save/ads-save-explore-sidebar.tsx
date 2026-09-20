import { useAppLanguage, t, tx } from '@/i18n'
import type { LucideIcon } from 'lucide-react'
import {
  BarChart3, ChevronDown, ChevronRight, CreditCard, Crown, FilePenLine,
  Grid2X2, Megaphone, Monitor, MousePointer2, ScanSearch, Search, Share2,
  Shield, Sparkles, UserRoundX,
} from 'lucide-react'
import type { ExploreCategory, ExploreTutorial } from '@/features/ads-save/ads-save-explore-data'

const categoryIcons: Record<string, LucideIcon> = {
  overview: Grid2X2,
  interface: Monitor,
  'control-hub': MousePointer2,
  vip: Crown,
  'super-share': Share2,
  'ads-check-pro': BarChart3,
  payment: CreditCard,
  'ads-manager': Megaphone,
  appeal: Shield,
  'change-info': FilePenLine,
  'hidden-admin': UserRoundX,
  'share-pixel': ScanSearch,
  other: Sparkles,
}

type ExploreSidebarProps = {
  categories: ExploreCategory[]
  activeCategoryId: string
  activeTutorialId: string | null
  expanded: Set<string>
  query: string
  onQuery: (value: string) => void
  onSelectCategory: (category: ExploreCategory) => void
  onSelectTutorial: (category: ExploreCategory, tutorial: ExploreTutorial) => void
}

export function ExploreSidebar({
  categories, activeCategoryId, activeTutorialId, expanded, query,
  onQuery, onSelectCategory, onSelectTutorial,
}: ExploreSidebarProps) {
  useAppLanguage();
  const normalizedQuery = query.trim().toLocaleLowerCase('vi')
  const visibleCategories = categories.flatMap((category) => {
    if (!normalizedQuery) return [{ category, tutorials: category.tutorials }]
    const parentMatches = category.label.toLocaleLowerCase('vi').includes(normalizedQuery)
    const tutorials = parentMatches
      ? category.tutorials
      : category.tutorials?.filter((item) => item.label.toLocaleLowerCase('vi').includes(normalizedQuery))
    return parentMatches || tutorials?.length ? [{ category, tutorials }] : []
  })

  return <nav className="ads-library-sidebar" aria-label={t("ui.c1bebc6381")}>
    <label className="ads-library-search">
      <Search size={19} />
      <span className="sr-only">{t("ui.9b0deff8a6")}</span>
      <input value={query} onChange={(event) => onQuery(event.target.value)} placeholder={t("ui.6671928637")} />
    </label>

    <div className="ads-library-menu">
      {visibleCategories.map(({ category, tutorials }) => {
        const Icon = categoryIcons[category.id]
        const isExpanded = Boolean(category.tutorials) && (expanded.has(category.id) || Boolean(normalizedQuery))
        const isCurrent = activeCategoryId === category.id
        return <div className="ads-library-group" key={category.id}>
          <button
            className={`ads-library-category${isCurrent ? ' is-current' : ''}${isExpanded ? ' is-expanded' : ''}`}
            type="button"
            aria-expanded={category.tutorials ? isExpanded : undefined}
            aria-controls={category.tutorials ? `ads-library-submenu-${category.id}` : undefined}
            aria-current={isCurrent && (!activeTutorialId || !isExpanded) ? 'page' : undefined}
            onClick={() => onSelectCategory(category)}
          >
            <Icon size={18} />
            <span>{tx(category.label)}</span>
            {category.tutorials
              ? <ChevronDown className="ads-library-chevron" size={16} />
              : <ChevronRight className="ads-library-chevron" size={16} />}
          </button>

          {tutorials && <div id={`ads-library-submenu-${category.id}`} className="ads-library-submenu" hidden={!isExpanded}>
            {tutorials.map((tutorial, index) => <button
              key={tutorial.id}
              className={activeTutorialId === tutorial.id ? 'is-current' : ''}
              type="button"
              aria-current={activeTutorialId === tutorial.id ? 'page' : undefined}
              onClick={() => onSelectTutorial(category, tutorial)}
            >
              <i>{String(index + 1).padStart(2, '0')}</i>
              <span>{tx(tutorial.label)}</span>
            </button>)}
          </div>}
        </div>
      })}
      {tx(visibleCategories.length === 0 && <p className="ads-library-empty">{t("ui.61b62c89e3")}</p>)}
    </div>
  </nav>
}
