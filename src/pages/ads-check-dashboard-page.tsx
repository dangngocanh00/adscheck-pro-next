import { m, useAppLanguage, t, tx } from '@/i18n'
import { useCallback, useEffect, useRef, useState } from 'react'
import { ArrowLeft, ArrowRight, Check, Play, ShieldCheck, Sparkles, Workflow } from 'lucide-react'
import { AdsCheckProductShell } from '@/features/ads-check/ads-check-product-shell'
import dashboardVideo1 from '../../assets/db1-no-logo.mp4'
import dashboardVideo2 from '../../assets/db2-no-logo.mp4'
import dashboardVideo3 from '../../assets/db3-no-logo.mp4'
import dashboardVideo4 from '../../assets/db4-no-logo.mp4'
import dashboardVideo5 from '../../assets/db5-no-logo.mp4'

const changes = [
  ['01', m("ui.a000e112e9"), m("ui.3e4a7fa6c6")],
  ['02', m("ui.a363b86333"), m("ui.b6cc273863")],
  ['03', m("ui.1dde6a47a8"), m("ui.499745852c")],
  ['04', m("ui.389bdedb9f"), m("ui.32c7b9b809")],
  ['05', m("ui.6856fa633e"), m("ui.8d10ae669a")],
  ['06', m("ui.9f8a06138b"), m("ui.42d7c7ba3b")],
  ['07', m("ui.efdf2ee95c"), m("ui.f2ab7ad20c")],
]

const dashboardPlaylist = [dashboardVideo1, dashboardVideo2, dashboardVideo3, dashboardVideo4, dashboardVideo5]
const playlistCrossfadeMs = 400

function DashboardVideoPlaylist({ label }: { label: string }) {
  const [activeLayer, setActiveLayer] = useState<0 | 1>(0)
  const [activeIndex, setActiveIndex] = useState(0)
  const [layerSources, setLayerSources] = useState<[number, number]>([0, 1])
  const [isPlaying, setIsPlaying] = useState(false)
  const videoRefs = useRef<Array<HTMLVideoElement | null>>([null, null])
  const activeLayerRef = useRef<0 | 1>(0)
  const activeIndexRef = useRef(0)
  const layerSourcesRef = useRef<[number, number]>([0, 1])
  const transitionTimerRef = useRef<number | null>(null)
  const failedSourcesRef = useRef(new Set<number>())

  useEffect(() => { activeLayerRef.current = activeLayer }, [activeLayer])
  useEffect(() => { activeIndexRef.current = activeIndex }, [activeIndex])
  useEffect(() => { layerSourcesRef.current = layerSources }, [layerSources])
  useEffect(() => () => {
    if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
    videoRefs.current.forEach((video) => video?.pause())
  }, [])

  const nextUsableIndex = useCallback((from: number) => {
    for (let offset = 1; offset <= dashboardPlaylist.length; offset += 1) {
      const candidate = (from + offset) % dashboardPlaylist.length
      if (!failedSourcesRef.current.has(candidate)) return candidate
    }
    return from
  }, [])

  const playActive = useCallback(async () => {
    const video = videoRefs.current[activeLayerRef.current]
    if (!video) return
    try {
      await video.play()
      setIsPlaying(true)
    } catch {
      setIsPlaying(false)
    }
  }, [])

  const advancePlaylist = useCallback(async () => {
    const currentLayer = activeLayerRef.current
    const nextLayer = currentLayer === 0 ? 1 : 0
    const nextIndex = layerSourcesRef.current[nextLayer]
    const nextVideo = videoRefs.current[nextLayer]
    if (!nextVideo) return

    try {
      nextVideo.currentTime = 0
      await nextVideo.play()
      activeLayerRef.current = nextLayer
      activeIndexRef.current = nextIndex
      setActiveLayer(nextLayer)
      setActiveIndex(nextIndex)
      setIsPlaying(true)

      if (transitionTimerRef.current !== null) window.clearTimeout(transitionTimerRef.current)
      transitionTimerRef.current = window.setTimeout(() => {
        const previousVideo = videoRefs.current[currentLayer]
        previousVideo?.pause()
        if (previousVideo) previousVideo.currentTime = 0
        const preloadIndex = nextUsableIndex(nextIndex)
        layerSourcesRef.current = currentLayer === 0 ? [preloadIndex, layerSourcesRef.current[1]] : [layerSourcesRef.current[0], preloadIndex]
        setLayerSources(layerSourcesRef.current)
        transitionTimerRef.current = null
      }, playlistCrossfadeMs)
    } catch {
      failedSourcesRef.current.add(nextIndex)
      const recoveryIndex = nextUsableIndex(nextIndex)
      layerSourcesRef.current = nextLayer === 0 ? [recoveryIndex, layerSourcesRef.current[1]] : [layerSourcesRef.current[0], recoveryIndex]
      setLayerSources(layerSourcesRef.current)
      setIsPlaying(false)
    }
  }, [nextUsableIndex])

  const handleVideoError = useCallback((layer: 0 | 1) => {
    const failedIndex = layerSourcesRef.current[layer]
    failedSourcesRef.current.add(failedIndex)
    if (layer === activeLayerRef.current) {
      void advancePlaylist()
      return
    }
    const recoveryIndex = nextUsableIndex(failedIndex)
    layerSourcesRef.current = layer === 0 ? [recoveryIndex, layerSourcesRef.current[1]] : [layerSourcesRef.current[0], recoveryIndex]
    setLayerSources(layerSourcesRef.current)
  }, [advancePlaylist, nextUsableIndex])

  useEffect(() => { void playActive() }, [activeLayer, layerSources, playActive])

  return <div className="ads-dashboard-video-playlist" role="group" aria-label={label}>
    {([0, 1] as const).map((layer) => <video
      key={layer}
      ref={(element) => { videoRefs.current[layer] = element }}
      className={`ads-dashboard-video-layer${activeLayer === layer ? ' is-active' : ''}`}
      src={dashboardPlaylist[layerSources[layer]]}
      muted
      playsInline
      autoPlay={layer === 0}
      preload="auto"
      aria-hidden={activeLayer !== layer}
      onPlay={() => { if (activeLayerRef.current === layer) setIsPlaying(true) }}
      onPause={() => { if (activeLayerRef.current === layer && !videoRefs.current[layer]?.ended) setIsPlaying(false) }}
      onEnded={() => { if (activeLayerRef.current === layer) void advancePlaylist() }}
      onError={() => handleVideoError(layer)}
    />)}
    {!isPlaying && <button className="ads-video-play" type="button" aria-label={label} onClick={() => void playActive()}><Play size={25} fill="currentColor" /></button>}
  </div>
}

export default function AdsCheckDashboardPage() {
  useAppLanguage();
  const [step, setStep] = useState<1 | 2>(1)
  const [activeChange, setActiveChange] = useState(0)
  const stepHeadingRef = useRef<HTMLHeadingElement>(null)
  const hasMountedRef = useRef(false)

  useEffect(() => { const previous = document.title; document.title = 'Dashboard · Ads Check'; return () => { document.title = previous } }, [])
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true
      return
    }
    stepHeadingRef.current?.focus()
  }, [step])

  return <AdsCheckProductShell activeNavigation="dashboard">
    <section className={`ads-dashboard-story is-step-${step}`} aria-labelledby="ads-dashboard-title">
      <div className="ads-dashboard-content-stage">
        <header className="ads-story-heading">
        <span className="ads-story-kicker"><Sparkles size={15} /> {" "}{t("ui.87acc36dce")}</span>
        <span className="ads-story-progress" aria-label={tx(m("ui.ffba87825a", { 0: step }))}>{step}/2</span>
      </header>

      {tx(step === 1 ? <div className="ads-story-intro">
        <div className="ads-story-copy">
          <h1 id="ads-dashboard-title" ref={stepHeadingRef} tabIndex={-1}>
            <span className="ads-story-title-line">{t("ui.704fd0ed3c")}</span>{' '}
            <span className="ads-story-title-line">{t("ui.535884bce0")}{" "}<em>{t("ui.1de18ef1f1")}</em></span>
          </h1>
          <p>{t("ui.5fc3512bea")}</p>
          <button type="button" onClick={() => setStep(2)}>{t("ui.4309fa68ad")}{" "}<ArrowRight size={17} /></button>
          <div className="ads-story-benefits" aria-label={t("ui.91bc0f34e5")}>
            <article><Workflow size={20} /><strong>{t("ui.6368f73923")}</strong><span>{t("ui.3b757899b0")}</span></article>
            <article><ShieldCheck size={20} /><strong>{t("ui.83612f5980")}</strong><span>{t("ui.3f4dd36c79")}</span></article>
            <article><Check size={20} /><strong>{t("ui.886cbff9d9")}</strong><span>{t("ui.f57ab9cd4f")}</span></article>
          </div>
        </div>
        <div className="ads-story-video">
          <DashboardVideoPlaylist label={t("ui.14b47133e2")} />
        </div>
      </div> : <div className="ads-story-changes">
        <div className="ads-story-changes-copy">
          <button className="ads-story-back" type="button" onClick={() => setStep(1)}><ArrowLeft size={17} /> {" "}{t("ui.8a09e03d20")}</button>
          <h1 id="ads-dashboard-title" ref={stepHeadingRef} tabIndex={-1}>{t("ui.82f50ce9bc")}</h1>
          <p>{t("ui.d457d03dc9")}</p>
        </div>
        <ol className="ads-change-list" aria-label={t("ui.f43a0f1e1e")} style={{ margin: 0, padding: 0, listStyle: 'none' }}>{tx(changes.map(([number, title, description], index) => <li key={number}>
          <button type="button" style={{ width: '100%' }} className={activeChange === index ? 'is-active' : ''} aria-pressed={activeChange === index} onClick={() => setActiveChange(index)}>
            <span>{number}</span><span><strong>{tx(title)}</strong><small>{tx(description)}</small></span><ArrowRight size={16} />
          </button>
        </li>))}</ol>
      </div>)}
      </div>
    </section>
  </AdsCheckProductShell>
}
