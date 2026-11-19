export interface NoiseRect {
  id: string;
  /** Centre and size, like the world builder uses. */
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface CallNoiseConfig {
  /** Indoors: walls cut the street noise completely. */
  quietZones: readonly NoiseRect[];
  /** Outdoors and here the manager hears traffic. */
  loudZones: readonly NoiseRect[];
  /** A moving company car this close is audible anywhere outdoors (px). */
  carAudibleDistance: number;
}

export type CallNoiseReason = 'indoors' | 'hidden' | 'street' | 'car' | 'open-air';

export interface CallNoiseInput {
  position: { x: number; y: number };
  /** Player is hiding (bushes, bins): muffled. */
  hidden: boolean;
  cars: readonly { x: number; y: number }[];
}

export interface CallNoiseResult {
  loud: boolean;
  reason: CallNoiseReason;
  /** Which zone decided it, for messages/debug. */
  zoneId: string | null;
}
