import type { Point2D } from '../core/math/geometry-types';
import type { MissionDefinition } from '../domain/missions/mission-types';
import type { AreaDefinition } from './area-trigger-system';

export interface MissionResumeQuery {
  missions: readonly MissionDefinition[];
  missionId: string | null;
  stepIndex: number;
  defaultPosition: Point2D;
  areas: readonly AreaDefinition[];
}

/**
 * A saved return-home step must resume just outside its destination area.
 * Starting inside would emit area-entered on the first frame and allow a
 * reload to skip the entire stealth return route.
 */
export function resolveMissionResumePosition(query: MissionResumeQuery): Point2D {
  const mission = query.missions.find((candidate) => candidate.id === query.missionId);
  const step = mission?.steps[query.stepIndex];
  const trigger = step?.trigger;

  if (!trigger || trigger.type !== 'area-entered') {
    return { ...query.defaultPosition };
  }

  const destination = query.areas.find((area) => area.id === trigger.areaId);
  if (!destination) {
    return { ...query.defaultPosition };
  }

  return {
    x: destination.x,
    y: destination.y + destination.height / 2 + 64,
  };
}
