import type { LucideIcon } from 'lucide-react'
import type { ReactNode } from 'react'

export function ProfileSection({ title, description, action, children }: { title: string; description?: string; action?: ReactNode; children: ReactNode }) {
  return (
    <section className="profile-data-section">
      <header>
        <div><h3>{title}</h3>{description ? <p>{description}</p> : null}</div>
        {action}
      </header>
      {children}
    </section>
  )
}

export function ProfileInfo({ icon: Icon, label, value, note }: { icon: LucideIcon; label: string; value: ReactNode; note?: string }) {
  return (
    <div className="profile-info-item">
      <span><Icon size={15} aria-hidden="true" />{label}</span>
      <strong>{value}</strong>
      {note ? <small>{note}</small> : null}
    </div>
  )
}

export function MetricCard({ icon: Icon, label, value, note, tone = 'blue' }: { icon: LucideIcon; label: string; value: string; note: string; tone?: 'blue' | 'green' | 'amber' | 'violet' }) {
  return (
    <div className={`profile-metric ${tone}`}>
      <span className="profile-metric-icon"><Icon size={17} aria-hidden="true" /></span>
      <div><small>{label}</small><strong>{value}</strong><p>{note}</p></div>
    </div>
  )
}
