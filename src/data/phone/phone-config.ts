import type { PhoneSystemConfig } from '../../domain/phone/phone-types';

export const phoneConfig = {
  minimumCallCooldownSeconds: 15,
  airplaneModeDurationSeconds: 30,
  maximumCallsPerMission: 3,
} as const satisfies PhoneSystemConfig;
