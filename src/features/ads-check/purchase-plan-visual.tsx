import { useId } from 'react'
import type { BillingTier } from './ads-check-billing-data'

/** Decorative vector artwork; compact symbols share the hero's core geometry. */
export function PurchasePlanVisual({ plan, variant = 'hero' }: { plan: BillingTier; variant?: 'compact' | 'hero' }) {
  const id = useId()
  const compact = variant === 'compact'
  const pro = plan === 'pro'
  const paint = (name: string) => `url(#${id}-${name})`
  return <svg className={`purchase-plan-visual is-${plan} is-${variant}`} viewBox={compact ? '75 55 170 170' : '0 0 320 280'} fill="none" aria-hidden="true" focusable="false" preserveAspectRatio="xMidYMid meet">
    <defs>
      <linearGradient id={`${id}-glass`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={pro ? '#CAFF4D' : '#FFF2A8'} stopOpacity=".3" />
        <stop offset=".5" stopColor={pro ? '#287151' : '#D99A00'} stopOpacity=".16" />
        <stop offset="1" stopColor={pro ? '#104C31' : '#3B2103'} stopOpacity=".65" />
      </linearGradient>
      <linearGradient id={`${id}-edge`} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor={pro ? '#EAFBF3' : '#FFF9D3'} />
        <stop offset=".35" stopColor={pro ? '#CAFF4D' : '#F5C542'} />
        <stop offset=".75" stopColor={pro ? '#287151' : '#B67A08'} />
        <stop offset="1" stopColor={pro ? '#B9FF39' : '#FCD34D'} />
      </linearGradient>
      <linearGradient id={`${id}-face`} x1="0" y1="0" x2=".8" y2="1">
        <stop stopColor={pro ? '#E7FFD0' : '#FFFBE5'} />
        <stop offset=".45" stopColor={pro ? '#B9FF39' : '#FFF2A8'} />
        <stop offset="1" stopColor={pro ? '#287151' : '#EAB308'} />
      </linearGradient>
      <radialGradient id={`${id}-halo`}>
        <stop stopColor={pro ? '#B9FF39' : '#F5C542'} stopOpacity=".3" />
        <stop offset="1" stopColor={pro ? '#287151' : '#D99A00'} stopOpacity="0" />
      </radialGradient>
    </defs>
    {!compact && <>
      <ellipse cx="160" cy="143" rx="155" ry="132" fill={paint('halo')} />
      <rect x="64" y="51" width="194" height="182" rx="34" transform="rotate(-18 160 140)" fill={paint('glass')} stroke={paint('edge')} strokeOpacity=".15" />
      <rect x="68" y="48" width="184" height="184" rx="30" transform="rotate(17 160 140)" fill={paint('glass')} stroke={paint('edge')} strokeOpacity=".27" />
    </>}
    {pro ? <>
      {!compact && <g stroke="#CAFF4D" strokeLinecap="round" strokeLinejoin="round">
        <path d="M160 100V58H66M207 126H258V70M160 179V224H66M114 143H53V96M204 153H267V219" strokeWidth="5" opacity=".07" />
        <path d="M160 100V58H66M207 126H258V70M160 179V224H66M114 143H53V96M204 153H267V219" strokeWidth="1.5" opacity=".7" />
        {[ [160,58], [258,126], [160,224], [53,143], [267,153] ].map(([cx,cy]) => <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="3" fill="#EAFBF3" stroke="none" />)}
      </g>}
      {compact && <g stroke="#E7FFD0" strokeWidth="4" strokeLinecap="round">
        <path d="M112 139H90V92M208 139H230V188" />
        <rect x="80" y="78" width="22" height="22" rx="6" fill="#287151" />
        <rect x="218" y="181" width="22" height="22" rx="6" fill="#287151" />
      </g>}
      <path d="M105 123L160 91L215 123V164L160 197L105 164Z" fill="#184C37" fillOpacity=".65" stroke={paint('edge')} strokeWidth="1.5" />
      <path d="M105 123L160 155L215 123L160 91Z" fill={paint('face')} stroke="#E7FFD0" strokeWidth="1.5" />
      <path d="M105 123L160 155V197L105 164Z" fill="#287151" fillOpacity=".65" />
      <path d="M160 155L215 123V164L160 197Z" fill="#B9FF39" fillOpacity=".2" />
      <path d="M116 114L160 88L204 114L160 140Z" fill={paint('glass')} stroke="#EAFBF3" strokeOpacity=".85" strokeWidth="1.5" />
      <path d="M130 111L160 94L190 111L160 129Z" fill="#EAFBF3" fillOpacity=".35" />
      <path d="M160 155V186M115 157L151 178M169 178L205 157" stroke="#CAFF4D" strokeOpacity=".6" strokeWidth="1.5" />
      {!compact && <g stroke="#CEF5E3" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
        {[[29,34],[236,34],[24,194],[240,193]].map(([x,y]) => <rect key={x} x={x} y={y} width="52" height="52" rx="14" fill={paint('glass')} stroke={paint('edge')} />)}
        <circle cx="55" cy="52" r="6" /><path d="M44 72V68C44 60 66 60 66 68V72" />
        <rect x="248" y="46" width="10" height="10" rx="2" /><rect x="267" y="46" width="10" height="10" rx="2" />
        <rect x="248" y="65" width="10" height="10" rx="2" /><rect x="267" y="65" width="10" height="10" rx="2" />
        <path d="M36 210H64M36 228H64" /><circle cx="44" cy="210" r="3" fill="#104C31" /><circle cx="57" cy="228" r="3" fill="#104C31" />
        <path d="M266 208V230M255 219H277" strokeWidth="2.5" />
      </g>}
    </> : <>
      {compact && <rect x="99" y="78" width="122" height="124" rx="22" transform="rotate(15 160 140)" fill={paint('glass')} stroke={paint('edge')} strokeOpacity=".5" />}
      <path d="M160 61L224 98V173L160 211L96 173V98Z" fill="#3B2103" fillOpacity=".55" stroke={paint('edge')} strokeWidth={compact ? 5 : 3} strokeLinejoin="round" />
      <path d="M160 73L214 104V167L160 199L106 167V104Z" fill={paint('glass')} stroke={paint('edge')} strokeOpacity=".5" strokeWidth="1" />
      <circle cx="160" cy="136" r="65" fill={paint('halo')} />
      <path d="M160 89C168 121 175 128 205 136C175 144 168 151 160 184C152 151 145 144 115 136C145 128 152 121 160 89Z" fill={paint('face')} stroke="#FFF2A8" strokeWidth="1.5" />
      <path d="M160 108L166 130L184 136L166 142L160 165L154 142L136 136L154 130Z" fill="#FFFBE5" />
      {!compact && <g stroke={paint('edge')} strokeLinecap="round">
        <path d="M160 38V49M160 224V238M72 88L81 93M239 181L250 187M72 184L82 178M239 92L249 86" strokeWidth="1.5" opacity=".65" />
        <path d="M125 85L160 65L195 85M101 150V169L133 188" stroke="#FFF2A8" strokeWidth="2" opacity=".65" />
        <circle cx="62" cy="140" r="2" fill="#FFF2A8" /><circle cx="258" cy="140" r="2" fill="#FFF2A8" />
      </g>}
    </>}
  </svg>
}
