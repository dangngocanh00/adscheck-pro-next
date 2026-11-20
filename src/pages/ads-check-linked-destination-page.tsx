import { useAppLanguage, t, tx } from '@/i18n'
import { useEffect, useRef } from 'react'
import { ArrowLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

type AdsCheckLinkedDestinationPageProps = {
  title: string
}

export default function AdsCheckLinkedDestinationPage({ title }: AdsCheckLinkedDestinationPageProps) {
  useAppLanguage();
  const mainRef = useRef<HTMLElement>(null)
  useEffect(() => {
    const previousTitle = document.title
    document.title = `${title} | Toolmeta`
    const focusFrame = window.requestAnimationFrame(() => mainRef.current?.focus())
    return () => { window.cancelAnimationFrame(focusFrame); document.title = previousTitle }
  }, [title])

  return <div className="ads-linked-destination-page">
    <main ref={mainRef} tabIndex={-1}>
      <span>{t("ui.0a099528df")}</span>
      <h1>{tx(title)}</h1>
      <p>{t("ui.afd5e27aa8")}</p>
      <Link to="/app/adscheck-pro/adaccounts"><ArrowLeft size={16} />{t("ui.ef722dfedf")}</Link>
    </main>
  </div>
}
