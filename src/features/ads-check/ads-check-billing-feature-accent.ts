// Fixed per-feature identity colors — shared between "Quản lý gói cước"'s
// purchased-feature cards and "Lịch sử giao dịch"'s transaction rows, so a
// feature reads with the same identity color everywhere. Deliberately NOT
// theme-tokenized: each feature keeps its own visual identity across
// V1–V5 instead of every icon turning into whatever the active version's
// brand color is (e.g. all pink under V5 Coral).
export const featureAccent: Record<string, { color: string; background: string }> = {
  'control-hub': { color: '#7c5cff', background: '#f1eeff' },
  // 'ads-account' (Quản lý TKQC) previously used #0d9f39 — byte-identical
  // to V1's --cv-brand-primary — a leftover from before this identity-color
  // system existed, not a deliberate identity choice; teal so it can never
  // be mistaken for "still branded green" at V2–V5.
  'ads-account': { color: '#0f766e', background: '#e6f5f3' },
  businesses: { color: '#33D48C', background: '#EAFAF3' },
  pages: { color: '#e0940f', background: '#fdf1de' },
  'advance-toolkit': { color: '#c2410c', background: '#fdece2' },
  'ads-save': { color: '#c026a3', background: '#fbe8f7' },
}
