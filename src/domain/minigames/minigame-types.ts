/** Filament types that each get their own threading twist. */
export type ThreadingVariantId = 'petg' | 'pla' | 'asa' | 'l4' | 'tpu';

/** Short "stop the needle in the green zone" tasks. */
export type TimingVariantId = 'nozzle' | 'print-removal';

/** What a mission asks the minigame layer to run. */
export type MinigameRequest =
  | { kind: 'threading'; variant: ThreadingVariantId }
  | { kind: 'timing'; variant: TimingVariantId };

export interface MinigameResult {
  kind: MinigameRequest['kind'];
  attempts: number;
}

export type RandomSource = () => number;

/** Implemented by the scene layer: shows the minigame and reports when it is done. */
export interface MinigameRunner {
  play(request: MinigameRequest, onDone: (result: MinigameResult) => void): void;
}

// ---------------------------------------------------------------- threading

export interface ThreadingStageConfig {
  /** Label shown above the hole, e.g. "EKSTRUDER". */
  label: string;
  /** Which printer part is drawn around the hole. */
  part: 'extruder' | 'hotend';
  /** Half-width of the hit window around the hole centre (px). */
  holeRadius: number;
  /** How far the hole slides left/right (px). 0 = static. */
  holeDriftAmplitude: number;
  /** Hole slide speed (radians per second). */
  holeDriftSpeed: number;
}

export interface ThreadingVariantConfig {
  id: ThreadingVariantId;
  /** Filament name shown on screen. */
  filamentLabel: string;
  filamentColor: number;
  /** Short description of the twist, shown before the first attempt. */
  hint: string;
  stages: readonly ThreadingStageConfig[];
  /** Hand tremor amplitude (px) before stress and mercy. */
  tremorAmplitude: number;
  /** Tremor speed (radians per second). */
  tremorSpeed: number;
  /** How fast the player can steer the hand (px per second). */
  steerSpeed: number;
  /** Max distance the hand can be steered from the centre (px). */
  steerLimit: number;
  /** Flexible filament: the tip follows the hand with this smoothing time (ms). */
  flexLagMs?: number;
  /** Fumes that periodically hide the hole (ASA). */
  fumes?: { intervalMs: number; durationMs: number };
}

export interface ThreadingRules {
  /** Each miss multiplies tremor by (1 - mercyPerMiss)… */
  mercyPerMiss: number;
  /** …but never below this factor. */
  minimumMercyFactor: number;
  /** Extra tremor at 100% suspicion (0.6 = +60%). */
  stressTremorBonus: number;
}

export type ThreadingPushOutcome = 'stage-cleared' | 'success' | 'snap';

// ---------------------------------------------------------------- timing

export interface TimingVariantConfig {
  id: TimingVariantId;
  title: string;
  instruction: string;
  /** Needle sweeps 0→1→0; full cycles per second. */
  needleCyclesPerSecond: number;
  /** Green zone centre and width on the 0..1 scale. */
  zoneCenter: number;
  zoneWidth: number;
  /** Zone widens by this much after every miss, up to maxZoneWidth. */
  zoneGrowthPerMiss: number;
  maxZoneWidth: number;
  /** Successful presses needed to finish. */
  requiredHits: number;
}

export type TimingPressOutcome = 'hit' | 'complete' | 'under' | 'over';
