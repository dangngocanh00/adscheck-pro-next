import { useAppLanguage, t, tx, m } from '@/i18n'
import { useMemo, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Columns3, Lock, Search, Unlock, X } from 'lucide-react'
import { useOverlayFocus } from '@/components/ui/use-overlay-focus'
import { moveIntoFrozenPrefix } from './ads-check-pro-column-config'
import { AdsProModalBackdrop } from './ads-check-pro-modal-backdrop'

export type ColumnSettingsRow<K extends string> = { key: K; label: string; locked?: boolean }

type ColumnSettingsModalProps<K extends string> = {
  columns: ColumnSettingsRow<K>[]
  frozenKeys: Set<K>
  hiddenKeys: Set<K>
  onSave: (order: K[], frozen: Set<K>, hidden: Set<K>) => void
  onClose: () => void
  // VIA Audit Batch 1 Part C3: production's "Hành động" column is always
  // visible and never draggable/hideable/freezable (same as the checkbox
  // column, which isn't in the list at all) — it isn't part of the
  // reorderable useColumnConfig state, so it can't be a real K. Rendered as
  // a trailing, non-interactive row purely so the header count matches the
  // traced total (VIA: 9/9 = 8 reorderable columns + this one).
  trailingLockedColumn?: { label: string }
}

// VIA Audit Batch 1 Part C — "Tùy chỉnh cột" modal, shared across all 5
// tabs (Part C4: reads from the SAME useColumnConfig state every table
// already uses, never a second hardcoded column list). Holds its own
// PENDING draft (order/frozen/hidden) — nothing commits to the real table
// or config_column until "Lưu tùy chỉnh" (Part C5/C12); "Hủy" and the
// header "X" both discard the draft untouched (production evidence for a
// distinct X-vs-Hủy behavior was not recoverable, so X follows the same
// discard semantics as Hủy — the safer of the two readings, since treating
// X as an accidental Save would be a surprising/unrecoverable action for a
// user just closing the modal).
export function AdsProColumnSettingsModal<K extends string>({ columns, frozenKeys, hiddenKeys, onSave, onClose, trailingLockedColumn }: ColumnSettingsModalProps<K>) {
  useAppLanguage();
  const [draftOrder, setDraftOrder] = useState<K[]>(() => columns.map((column) => column.key))
  const [draftFrozen, setDraftFrozen] = useState<Set<K>>(() => new Set(frozenKeys))
  const [draftHidden, setDraftHidden] = useState<Set<K>>(() => new Set(hiddenKeys))
  const [query, setQuery] = useState('')
  const panelRef = useRef<HTMLElement>(null)
  useOverlayFocus(true, panelRef, onClose)

  const labelByKey = useMemo(() => new Map(columns.map((column) => [column.key, column.label])), [columns])
  const lockedByKey = useMemo(() => new Map(columns.map((column) => [column.key, Boolean(column.locked)])), [columns])
  const normalizedQuery = query.trim().toLocaleLowerCase('vi')
  const visibleRows = draftOrder.filter((key) => !normalizedQuery || (labelByKey.get(key) ?? '').toLocaleLowerCase('vi').includes(normalizedQuery))
  const trailingMatches = Boolean(trailingLockedColumn) && (!normalizedQuery || (trailingLockedColumn?.label ?? '').toLocaleLowerCase('vi').includes(normalizedQuery))
  const totalCount = draftOrder.length + (trailingLockedColumn ? 1 : 0)
  const visibleCount = draftOrder.length - draftHidden.size + (trailingLockedColumn ? 1 : 0)

  const toggleHidden = (key: K) => {
    if (lockedByKey.get(key)) return
    setDraftHidden((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
  }
  const toggleFrozen = (key: K) => {
    if (lockedByKey.get(key)) return
    const willFreeze = !draftFrozen.has(key)
    setDraftFrozen((current) => {
      const next = new Set(current)
      if (next.has(key)) next.delete(key)
      else next.add(key)
      return next
    })
    // Shared Rule #1: mirror the live header dropdown's move-into-frozen-
    // prefix behavior in the modal's own draft, so Save doesn't silently
    // produce a different order than freezing directly would have.
    if (willFreeze) setDraftOrder((current) => moveIntoFrozenPrefix(current, draftFrozen, key))
  }
  const reorderDraft = (fromKey: K, toKey: K) => setDraftOrder((current) => {
    const next = current.slice()
    const fromIndex = next.indexOf(fromKey)
    const toIndex = next.indexOf(toKey)
    if (fromIndex === -1 || toIndex === -1) return current
    next.splice(fromIndex, 1)
    next.splice(toIndex, 0, fromKey)
    return next
  })

  const handleSave = () => { onSave(draftOrder, draftFrozen, draftHidden); onClose() }

  return createPortal(
    // CATEGORY B important modal — has a pending draft (reorder/visibility/
    // freeze), so backdrop click must NOT dismiss and silently discard it
    // (Shared Resource/Modal UX correction); dismissOnBackdrop intentionally
    // omitted. Only Hủy/Lưu tùy chỉnh/X commit the draft's fate.
    <AdsProModalBackdrop onClose={onClose}>
      <section ref={panelRef} className="ads-column-settings-modal" role="dialog" aria-modal="true" aria-labelledby="ads-column-settings-title">
        <header>
          <Columns3 size={16} className="ads-advanced-filter-icon" aria-hidden="true" />
          <h2 id="ads-column-settings-title">{t("ui.1c9dbf98c4")}</h2>
          <button type="button" className="ads-advanced-filter-close" aria-label={t("ui.433f1005d7")} onClick={onClose} data-autofocus><X size={16} /></button>
        </header>
        <div className="ads-column-settings-count">{t("ui.7249574ac5")}{" "}<strong>{visibleCount}/{totalCount}</strong></div>
        <label className="ads-column-settings-search">
          <Search size={14} aria-hidden="true" />
          <input aria-label={t("ui.5d2fda9a56")} placeholder={t("ui.6671928637")} value={query} onChange={(event) => setQuery(event.target.value)} />
        </label>
        <ul className="ads-column-settings-list">
          {tx(visibleRows.map((key) => {
            const locked = lockedByKey.get(key)
            const label = labelByKey.get(key) ?? key
            const hidden = draftHidden.has(key)
            const frozen = draftFrozen.has(key)
            return <li
              key={key}
              className={`ads-column-settings-row${hidden ? ' is-hidden' : ''}`}
              draggable={!locked}
              onDragStart={(event) => event.dataTransfer.setData('text/column-settings-row', key)}
              onDragOver={(event) => { if (!locked) event.preventDefault() }}
              onDrop={(event) => { event.preventDefault(); const fromKey = event.dataTransfer.getData('text/column-settings-row') as K; if (fromKey) reorderDraft(fromKey, key) }}
            >
              <span className="ads-column-settings-handle" aria-hidden="true">{locked ? '' : '⠿'}</span>
              <span className="ads-column-settings-label">{tx(label)}</span>
              <label className="ads-column-settings-visibility">
                <input type="checkbox" checked={!hidden} disabled={locked} aria-label={tx(m("ui.80a63ddeac", { 0: label }))} onChange={() => toggleHidden(key)} />
              </label>
              <button type="button" className={`ads-column-settings-freeze${frozen ? ' is-frozen' : ''}`} disabled={locked} aria-label={tx(frozen ? m("ui.e8847e8d08", { 0: label }) : m("ui.7757eb270d", { 0: label }))} aria-pressed={frozen} onClick={() => toggleFrozen(key)}>
                {frozen ? <Lock size={14} /> : <Unlock size={14} />}
              </button>
            </li>
          }))}
          {tx(trailingLockedColumn && trailingMatches && <li className="ads-column-settings-row is-locked">
            <span className="ads-column-settings-handle" aria-hidden="true" />
            <span className="ads-column-settings-label">{tx(trailingLockedColumn.label)}</span>
            <label className="ads-column-settings-visibility">
              <input type="checkbox" checked disabled aria-label={tx(m("ui.c5a525b8f6", { 0: trailingLockedColumn.label }))} />
            </label>
            <button type="button" className="ads-column-settings-freeze" disabled aria-label={tx(m("ui.6da03dc243", { 0: trailingLockedColumn.label }))}><Lock size={14} /></button>
          </li>)}
        </ul>
        <footer>
          <button type="button" className="is-secondary" onClick={onClose}>{t("ui.34ca764caf")}</button>
          <button type="button" className="is-primary" onClick={handleSave}>{t("ui.a65799a0b7")}</button>
        </footer>
      </section>
    </AdsProModalBackdrop>,
    document.body,
  )
}
