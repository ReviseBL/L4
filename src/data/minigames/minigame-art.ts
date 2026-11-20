/**
 * Exported minigame art (sources and processing script in art/minigames/).
 * Pixel coordinates below refer to the exported PNGs.
 */
export const MINIGAME_ART_TEXTURES = [
  { key: 'mg-extruder', url: 'assets/minigames/mg-extruder.png' },
  { key: 'mg-hotend', url: 'assets/minigames/mg-hotend.png' },
  { key: 'mg-hotend-large', url: 'assets/minigames/mg-hotend-large.png' },
  { key: 'mg-hand', url: 'assets/minigames/mg-hand.png' },
  { key: 'mg-hand-tense', url: 'assets/minigames/mg-hand-tense.png' },
  { key: 'mg-snap-0', url: 'assets/minigames/mg-snap-0.png' },
  { key: 'mg-snap-1', url: 'assets/minigames/mg-snap-1.png' },
  { key: 'mg-snap-2', url: 'assets/minigames/mg-snap-2.png' },
  { key: 'mg-fumes-0', url: 'assets/minigames/mg-fumes-0.png' },
  { key: 'mg-fumes-1', url: 'assets/minigames/mg-fumes-1.png' },
  { key: 'mg-fumes-2', url: 'assets/minigames/mg-fumes-2.png' },
  { key: 'mg-wrench', url: 'assets/minigames/mg-wrench.png' },
  { key: 'mg-print-bed', url: 'assets/minigames/mg-print-bed.png' },
  { key: 'mg-spatula', url: 'assets/minigames/mg-spatula.png' },
  { key: 'mg-locker-panel', url: 'assets/minigames/mg-locker-panel.png' },
  { key: 'senior-halinka', url: 'assets/characters/senior-halinka.png' },
  { key: 'senior-zdzislaw', url: 'assets/characters/senior-zdzislaw.png' },
  { key: 'senior-jadzia', url: 'assets/characters/senior-jadzia.png' },
] as const;

/** Where the filament has to go, in exported-image pixels. */
export const MINIGAME_ART_ANCHORS = {
  extruderHole: { x: 93, y: 4 },
  hotendHole: { x: 73, y: 8 },
  hotendLargeNozzle: { x: 111, y: 192 },
  /** Pinch point between thumb and finger (origin 0..1) of the flipped hands. */
  handPinch: { x: 0.963, y: 0.87 },
  handTensePinch: { x: 0.954, y: 0.834 },
  /** Jaw of the wrench (origin 0..1). */
  wrenchJaw: { x: 0.074, y: 0.5 },
  /** Bottom edge of the printed L4 sign on the bed: from x, to x, y. */
  printBottom: { fromX: 78, toX: 266, y: 172 },
} as const;
