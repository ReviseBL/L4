import type { MissionDefinition } from '../../domain/missions/mission-types';
import { quickQuestionDialogue, recoveryCheckDialogue } from '../phone/manager-call-dialogues';

export const month4LargePackageMission = {
  id: 'm4-large-package-run', campaignMonth: 4, title: 'PACZKA JEST DUŻA',
  goal: 'Odbierz dużą paczkę i wróć do mieszkania.', daysPassed: 10,
  coworkerPatrolRouteId: 'parcel-loop', hrPatrolRouteId: 'tech-loop', companyCarRouteId: 'parcel-road-loop',
  phoneCalls: [
    { id: 'call-m4-02-01', caller: 'manager', trigger: { type: 'elapsedTime', seconds: 24 }, ringDuration: 6, answerDuration: 4, dialogue: quickQuestionDialogue },
    { id: 'call-m4-02-02', caller: 'manager', trigger: { type: 'returningHome', afterStepId: 'pickup-large-package', delaySeconds: 8 }, ringDuration: 6, answerDuration: 4, dialogue: recoveryCheckDialogue },
  ],
  steps: [
    { id: 'pickup-large-package', objective: 'Odbierz dużą paczkę z automatu.', trigger: { type: 'interaction', targetId: 'parcel-locker' }, interactionPrompt: '[E] ODBIERZ DUŻĄ PACZKĘ', effects: [{ type: 'add-item', itemId: 'large-package' }, { type: 'show-sequence', entries: [{ speaker: 'ZDOBYTO', text: 'DUŻA PACZKA', tone: 'success' }] }] },
    { id: 'return-large-package', objective: 'Wróć z dużą paczką do mieszkania.', trigger: { type: 'area-entered', areaId: 'home' }, effects: [{ type: 'remove-item', itemId: 'large-package' }, { type: 'show-sequence', entries: [{ text: 'PACZKA W DOMU. KRĘGOSŁUP NIEKONIECZNIE.', tone: 'success' }] }] },
  ],
} as const satisfies MissionDefinition;
