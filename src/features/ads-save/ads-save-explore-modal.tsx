import { useAppLanguage, m, t } from '@/i18n'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Megaphone, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { ExploreContent } from '@/features/ads-save/ads-save-explore-content'
import { exploreCategories, exploreScreenCount, type ExploreCategory, type ExploreTutorial } from '@/features/ads-save/ads-save-explore-data'
import { ExploreSidebar } from '@/features/ads-save/ads-save-explore-sidebar'
import { AdsCheckBrandMark } from '@/features/ads-check/ads-check-brand-mark'

type ExploreV8ModalProps = {
  open: boolean
  onClose: () => void
  onAction: (message: string) => void
  onOpenControlHub: () => void
  onChooseV8: () => void
  onExperienceV8: () => void
}

type ExploreScreen = { category: ExploreCategory; tutorial: ExploreTutorial | null }

export function ExploreV8Modal({
  open, onClose, onAction, onOpenControlHub, onChooseV8, onExperienceV8,
}: ExploreV8ModalProps) {
  useAppLanguage();
  const modalRef = useRef<HTMLElement>(null)
  const contentRef = useRef<HTMLElement>(null)
  const [query, setQuery] = useState('')
  const [activeCategoryId, setActiveCategoryId] = useState('overview')
  const [activeTutorialId, setActiveTutorialId] = useState<string | null>(null)
  const [overviewStep, setOverviewStep] = useState<1 | 2>(1)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())
  const [playing, setPlaying] = useState(false)
  useOverlayFocus(open, modalRef, onClose)

  const screens = useMemo(() => exploreCategories.flatMap<ExploreScreen>((category) => category.tutorials?.length
    ? category.tutorials.map((tutorial) => ({ category, tutorial }))
    : [{ category, tutorial: null }]), [])
  const activeCategory = exploreCategories.find((item) => item.id === activeCategoryId) ?? exploreCategories[0]
  const activeTutorial = activeCategory.tutorials?.find((item) => item.id === activeTutorialId) ?? null
  const currentScreenIndex = Math.max(0, screens.findIndex(({ category, tutorial }) =>
    category.id === activeCategory.id && (tutorial?.id ?? null) === activeTutorialId))

  useEffect(() => {
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
  }, [activeCategoryId, activeTutorialId])

  if (!open) return null

  const selectCategory = (category: ExploreCategory) => {
    const isSameCategory = activeCategoryId === category.id
    setPlaying(false)
    setOverviewStep(1)
    setActiveCategoryId(category.id)
    if (category.tutorials?.length) {
      setExpanded((current) => {
        const next = new Set(current)
        if (next.has(category.id) && isSameCategory) next.delete(category.id)
        else next.add(category.id)
        return next
      })
      if (!isSameCategory || !activeTutorialId) setActiveTutorialId(category.tutorials[0].id)
    } else setActiveTutorialId(null)
  }

  const selectTutorial = (category: ExploreCategory, tutorial: ExploreTutorial) => {
    setPlaying(false)
    setOverviewStep(1)
    setActiveCategoryId(category.id)
    setActiveTutorialId(tutorial.id)
    setExpanded((current) => new Set(current).add(category.id))
  }

  const showNext = () => {
    const next = screens[(currentScreenIndex + 1) % screens.length]
    setPlaying(false)
    setOverviewStep(1)
    setQuery('')
    setActiveCategoryId(next.category.id)
    setActiveTutorialId(next.tutorial?.id ?? null)
    if (next.tutorial) setExpanded((current) => new Set(current).add(next.category.id))
    onAction(m("ui.301760e313", { 0: next.tutorial?.label ?? next.category.label }))
  }

  const togglePlay = () => {
    setPlaying((value) => !value)
    onAction(m("ui.7eb061be05", { 0: activeTutorial?.label ?? activeCategory.label }))
    window.requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>('[data-video-frame]')?.focus())
  }

  const startOverview = () => {
    setOverviewStep(2)
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>('[data-overview-step-two]')?.focus())
  }

  const backOverview = () => {
    setOverviewStep(1)
    contentRef.current?.scrollTo({ top: 0, behavior: 'smooth' })
    window.requestAnimationFrame(() => contentRef.current?.querySelector<HTMLElement>('[data-overview-start]')?.focus())
  }

  return <div className="ads-modal-layer ads-library-layer" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose() }}>
    <section ref={modalRef} className="ads-explore-modal ads-library-modal" role="dialog" aria-modal="true" aria-labelledby="ads-explore-title">
      <header className="ads-library-header">
        <span className="ads-explore-brand"><AdsCheckBrandMark className="ads-explore-brand-logo" /><span>{t("ui.0a099528df")}<small>{t("ui.44a1737be5")}</small></span></span>
        <h2 id="ads-explore-title"><Megaphone size={23} fill="currentColor" />{t("ui.0d975dc9b2")}</h2>
        <button type="button" aria-label={t("ui.d2b73ab2ad")} data-autofocus onClick={onClose}><X size={17} /></button>
      </header>

      <div className="ads-explore-layout ads-library-layout">
        <ExploreSidebar
          categories={exploreCategories}
          activeCategoryId={activeCategory.id}
          activeTutorialId={activeTutorialId}
          expanded={expanded}
          query={query}
          onQuery={setQuery}
          onSelectCategory={selectCategory}
          onSelectTutorial={selectTutorial}
        />
        <section ref={contentRef} id="ads-explore-panel" className="ads-library-content" aria-label={t("ui.d5154a4dc7")}>
          <ExploreContent
            category={activeCategory}
            tutorial={activeTutorial}
            currentScreen={currentScreenIndex + 1}
            screenCount={exploreScreenCount}
            overviewStep={overviewStep}
            playing={playing}
            onPlay={togglePlay}
            onNext={showNext}
            onCta={activeCategory.id === 'control-hub' ? onOpenControlHub : onChooseV8}
            onOverviewStart={startOverview}
            onOverviewBack={backOverview}
            onChooseV8={onChooseV8}
            onExperienceV8={onExperienceV8}
          />
        </section>
      </div>
    </section>
  </div>
}
