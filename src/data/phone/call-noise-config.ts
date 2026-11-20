import type { CallNoiseConfig, CallNoiseReason } from '../../domain/phone/call-noise-types';
import { navigationBuildings } from '../world/navigation-buildings';

/** Rectangles mirror the buildings and the road in the test world builder. */
export const callNoiseConfig = {
  quietZones: navigationBuildings.map(({ id, x, y, width, height }) => ({ id, x, y, width, height })),
  loudZones: [
    // Asphalt (y 615–855) plus both sidewalks along it.
    { id: 'main-street', x: 1100, y: 735, width: 2200, height: 400 },
  ],
  carAudibleDistance: 220,
} satisfies CallNoiseConfig;

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
