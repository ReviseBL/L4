/** A window in a building's street wall. */
export interface BuildingWindow {
  id: string;
  buildingId: string;
  /** Centre of the window on the wall. */
  x: number;
  wallY: number;
  /** Which way the street is: 'down' for the north buildings, 'up' for the pharmacy. */
  facing: 'down' | 'up';
  /** Safe windows (home, pharmacy) never raise suspicion. */
  safe: boolean;
}

export interface WindowWatchConfig {
  /** How long Hubi may stand still in front of an unsafe window before someone notices. */
  noticeAfterMs: number;
  /** Quiet time after a notice, so one stop does not stack points. */
  cooldownMs: number;
  /** Zone in front of the window: half-width and depth from the wall face. */
  halfWidth: number;
  depth: number;
  wallHalfThickness: number;
}

export interface WindowWatchEvent {
  window: BuildingWindow;
}
