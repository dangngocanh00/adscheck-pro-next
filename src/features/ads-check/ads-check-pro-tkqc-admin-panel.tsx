import { m, useAppLanguage, t, tx } from '@/i18n'
import { useMemo, useState } from 'react'
import { MoreVertical } from 'lucide-react'
import { AdsProResourcePanel } from './ads-check-pro-resource-panel'
import type { TkqcAdmin, TkqcAdminRole, TkqcRow } from './ads-check-pro-tkqc-data'

const ROLE_LABEL: Record<TkqcAdminRole, string> = { admin: m("ui.2aeb825cbf"), advertiser: m("ui.b7aba66950"), analyst: m("ui.f7c6020e9e") }
// Confirmed hierarchy (research): admin > advertiser > analyst.
const ROLE_RANK: Record<TkqcAdminRole, number> = { admin: 2, advertiser: 1, analyst: 0 }

type TkqcAdminPanelProps = {
  row: TkqcRow
  onClose: () => void
  onPromote: (rowId: string, adminId: string) => void
  onDemote: (rowId: string, adminId: string) => void
  onRemove: (rowId: string, adminId: string) => void
}

function AdminRow({ admin, open, onToggleMenu, onPromote, onDemote, onRemove }: {
  admin: TkqcAdmin
  open: boolean
  onToggleMenu: () => void
  onPromote: () => void
  onDemote: () => void
  onRemove: () => void
}) {
  useAppLanguage();
  const canPromote = ROLE_RANK[admin.role] < ROLE_RANK.admin
  const canDemote = ROLE_RANK[admin.role] > ROLE_RANK.analyst
  return <li className="ads-resource-row">
    <span className="ads-resource-row-main">
      <span className="ads-resource-row-avatar" aria-hidden="true">{admin.name.charAt(0)}</span>
      <span className="ads-resource-row-text">
        <strong>{admin.name}</strong>
        <small>{t("ui.489bd63e3d")}{" "}{admin.uid}</small>
      </span>
    </span>
    <span className={`ads-resource-badge is-role-${admin.role}`}>{ROLE_LABEL[admin.role]}</span>
    {tx(admin.isYou && <span className="ads-resource-badge is-you">{t("ui.6c7b41bee8")}</span>)}
    <span className="ads-resource-row-menu">
      <button type="button" aria-label={tx(m("ui.630d47befd", { 0: admin.name }))} aria-expanded={open} onClick={onToggleMenu}><MoreVertical size={15} /></button>
      {open && <div className="ads-resource-row-menu-popover" role="menu">
        <button type="button" role="menuitem" disabled={!canPromote} onClick={onPromote}>{t("ui.102e577af2")}</button>
        <button type="button" role="menuitem" disabled={!canDemote} onClick={onDemote}>{t("ui.ebd30d2a11")}</button>
        <hr />
        <button type="button" role="menuitem" className="is-destructive" onClick={onRemove}>{t("ui.b8427c31a8")}</button>
      </div>}
    </span>
  </li>
}

// Correction Batch 2 Part K — "Quản trị viên TKQC" panel, reusing the same
// AdsProResourcePanel shell as every BM resource panel (Part T: one shared
// visual language, not a bespoke modal family).
export function AdsProTkqcAdminPanel({ row, onClose, onPromote, onDemote, onRemove }: TkqcAdminPanelProps) {
  useAppLanguage();
  const [query, setQuery] = useState('')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const filtered = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase('vi')
    if (!normalized) return row.admins
    return row.admins.filter((admin) => `${admin.name} ${admin.uid}`.toLocaleLowerCase('vi').includes(normalized))
  }, [row.admins, query])

  return <AdsProResourcePanel
    icon="👤"
    title={t("ui.9eb440763f")}
    subtitle={`${row.name} · ID: ${row.accountId}`}
    searchPlaceholder="Tìm theo tên hoặc UID..."
    onSearch={setQuery}
    isEmpty={filtered.length === 0}
    onClose={onClose}
  >
    <ul className="ads-resource-list">
      {filtered.map((admin) => <AdminRow
        key={admin.id}
        admin={admin}
        open={openMenuId === admin.id}
        onToggleMenu={() => setOpenMenuId((current) => current === admin.id ? null : admin.id)}
        onPromote={() => { onPromote(row.id, admin.id); setOpenMenuId(null) }}
        onDemote={() => { onDemote(row.id, admin.id); setOpenMenuId(null) }}
        onRemove={() => { onRemove(row.id, admin.id); setOpenMenuId(null) }}
      />)}
    </ul>
  </AdsProResourcePanel>
}
