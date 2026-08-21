import type { PositionReportConfig } from '../../systems/position-report-system';

export const positionReportConfig = {
  durationMs: 12_000,
  coworkerOffset: { x: 48, y: -30 },
  hrOffset: { x: -24, y: 18 },
  managerOffset: { x: 36, y: 42 },
} as const satisfies PositionReportConfig;
