import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month2PackageMission = {
  id: 'm2-package-run',
  campaignMonth: 2,
  title: 'PACZKA CZEKA',
  goal: 'Odbierz paczkę z automatu paczkowego i wróć do mieszkania.',
  daysPassed: 10,
  coworkerPatrolRouteId: 'parcel-loop',
  phoneCalls: [
    {
      id: 'call-m2-02-01',
      caller: 'manager',
      trigger: { type: 'elapsedTime', seconds: 25 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: quickQuestionDialogue,
    },
    {
      id: 'call-m2-02-02',
      caller: 'manager',
      trigger: { type: 'returningHome', afterStepId: 'pickup-package', delaySeconds: 8 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: recoveryCheckDialogue,
    },
  ],
  intro: [
    {
      type: 'show-sequence',
      entries: [
        { speaker: 'MISJA', text: 'PACZKA CZEKA', tone: 'system' },
        { speaker: 'NOWY CEL', text: 'Odbierz paczkę z automatu paczkowego i wróć do mieszkania.', tone: 'system' },
      ],
    },
  ],
  steps: [
    {
      id: 'pickup-package',
      objective: 'Odbierz paczkę z automatu paczkowego.',
      trigger: { type: 'interaction', targetId: 'parcel-locker' },
      interactionPrompt: '[E] ODBIERZ PACZKĘ',
      challenge: { type: 'parcel-code', codeLength: 4 },
      effects: [
        { type: 'add-item', itemId: 'package' },
        {
          type: 'show-sequence',
          entries: [{ speaker: 'ZDOBYTO', text: 'PACZKA', tone: 'success' }],
        },
      ],
    },
    {
      id: 'return-home-with-package',
      objective: 'Wróć z paczką do mieszkania.',
      trigger: { type: 'area-entered', areaId: 'home' },
      effects: [
        { type: 'remove-item', itemId: 'package' },
        {
          type: 'show-sequence',
          entries: [{ text: 'PACZKA BEZPIECZNIE W DOMU', tone: 'success' }],
        },
      ],
    },
  ],
} as const satisfies MissionDefinition;
