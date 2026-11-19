import type { CallNoiseConfig, CallNoiseReason } from '../../domain/phone/call-noise-types';

/** Rectangles mirror the buildings and the road in the test world builder. */
export const callNoiseConfig = {
  quietZones: [
    { id: 'home', x: 285, y: 285, width: 430, height: 390 },
    { id: 'chwilka', x: 970, y: 315, width: 360, height: 330 },
    { id: '3d-shop', x: 1630, y: 315, width: 430, height: 350 },
    { id: 'pharmacy', x: 780, y: 1170, width: 360, height: 300 },
  ],
  loudZones: [
    // Asphalt (y 615–855) plus both sidewalks along it.
    { id: 'main-street', x: 1100, y: 735, width: 2200, height: 400 },
  ],
  carAudibleDistance: 220,
} as const satisfies CallNoiseConfig;

/** Short label for the phone panel while it rings. */
export const callNoiseLabels = {
  indoors: 'CICHO (ŚCIANY TŁUMIĄ HAŁAS)',
  hidden: 'CICHO (KRYJÓWKA)',
  'open-air': 'CICHO',
  street: 'GŁOŚNO (RUCH ULICZNY)',
  car: 'GŁOŚNO (SAMOCHÓD OBOK)',
} as const satisfies Record<CallNoiseReason, string>;

/** What the manager says when he hears it. */
export const callNoiseManagerLines = {
  street: 'Co tak hałasuje? Jesteś na ulicy?',
  car: 'Słyszę samochód. Gdzie ty właściwie jesteś?',
} as const;
