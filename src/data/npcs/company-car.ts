import type { CompanyCarDefinition } from '../../domain/npcs/company-car-types';

export const companyCarDefinition = {
  id: 'company-car',
  displayName: 'SAMOCHÓD SŁUŻBOWY',
  viewDistance: 520,
  viewHalfAngleDegrees: 42,
  drivingSpeed: 235,
  recognitionTimeMs: 620,
  suspiciousDecayMs: 850,
  spottedPresentationMs: 900,
  detectionCooldownMs: 9_000,
} as const satisfies CompanyCarDefinition;
