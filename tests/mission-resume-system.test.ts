import { describe, expect, it } from 'vitest';
import { verticalSliceMissions } from '../src/data/missions/vertical-slice-missions';
import { resolveMissionResumePosition } from '../src/systems/mission-resume-system';

const home = { id: 'home', x: 285, y: 285, width: 360, height: 300 };

describe('mission resume checkpoints', () => {
  it('resumes a return-home step outside the destination trigger', () => {
    const position = resolveMissionResumePosition({
      missions: verticalSliceMissions,
      missionId: 'm4-large-package-run',
      stepIndex: 1,
      defaultPosition: { x: 285, y: 295 },
      areas: [home],
    });

    expect(position).toEqual({ x: 285, y: 499 });
    expect(Math.abs(position.y - home.y)).toBeGreaterThan(home.height / 2);
  });

  it('keeps the apartment spawn for an objective that has not been collected', () => {
    expect(resolveMissionResumePosition({
      missions: verticalSliceMissions,
      missionId: 'm4-large-package-run',
      stepIndex: 0,
      defaultPosition: { x: 285, y: 295 },
      areas: [home],
    })).toEqual({ x: 285, y: 295 });
  });
});
