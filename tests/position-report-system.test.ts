import { describe, expect, it } from 'vitest';
import { positionReportConfig } from '../src/data/npcs/position-report-config';
import { PositionReportSystem } from '../src/systems/position-report-system';

describe('PositionReportSystem', () => {
  it('provides deterministic approximate targets and expires', () => {
    const system = new PositionReportSystem(positionReportConfig);
    expect(system.reportPlayer({ x: 100, y: 200 }, 1_000)).toMatchObject({ source: 'companyCar', reportedAtMs: 1_000 });
    expect(system.getInvestigationTarget('coworker', 2_000)).toEqual({ x: 148, y: 170 });
    expect(system.getInvestigationTarget('hr', 2_000)).toEqual({ x: 76, y: 218 });
    expect(system.getInvestigationTarget('manager', 2_000)).toEqual({ x: 136, y: 242 });
    expect(system.update(13_000)).toBe(true);
    expect(system.getActiveReport(13_000)).toBeNull();
  });

  it('is runtime-only and starts empty after recreation', () => {
    const previous = new PositionReportSystem(positionReportConfig);
    previous.reportPlayer({ x: 1, y: 2 }, 0);
    expect(new PositionReportSystem(positionReportConfig).getActiveReport(1)).toBeNull();
  });
});
