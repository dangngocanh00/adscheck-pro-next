import { m } from '@/i18n'
export type ExploreTutorial = {
  id: string
  label: string
  asset: string
  videoId?: string
}

export type ExploreCategory = {
  id: string
  label: string
  kind: 'overview' | 'article' | 'tutorials'
  eyebrow?: string
  title?: string
  description?: string
  videoId?: string
  videoTitle?: string
  highlights?: string[]
  tutorials?: ExploreTutorial[]
}

const makeTutorials = (category: string, asset: string, labels: string[], firstVideoId?: string): ExploreTutorial[] =>
  labels.map((label, index) => ({
    id: `${category}-${index + 1}`,
    label,
    asset,
    videoId: index === 0 ? firstVideoId : undefined,
  }))

export const exploreCategories: ExploreCategory[] = [
  {
    id: 'overview', label: m("ui.286a38e3d5"), kind: 'overview', eyebrow: m("ui.87acc36dce"),
    title: m("ui.3d3f52b86c"),
    description: m("ui.5fc3512bea"),
    videoId: '_8nNbyfQuEA', videoTitle: m("ui.6f560d74d2"),
    highlights: [m("ui.6368f73923"), 'Control Hub', 'Priority'],
  },
  {
    id: 'interface', label: m("ui.705b42375d"), kind: 'article', eyebrow: m("ui.aba7177827"),
    title: m("ui.7aed393393"),
    description: m("ui.c6bfec9377"),
    videoId: 'iXG9DDtPp7E', videoTitle: m("ui.59cf2cbf86"),
    highlights: [m("ui.228359bbf6"), m("ui.b6bbc01099"), m("ui.7401162b8c")],
  },
  {
    id: 'control-hub', label: 'Control Hub', kind: 'article', eyebrow: m("ui.7b9dde4fe7"),
    title: m("ui.f15b165ad0"),
    description: m("ui.7270941373"),
    videoId: 'iXG9DDtPp7E', videoTitle: m("ui.59cf2cbf86"),
    highlights: [m("ui.bc1ed7d1ae"), m("ui.7a2fe2adae"), m("ui.9e5b7ac721")],
  },
  {
    id: 'vip', label: m("ui.c7c0245152"), kind: 'article', eyebrow: 'Premium explainer',
    title: m("ui.ef4bd43023"),
    description: m("ui.c706539405"),
    videoId: 'iXG9DDtPp7E', videoTitle: m("ui.59cf2cbf86"),
    highlights: [m("ui.3f98a12705"), m("ui.967dd99a66"), 'VIP Support 1:1'],
  },
  {
    id: 'super-share', label: 'Super Share', kind: 'tutorials',
    tutorials: makeTutorials('super-share', 'Page', [
      m("ui.cd9be632e9"), m("ui.c8829d965c"), m("ui.feb048dc1c"), m("ui.48300ed928"),
      m("ui.576c38cf5e"), m("ui.8157e11e53"), m("ui.2913024719"), m("ui.2684a3c7e4"),
      m("ui.706818d1d2"), m("ui.05dc3ddb07"), m("ui.9c7d823316"), m("ui.818050fd46"),
      m("ui.af34fb6783"), m("ui.1669426b74"), m("ui.93679ebc91"), m("ui.a30914b65b"),
      m("ui.cb3915f02c"), m("ui.78247d84c1"), m("ui.ad4e6f20af"), m("ui.167d744a94"),
      m("ui.5e76821627"), m("ui.f2c11f154d"), m("ui.b5416006da"), m("ui.ca53415b82"),
    ], 'WkFO8mQbdys'),
  },
  {
    id: 'ads-check-pro', label: 'Ads Check Pro', kind: 'tutorials',
    tutorials: makeTutorials('ads-check-pro', 'Ads Check Pro', [
      m("ui.22586f625c"), m("ui.8f54b5fac4"), m("ui.acf5a22562"), m("ui.08a0727d1d"), m("ui.5737f1312e"), m("ui.7aa687ee01"),
      m("ui.63d6b51cfb"), m("ui.beb7cb84ca"), m("ui.22003a919c"), m("ui.7f41fd83e8"),
      m("ui.41ef6e203e"), m("ui.058604d991"), m("ui.e1f8de1304"), m("ui.ae43ceca7e"),
      m("ui.ddef665b09"), m("ui.c1da914e3c"), m("ui.d01f008352"),
    ], 'QW8Odt0EHs4'),
  },
  {
    id: 'payment', label: 'Payment & Billing', kind: 'tutorials',
    tutorials: makeTutorials('payment', 'TKQC', [m("ui.1f32cc0aef"), m("ui.b9d01abb25"), m("ui.7e4372148c"), m("ui.cdcca133b8"), m("ui.814dea766a"), 'Check Hold'], 'mL0frC8gnms'),
  },
  {
    id: 'ads-manager', label: m("ui.e39b455d0f"), kind: 'tutorials',
    tutorials: makeTutorials('ads-manager', 'TKQC', [m("ui.f2c338a38c")], 'yviqzFncEBY'),
  },
  {
    id: 'appeal', label: m("ui.fad4676ce1"), kind: 'tutorials',
    tutorials: makeTutorials('appeal', 'BM', [m("ui.6c36e94c67"), m("ui.5c7a722e1a"), m("ui.fb65d6b3de"), m("ui.ae4ee0fc4b")], 'XkFeLrqBZws'),
  },
  {
    id: 'change-info', label: m("ui.4d0b571804"), kind: 'tutorials',
    tutorials: makeTutorials('change-info', m("ui.036c5ac2f1"), [m("ui.e1dfd564ed"), m("ui.2b328e58f5"), m("ui.fd0ec32376"), m("ui.3c7248f3a3"), m("ui.ab025c3533"), m("ui.9193d20aa4"), m("ui.8aebdf00f7"), m("ui.237068ef46")], 'D5H7zpu2UTE'),
  },
  {
    id: 'hidden-admin', label: m("ui.d1a8659e0c"), kind: 'tutorials',
    tutorials: makeTutorials('hidden-admin', 'Page', [m("ui.5a85173b7b"), m("ui.0adb7b53e4"), m("ui.4dbf2ccfd5"), m("ui.ff75c2bc06")], 'vttwkRHPV9U'),
  },
  {
    id: 'share-pixel', label: 'Share Pixel', kind: 'tutorials',
    tutorials: makeTutorials('share-pixel', 'Pixel', [m("ui.4a1c3504a9"), m("ui.6b079a8d51"), m("ui.9e69da5619"), m("ui.3eb5ddb42d"), m("ui.3ffe329c9d"), m("ui.84efb1b0f8")], 'PwRZ6zSCpik'),
  },
  {
    id: 'other', label: m("ui.b6e118962b"), kind: 'article', eyebrow: m("ui.ba8ed03dff"),
    title: m("ui.e8dff7fa16"),
    description: m("ui.94642bae53"),
    videoId: 'iXG9DDtPp7E', videoTitle: m("ui.59cf2cbf86"),
    highlights: [m("ui.4c9e4bf899"), m("ui.eab69ba04f"), m("ui.6b89705040")],
  },
]

export const exploreScreenCount = exploreCategories.reduce((total, category) =>
  total + (category.tutorials?.length ?? 1), 0)
