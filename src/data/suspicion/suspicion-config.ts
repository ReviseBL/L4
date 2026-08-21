import type { SuspicionConfig } from '../../domain/suspicion/suspicion-types';

export const suspicionConfig = {
  baseDetectionPoints: {
    coworker: 5,
    hr: 10,
    companyCar: 12,
    manager: 20,
    zus: 25,
  },
  detectionEscalation: 0.25,
  suspicionEvents: {
    missedWorkCall: 2,
    declinedWorkCall: 3,
    hrDialogueGettingBetter: 3,
    hrDialogueGreat: 8,
  },
  stealthRewards: {
    noDetections: -5,
    oneDetection: -2,
    multipleDetections: 0,
  },
  criticalSuspicion: {
    missionEndReset: 80,
    credibilityPenaltyPerIncident: 5,
    credibilityPenaltyCap: 20,
    scorePenaltyPerIncident: 1_250,
    scorePenaltyCap: 5_000,
  },
  thresholds: [
    {
      level: 'NORMAL',
      minValue: 0,
      message: null,
      viewDistanceMultiplier: 1,
      awarenessMultiplier: 1,
      searchDurationMultiplier: 1,
      shareApproximatePlayerPositionWithManager: false,
    },
    {
      level: 'SUSPICIOUS',
      minValue: 40,
      message: 'FIRMA ZACZYNA SIĘ INTERESOWAĆ',
      viewDistanceMultiplier: 1.06,
      awarenessMultiplier: 1.06,
      searchDurationMultiplier: 1.05,
      shareApproximatePlayerPositionWithManager: false,
    },
    {
      level: 'HIGH_ALERT',
      minValue: 70,
      message: 'FIRMA ZACZYNA COŚ PODEJRZEWAĆ',
      viewDistanceMultiplier: 1.08,
      awarenessMultiplier: 1.1,
      searchDurationMultiplier: 1.18,
      shareApproximatePlayerPositionWithManager: false,
    },
    {
      level: 'CRITICAL',
      minValue: 90,
      message: 'JESTEŚ NA CELOWNIKU',
      viewDistanceMultiplier: 1.1,
      awarenessMultiplier: 1.13,
      searchDurationMultiplier: 1.25,
      shareApproximatePlayerPositionWithManager: true,
    },
  ],
} as const satisfies SuspicionConfig;
