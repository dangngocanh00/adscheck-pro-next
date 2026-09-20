import { m, useAppLanguage, tx, t } from '@/i18n'
import { useMemo, useState } from 'react'
import { ArrowDownCircle, ArrowUpCircle, Camera, CreditCard, FileText, MessageCircle, Share2, User } from 'lucide-react'
import { AdsProResourcePanel } from './ads-check-pro-resource-panel'
import { AdsProConfirmDialog } from './ads-check-pro-confirm-dialog'
import type { BmAdAccountRef, BmAdmin, BmAdminRole, BmInstagramRef, BmPageRef, BmPartner, BmWabaRef } from './ads-check-pro-bm-data'

export type BmResourceKind = 'partner' | 'admin' | 'adAccount' | 'page' | 'instagram' | 'waba'
type AnyItem = BmPartner | BmAdmin | BmAdAccountRef | BmPageRef | BmInstagramRef | BmWabaRef

const KIND_META: Record<BmResourceKind, { title: string; icon: React.ReactNode; searchPlaceholder: string; destructiveLabel: string; nounLabel: string }> = {
  partner: { title: m("ui.a81a975191"), icon: <Share2 size={16} />, searchPlaceholder: m("ui.159b7cf3c2"), destructiveLabel: m("ui.5e76821627"), nounLabel: m("ui.a269b6c3d1") },
  admin: { title: 'Admin BM', icon: <User size={16} />, searchPlaceholder: m("ui.76634e1f2b"), destructiveLabel: m("ui.4dbf2ccfd5"), nounLabel: 'admin' },
  adAccount: { title: 'TKQC (Owned + Share)', icon: <CreditCard size={16} />, searchPlaceholder: m("ui.c4177396fb"), destructiveLabel: m("ui.fdf6a95e79"), nounLabel: 'TKQC' },
  page: { title: 'Page BM', icon: <FileText size={16} />, searchPlaceholder: m("ui.550d78451c"), destructiveLabel: m("ui.4923c73cc7"), nounLabel: 'Page' },
  instagram: { title: 'TK Instagram', icon: <Camera size={16} />, searchPlaceholder: m("ui.b37a931679"), destructiveLabel: m("ui.36f659a119"), nounLabel: m("ui.176baff96b") },
  waba: { title: 'TK WhatsApp (WABA)', icon: <MessageCircle size={16} />, searchPlaceholder: m("ui.3ec70523c4"), destructiveLabel: m("ui.e962d25945"), nounLabel: m("ui.5296f34189") },
}

function matchesQuery(kind: BmResourceKind, item: AnyItem, query: string): boolean {
  if (!query.trim()) return true
  const normalized = query.trim().toLocaleLowerCase('vi')
  if (kind === 'admin') { const a = item as BmAdmin; return `${a.name} ${a.uid}`.toLocaleLowerCase('vi').includes(normalized) }
  return item.name.toLocaleLowerCase('vi').includes(normalized)
}

function ResourceRow({ kind, item, checked, onToggle }: { kind: BmResourceKind; item: AnyItem; checked: boolean; onToggle: () => void }) {
  useAppLanguage();
  return <li className="ads-resource-row">
    <label className="ads-resource-row-main">
      <input type="checkbox" checked={checked} onChange={onToggle} aria-label={tx(m("ui.84da3235c3", { 0: item.name }))} />
      <span className="ads-resource-row-text">
        <strong>{item.name}</strong>
        {kind === 'admin' && <small>{t("ui.489bd63e3d")}{" "}{(item as BmAdmin).uid}</small>}
        {kind === 'adAccount' && <small>{(item as BmAdAccountRef).ownership === 'owned' ? 'Owned' : 'Share'} {" "}{t("ui.381d7c92cb")}{" "}{item.id}</small>}
        {(kind === 'partner' || kind === 'page' || kind === 'instagram' || kind === 'waba') && <small>{t("ui.d789a1e992")}{" "}{item.id}</small>}
      </span>
    </label>
    {tx(kind === 'admin' && <span className={`ads-resource-badge is-role-${(item as BmAdmin).role}`}>{tx((item as BmAdmin).role === 'admin' ? 'QTV' : m("ui.14ddd70d25"))}</span>)}
    {tx(kind === 'admin' && (item as BmAdmin).isYou && <span className="ads-resource-badge is-you">{t("ui.6c7b41bee8")}</span>)}
    {tx(kind === 'adAccount' && <span className={`ads-resource-badge is-${(item as BmAdAccountRef).status}`}>{tx((item as BmAdAccountRef).status === 'live' ? 'Live' : 'Die')}</span>)}
  </li>
}

type BmResourcePanelInstanceProps = {
  kind: BmResourceKind
  bmName: string
  bmId: string
  items: AnyItem[]
  onClose: () => void
  onRemove: (ids: string[]) => void
  onRoleChange?: (ids: string[], role: BmAdminRole) => void
}

// Correction Batch 2 Part M: ONE shared component parameterized by `kind`
// drives all 6 BM resource panels (Partner/Admin/Ad Account/Page/IG/WABA) —
// not six copy-pasted modals. Only the row renderer/labels differ.
export function AdsProBmResourcePanel({ kind, bmName, bmId, items, onClose, onRemove, onRoleChange }: BmResourcePanelInstanceProps) {
  useAppLanguage();
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [pendingRemove, setPendingRemove] = useState(false)
  const meta = KIND_META[kind]
  const filtered = useMemo(() => items.filter((item) => matchesQuery(kind, item, query)), [items, kind, query])

  const toggle = (id: string) => setSelected((current) => current.includes(id) ? current.filter((existing) => existing !== id) : [...current, id])
  const selectedAdmins = kind === 'admin' ? (items as BmAdmin[]).filter((admin) => selected.includes(admin.id)) : []
  // Part K4/O1: promote disabled if every selected admin is already 'admin'
  // (nothing to promote to); demote disabled if every selected is already
  // 'employee'. Nothing selected -> both disabled.
  const canPromote = selectedAdmins.length > 0 && selectedAdmins.some((admin) => admin.role !== 'admin')
  const canDemote = selectedAdmins.length > 0 && selectedAdmins.some((admin) => admin.role !== 'employee')

  // SHARED RULE (destructive confirmation): removal only ever mutates from
  // the confirm dialog's own destructive button, matching TKQC's payment
  // card removal (ads-check-pro-tkqc-payment-popover.tsx) via the same
  // AdsProConfirmDialog.
  const pendingItems = useMemo(() => items.filter((item) => selected.includes(item.id)), [items, selected])
  const confirmRemove = () => { onRemove(selected); setSelected([]); setPendingRemove(false) }
  const removeDescription = pendingItems.length === 1
    ? m("ui.374aa8952b", { 0: pendingItems[0].name, 1: bmName })
    : m("ui.df25116501", { 0: pendingItems.length, 1: meta.nounLabel, 2: bmName })

  return <>
    <AdsProResourcePanel
      icon={meta.icon}
      title={tx(meta.title)}
      subtitle={`${bmName} · ID: ${bmId}`}
      searchPlaceholder={meta.searchPlaceholder}
      onSearch={setQuery}
      isEmpty={filtered.length === 0}
      onClose={() => { if (!pendingRemove) onClose() }}
      footer={<>
        <span className="ads-resource-panel-count">{t("ui.40b56a1698")}{" "}{selected.length}</span>
        <div className="ads-resource-panel-actions">
          {kind === 'admin' && <>
            <button type="button" className="is-neutral" disabled={!canPromote} onClick={() => { onRoleChange?.(selected, 'admin'); setSelected([]) }}><ArrowUpCircle size={14} />{t("ui.102e577af2")}</button>
            <button type="button" className="is-neutral" disabled={!canDemote} onClick={() => { onRoleChange?.(selected, 'employee'); setSelected([]) }}><ArrowDownCircle size={14} />{t("ui.ebd30d2a11")}</button>
          </>}
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className="is-destructive" disabled={selected.length === 0} onClick={() => setPendingRemove(true)}>{tx(meta.destructiveLabel)}</button>
        </div>
      </>}
    >
      <ul className="ads-resource-list">
        {filtered.map((item) => <ResourceRow key={item.id} kind={kind} item={item} checked={selected.includes(item.id)} onToggle={() => toggle(item.id)} />)}
      </ul>
    </AdsProResourcePanel>
    {tx(pendingRemove && <AdsProConfirmDialog
      title={tx(`${meta.destructiveLabel}?`)}
      description={tx(removeDescription)}
      confirmLabel={meta.destructiveLabel}
      onConfirm={confirmRemove}
      onClose={() => setPendingRemove(false)}
    />)}
  </>
}
