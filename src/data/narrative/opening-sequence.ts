import { GAME_BRAND, OPENING_ART_ASSETS } from '../branding/brand-config';

export type OpeningVisual =
  | 'rain-city'
  | 'desk'
  | 'client-office'
  | 'server-room'
  | 'lidka'
  | 'cables'
  | 'blackout'
  | 'rj45'
  | 'legend';

export interface OpeningPanelDefinition {
  id: string;
  visual: OpeningVisual;
  assetKey: string;
  assetUrl: string;
  focalPoint?: Readonly<{ x: number; y: number }>;
  coverZoom?: number;
  speaker: string;
  text: string;
  caption?: string;
  accent?: 'white' | 'red';
}

export const openingPanels: readonly OpeningPanelDefinition[] = [
  {
    id: 'ordinary-it-worker',
    visual: 'rain-city',
    assetKey: OPENING_ART_ASSETS[0].key,
    assetUrl: OPENING_ART_ASSETS[0].url,
    focalPoint: { x: 0.42, y: 0.5 },
    coverZoom: 1.04,
    speaker: 'HUBERT',
    text: 'Byłem zwykłym informatykiem.',
    caption: 'WARSZAWA. DZIEŃ JAK CO DZIEŃ.',
  },
  {
    id: 'no-ambition',
    visual: 'desk',
    assetKey: OPENING_ART_ASSETS[1].key,
    assetUrl: OPENING_ART_ASSETS[1].url,
    focalPoint: { x: 0.38, y: 0.5 },
    speaker: 'HUBERT',
    text: 'Nie miałem wielkich ambicji.',
  },
  {
    id: 'daily-routine',
    visual: 'desk',
    assetKey: OPENING_ART_ASSETS[2].key,
    assetUrl: OPENING_ART_ASSETS[2].url,
    focalPoint: { x: 0.38, y: 0.5 },
    coverZoom: 1.08,
    speaker: 'HUBERT',
    text: 'Komputer. Kawa. Kabel. Restart. Powtórz.',
  },
  {
    id: 'client-day',
    visual: 'client-office',
    assetKey: OPENING_ART_ASSETS[3].key,
    assetUrl: OPENING_ART_ASSETS[3].url,
    focalPoint: { x: 0.5, y: 0.48 },
    coverZoom: 1.01,
    speaker: 'HUBERT',
    text: 'Tamtego dnia przyszła kolej na pracę u klienta.',
    caption: 'EW0 — INFRASTRUKTURA KRYTYCZNA*',
  },
  {
    id: 'weather',
    visual: 'rain-city',
    assetKey: OPENING_ART_ASSETS[4].key,
    assetUrl: OPENING_ART_ASSETS[4].url,
    focalPoint: { x: 0.4, y: 0.46 },
    coverZoom: 1.07,
    speaker: 'HUBERT',
    text: 'Padało tak, jakby miasto próbowało coś zmyć.',
  },
  {
    id: 'friendly-server-room',
    visual: 'server-room',
    assetKey: OPENING_ART_ASSETS[5].key,
    assetUrl: OPENING_ART_ASSETS[5].url,
    focalPoint: { x: 0.28, y: 0.5 },
    coverZoom: 1.02,
    speaker: 'HUBERT',
    text: 'Serwerownia była przyjazna. Za przyjazna.',
  },
  {
    id: 'lidka-smiled',
    visual: 'lidka',
    assetKey: OPENING_ART_ASSETS[6].key,
    assetUrl: OPENING_ART_ASSETS[6].url,
    focalPoint: { x: 0.62, y: 0.48 },
    coverZoom: 1.03,
    speaker: 'HUBERT',
    text: 'Nawet Lidka z księgowości się uśmiechnęła.',
  },
  {
    id: 'cable-closeup',
    visual: 'cables',
    assetKey: OPENING_ART_ASSETS[7].key,
    assetUrl: OPENING_ART_ASSETS[7].url,
    focalPoint: { x: 0.6, y: 0.52 },
    coverZoom: 1.01,
    speaker: 'HUBERT',
    text: 'W szafie wszystko miało swoje miejsce.',
  },
  {
    id: 'fatal-error',
    visual: 'cables',
    assetKey: OPENING_ART_ASSETS[8].key,
    assetUrl: OPENING_ART_ASSETS[8].url,
    focalPoint: { x: 0.58, y: 0.48 },
    coverZoom: 1.02,
    speaker: 'HUBERT',
    text: 'I wtedy popełniłem fatalny błąd.',
    accent: 'red',
  },
  {
    id: 'actually-worked',
    visual: 'cables',
    assetKey: OPENING_ART_ASSETS[9].key,
    assetUrl: OPENING_ART_ASSETS[9].url,
    focalPoint: { x: 0.58, y: 0.5 },
    coverZoom: 1.02,
    speaker: 'HUBERT',
    text: 'Faktycznie zacząłem coś robić.',
    accent: 'red',
  },
  {
    id: 'click',
    visual: 'blackout',
    assetKey: OPENING_ART_ASSETS[10].key,
    assetUrl: OPENING_ART_ASSETS[10].url,
    focalPoint: { x: 0.35, y: 0.4 },
    speaker: 'DŹWIĘK',
    text: 'KLIK.',
    accent: 'red',
  },
  {
    id: 'infrastructure-blackout',
    visual: 'blackout',
    assetKey: OPENING_ART_ASSETS[11].key,
    assetUrl: OPENING_ART_ASSETS[11].url,
    focalPoint: { x: 0.38, y: 0.45 },
    coverZoom: 1.04,
    speaker: 'SYSTEM',
    text: 'A potem zgasło wszystko.',
    caption: 'ŁĄCZNIE Z NADZIEJĄ.',
    accent: 'red',
  },
  {
    id: 'cable-in-hand',
    visual: 'rj45',
    assetKey: OPENING_ART_ASSETS[12].key,
    assetUrl: OPENING_ART_ASSETS[12].url,
    focalPoint: { x: 0.64, y: 0.48 },
    coverZoom: 1.02,
    speaker: 'HUBERT',
    text: 'Zostałem sam. Z kablem RJ-45 w dłoni.',
  },
  {
    id: 'unknown-cable',
    visual: 'rj45',
    assetKey: OPENING_ART_ASSETS[13].key,
    assetUrl: OPENING_ART_ASSETS[13].url,
    focalPoint: { x: 0.62, y: 0.48 },
    coverZoom: 1.08,
    speaker: 'HUBERT',
    text: 'Nie pamiętałem, od czego był.',
  },
  {
    id: 'legend',
    visual: 'legend',
    assetKey: OPENING_ART_ASSETS[14].key,
    assetUrl: OPENING_ART_ASSETS[14].url,
    focalPoint: { x: 0.5, y: 0.48 },
    speaker: GAME_BRAND.title,
    text: GAME_BRAND.tagline,
    caption: 'TAK NARODZIŁA SIĘ LEGENDA HUBI L4.',
    accent: 'red',
  },
] as const;
