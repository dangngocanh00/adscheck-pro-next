import { m, useAppLanguage, tx, t } from '@/i18n'
import { ArrowDown, ArrowUpRight, Check, ExternalLink, Link2, Play } from 'lucide-react'
import type { ExploreCategory, ExploreTutorial } from '@/features/ads-save/ads-save-explore-data'
import { AdsCheckBrandMark } from '@/features/ads-check/ads-check-brand-mark'

type ExploreContentProps = {
  category: ExploreCategory
  tutorial: ExploreTutorial | null
  currentScreen: number
  screenCount: number
  overviewStep: 1 | 2
  playing: boolean
  onPlay: () => void
  onNext: () => void
  onCta: () => void
  onOverviewStart: () => void
  onOverviewBack: () => void
  onChooseV8: () => void
  onExperienceV8: () => void
}

const v8Changes = [
  { title: m("ui.a000e112e9"), description: m("ui.3e4a7fa6c6"), before: 'Ads Check Pro', after: 'Advance Toolkit' },
  { title: m("ui.a363b86333"), description: m("ui.b6cc273863"), before: m("ui.ced8079d8e"), after: m("ui.19d75f2489") },
  { title: m("ui.1dde6a47a8"), description: m("ui.499745852c"), before: m("ui.14aa6d0b14"), after: m("ui.79beaecf85") },
  { title: m("ui.389bdedb9f"), description: m("ui.52791ed178"), before: 'Ads Save · Super Target', after: 'Ads Save · Super Target' },
  { title: m("ui.6856fa633e"), description: m("ui.946d80f209"), before: m("ui.3bd53ef7d3"), after: 'Control Hub' },
  { title: m("ui.9f8a06138b"), description: m("ui.42d7c7ba3b"), before: m("ui.1b62b89591"), after: m("ui.2e19f83117") },
  { title: m("ui.efdf2ee95c"), description: m("ui.f2ab7ad20c"), before: m("ui.29c0115a9a"), after: m("ui.98be504722") },
]

function TutorialPreview({ category, tutorial, playing, onPlay }: Pick<ExploreContentProps, 'category' | 'tutorial' | 'playing' | 'onPlay'>) {
  useAppLanguage();
  const videoId = tutorial?.videoId ?? category.videoId
  const title = tutorial
    ? m("ui.db3aa2ac7f", { 0: tutorial.label, 1: tutorial.asset })
    : category.videoTitle ?? m("ui.a41a8d65d7", { 0: category.label })
  const youtubeUrl = videoId
    ? `https://www.youtube.com/watch?v=${videoId}`
    : `https://www.youtube.com/results?search_query=${encodeURIComponent(title)}`
  const isOverview = category.kind === 'overview'

  return <div className={`ads-library-video${playing ? ' is-playing' : ''}`}>
    {tx(playing && videoId
      ? <iframe
          data-video-frame
          src={`https://www.youtube-nocookie.com/embed/${videoId}?autoplay=1&rel=0`}
          title={tx(title)}
          tabIndex={0}
          allow="autoplay; encrypted-media; picture-in-picture"
          allowFullScreen
        />
      : <>
          <div className="ads-library-video-heading">
            <span className="ads-library-video-avatar"><AdsCheckBrandMark className="ads-library-video-avatar-img" /></span>
            <span><strong>{t("ui.86c982594b")}</strong><small>{t("ui.84b93937aa")}</small></span>
          </div>
          <div className="ads-library-video-title"><b>{tx(tutorial ? tutorial.label : isOverview ? 'ADS CHECK' : 'ADSCHECK CONNECT')}</b><span>{tx(tutorial ? m("ui.ce1a3f3ad4", { 0: tutorial.asset }) : isOverview ? m("ui.0bfa09e539") : 'Ads Check')}</span></div>
          {tx(videoId
            ? <button className="ads-library-video-play" type="button" aria-label={tx(isOverview ? m("ui.e11229f60f") : m("ui.0b37162a48"))} onClick={onPlay}><Play size={30} fill="currentColor" /></button>
            : <a className="ads-library-video-play" href={youtubeUrl} target="_blank" rel="noopener noreferrer" aria-label={t("ui.b338a8bd91")}><Play size={30} fill="currentColor" /></a>)}
          <a className="ads-library-youtube-link" href={youtubeUrl} target="_blank" rel="noopener noreferrer"><Link2 size={18} /><span>{t("ui.c040ee8427")}</span><b>{t("ui.558865a16f")}</b><ExternalLink size={14} /></a>
        </>)}
  </div>
}

function OverviewContent({
  category, overviewStep, playing, onPlay, onOverviewStart, onOverviewBack, onChooseV8, onExperienceV8,
}: Pick<ExploreContentProps, 'category' | 'overviewStep' | 'playing' | 'onPlay' | 'onOverviewStart' | 'onOverviewBack' | 'onChooseV8' | 'onExperienceV8'>) {
  useAppLanguage();
  return <>
    {overviewStep === 1
      ? <button className="ads-library-start" data-overview-start type="button" onClick={onOverviewStart}>{t("ui.4309fa68ad")}{" "}<ArrowUpRight size={15} /></button>
      : <div className="ads-library-overview-actions">
          <button data-overview-step-two type="button" onClick={onOverviewBack}>{t("ui.8a09e03d20")}</button>
          <button type="button" onClick={onChooseV8}>{t("ui.d3ceb46441")}</button>
          <button type="button" onClick={onExperienceV8}>{t("ui.18211af3ef")}{" "}<ArrowUpRight size={15} /></button>
        </div>}
    <p className="ads-library-eyebrow">• {category.eyebrow}</p>
    <h3>{t("ui.785622aa20")}{" "}<em>{t("ui.1de18ef1f1")}</em></h3>
    <p className="ads-library-lead">{tx(category.description)}</p>
    <TutorialPreview category={category} tutorial={null} playing={playing} onPlay={onPlay} />
    <div className="ads-library-highlight-grid">
      {category.highlights?.map((item) => <article key={item}><Check size={17} /><span>{tx(item)}</span></article>)}
    </div>
    {tx(overviewStep === 2 && <section className="ads-library-changes" aria-labelledby="ads-library-changes-title">
      <p className="ads-library-eyebrow">{t("ui.aafc735b98")}</p>
      <h4 id="ads-library-changes-title">{t("ui.82f50ce9bc")}</h4>
      <p>{t("ui.d457d03dc9")}</p>
      <div>{tx(v8Changes.map(({ title, description, before, after }, index) => <article key={title}>
        <b>{String(index + 1).padStart(2, '0')}</b>
        <span className="ads-library-change-copy"><strong>{tx(title)}</strong><small>{tx(description)}</small></span>
        <span className="ads-library-change-compare"><small>{t("ui.5e5f100778")}</small><strong>{before}</strong></span>
        <span className="ads-library-change-compare is-v8"><small>{t("ui.d77bf3afc0")}</small><strong>{after}</strong></span>
      </article>))}</div>
    </section>)}
  </>
}

function ArticleContent({ category, playing, onPlay, onCta }: Pick<ExploreContentProps, 'category' | 'playing' | 'onPlay' | 'onCta'>) {
  useAppLanguage();
  return <>
    <TutorialPreview category={category} tutorial={null} playing={playing} onPlay={onPlay} />
    <p className="ads-library-eyebrow">• {category.eyebrow}</p>
    <h3>{tx(category.title)}</h3>
    <p className="ads-library-lead">{tx(category.description)}</p>
    <div className="ads-library-feature-stack">
      {category.highlights?.map((item, index) => <article key={item}>
        <b>{String(index + 1).padStart(2, '0')}</b>
        <span><strong>{tx(item)}</strong><small>{t("ui.c7afd991f5")}</small></span>
      </article>)}
    </div>
    {(category.id === 'control-hub' || category.id === 'vip') && <button className="ads-library-discover" type="button" onClick={onCta}>{t("ui.836c4c6f45")}{" "}<ArrowUpRight size={16} /></button>}
  </>
}

export function ExploreContent({
  category, tutorial, currentScreen, screenCount, overviewStep, playing, onPlay, onNext, onCta,
  onOverviewStart, onOverviewBack, onChooseV8, onExperienceV8,
}: ExploreContentProps) {
  useAppLanguage();
  return <>
    <div className="ads-library-content-top" role="status" aria-live="polite" aria-atomic="true">
      <span>{tx(category.label)}{tx(tutorial ? ` / ${tutorial.label}` : '')}</span>
      <b>{category.kind === 'overview' ? `${overviewStep}/2` : `${currentScreen}/${screenCount}`}</b>
    </div>

    {tx(tutorial
      ? <div className="ads-library-tutorial-screen">
          <TutorialPreview category={category} tutorial={tutorial} playing={playing} onPlay={onPlay} />
          <p className="ads-library-eyebrow">• {tx(category.label)}</p>
          <h3>{t("ui.e7c426392b")}{" "}<em>{tx(tutorial.label)}</em></h3>
          <p className="ads-library-lead">{t("ui.788a95ef6f")}{" "}{tutorial.asset}{t("ui.946fef26a6")}</p>
        </div>
      : category.kind === 'overview'
        ? <OverviewContent category={category} overviewStep={overviewStep} playing={playing} onPlay={onPlay} onOverviewStart={onOverviewStart} onOverviewBack={onOverviewBack} onChooseV8={onChooseV8} onExperienceV8={onExperienceV8} />
        : <ArticleContent category={category} playing={playing} onPlay={onPlay} onCta={onCta} />)}

    {category.id !== 'other' && category.kind !== 'overview' && <footer className="ads-library-content-footer">
      <button type="button" onClick={onNext}>{t("ui.a9515c6f27")}{" "}<ArrowDown size={17} /></button>
    </footer>}
  </>
}
