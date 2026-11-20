/**
 * Easter egg: Miodzik, a runaway Pomeranian, hangs around the estate in some
 * missions. He stays in one spot by a bench or a bin: stands, sits, barks
 * now and then, and sometimes lifts a leg. He does nothing else.
 */
export interface MiodzikConfig {
  /** Chance that he is out in a given mission (rolled per mission, like the neighbours). */
  chancePerMission: number;
  standMs: readonly [number, number];
  sitMs: readonly [number, number];
  /** Chance to pee after standing, when the spot has something to pee on. */
  peeChance: number;
  peeMs: number;
  /** Pause between barks, and how long the bubble stays. */
  barkEveryMs: readonly [number, number];
  barkShowMs: number;
  barkLines: readonly string[];
  /** His very first appearance is guaranteed, at this spot (by the bin next to Hubi's flat). */
  firstSpotId: string;
}

export const miodzikConfig: MiodzikConfig = {
  chancePerMission: 0.45,
  standMs: [3_000, 5_500],
  sitMs: [4_000, 8_000],
  peeChance: 0.3,
  peeMs: 2_600,
  barkEveryMs: [7_000, 13_000],
  barkShowMs: 1_800,
  barkLines: ['Hau hau!', 'Hau!', 'Hau hau hau!', 'Wrrr… hau!'],
  firstSpotId: 'bin-garden-west',
};

/** Remembered in the browser: once Miodzik has been met, later spots are random. */
export const MIODZIK_MET_KEY = 'l4.miodzikMet';

export interface MiodzikSpot {
  id: string;
  /** Where his paws are. */
  x: number;
  y: number;
  /** Faces right in the art; flipped when the bench/bin is on his right. */
  facingRight: boolean;
  /** Where the puddle goes (at the bench/bin leg). */
  puddle: { x: number; y: number };
}

/** Next to benches and the bin, rear towards the thing he marks. */
export const MIODZIK_SPOTS: readonly MiodzikSpot[] = [
  { id: 'bench-garden-west', x: 600, y: 470, facingRight: false, puddle: { x: 617, y: 470 } },
  { id: 'bin-garden-west', x: 724, y: 470, facingRight: true, puddle: { x: 710, y: 470 } },
  { id: 'bench-garden-east', x: 1330, y: 450, facingRight: true, puddle: { x: 1313, y: 450 } },
  { id: 'bench-playground', x: 1990, y: 482, facingRight: false, puddle: { x: 2007, y: 482 } },
  { id: 'bench-block-23', x: 440, y: 1050, facingRight: true, puddle: { x: 423, y: 1050 } },
  { id: 'bench-kebab', x: 1612, y: 1372, facingRight: true, puddle: { x: 1595, y: 1372 } },
];

/** Idle sheet (stand ×2, sit ×2, pee ×2), picked up when the file exists. */
export const MIODZIK_SPRITE = {
  key: 'npc-miodzik',
  url: 'assets/characters/npc-miodzik.png',
  frameWidth: 34,
  frameHeight: 32,
  frames: { stand: [0, 1], sit: [2, 3], pee: [4, 5] },
} as const;

/** Run-cycle sheet (6 frames); its first frame stands in until the idle sheet arrives. */
export const DOG_SPRITE = {
  key: 'npc-pomeranian-run',
  url: 'assets/characters/npc-pomeranian-run.png',
  frameWidth: 38,
  frameHeight: 29,
} as const;
