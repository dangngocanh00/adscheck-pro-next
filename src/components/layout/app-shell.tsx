import { useAppLanguage, t } from '@/i18n'
import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAppStore } from '@/store/app-store'
import { Header } from './header'
import { Sidebar } from './sidebar'

export function AppShell() {
  useAppLanguage();
  const { theme, toast, clearToast } = useAppStore()

  useEffect(() => {
    document.documentElement.dataset.theme = theme
  }, [theme])

  return (
    <div data-theme={theme}>
      <a className="skip-link" href="#main-content">{t("ui.67ca89ee82")}</a>
      <div className="app-layout">
        <Sidebar />
        <div className="main-column">
          <Header />
          <main id="main-content" className="page-main" tabIndex={-1}>
            <Outlet />
          </main>
        </div>
      </div>
      <div className="app-live-region" aria-live="polite" aria-atomic="true">
        {toast ? <button className="global-toast" onClick={clearToast}>{toast}</button> : null}
      </div>
    </div>
  )
}
