import { useId, type CSSProperties } from 'react'

// One contour for the surface, edge and runner. Taller elliptical caps
// join straight, parallel side walls; the fixed viewBox never stretches.
const contour = 'M28 1 C44 1 55 18 55 40 V278 C55 300 44 317 28 317 C12 317 1 300 1 278 V40 C1 18 12 1 28 1 Z'

export function AdsCheckModuleIsland() {
  const id = useId()
  return <svg className="ads-module-island-surface" viewBox="0 0 56 318" aria-hidden="true" focusable="false">
    <defs>
      <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
        <stop stopColor="#142D48" />
        <stop offset=".32" stopColor="#0D1D32" />
        <stop offset=".65" stopColor="#0B1729" />
        <stop offset="1" stopColor="#122A42" />
      </linearGradient>
      <linearGradient id={id + '-light'} x1="0" y1="0" x2="0" y2="1">
        <stop stopColor="#86EBFF" />
        <stop offset=".22" stopColor="#268CFF" />
        <stop offset=".5" stopColor="#464DA2" />
        <stop offset=".76" stopColor="#1B63C8" />
        <stop offset="1" stopColor="#64DFFF" />
      </linearGradient>
    </defs>
    <path className="ads-module-island-halo" d={contour} fill="none" stroke={'url(#' + id + '-light)'} strokeWidth="4" />
    <path d={contour} fill={`url(#${id})`} stroke="rgba(145, 207, 255, .55)" strokeWidth="1" />
    <path className="ads-module-island-band" d={contour} fill="none" stroke={'url(#' + id + '-light)'} strokeWidth="2.4" />
    <g className="ads-module-island-runner" fill="none" strokeLinecap="round">
      <path className="ads-module-island-trace is-glow" d={contour} pathLength={100} stroke="#329CFF" strokeWidth="3" strokeDasharray="12 88" />
      {[12, 10, 8, 6, 4, 2].map((length, index) => <path
        key={length} className="ads-module-island-trace" d={contour} pathLength={100}
        stroke={index < 3 ? '#27B6FF' : '#A4EDFF'} strokeWidth="1.2"
        strokeOpacity={.1 + index * .035} strokeDasharray={`${length} ${100 - length}`}
        style={{ '--island-runner-inset': (12 - length) / 2 } as CSSProperties}
      />)}
    </g>
  </svg>
}
