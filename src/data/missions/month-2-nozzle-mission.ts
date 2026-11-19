import type { MissionDefinition } from '../../domain/missions/mission-types';
import {
  quickQuestionDialogue,
  recoveryCheckDialogue,
  statusUpdateDialogue,
} from '../phone/manager-call-dialogues';

export const month2NozzleMission = {
  id: 'm2-nozzle-run',
  campaignMonth: 2,
  title: 'DYSZA 0,6 MM',
  goal: 'Kup dyszę 0,6 mm w sklepie 3D i zainstaluj ją w drukarce.',
  daysPassed: 10,
  coworkerPatrolRouteId: '3d-shop-loop',
  phoneCalls: [
    {
      id: 'call-m2-03-01',
      caller: 'manager',
      trigger: { type: 'elapsedTime', seconds: 20 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: quickQuestionDialogue,
    },
    {
      id: 'call-m2-03-02',
      caller: 'manager',
      trigger: { type: 'itemPickedUp', itemId: 'nozzle-0-6', delaySeconds: 6 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: statusUpdateDialogue,
    },
    {
      id: 'call-m2-03-03',
      caller: 'manager',
      trigger: { type: 'returningHome', afterStepId: 'buy-nozzle-0-6', delaySeconds: 28 },
      ringDuration: 6,
      answerDuration: 4,
      dialogue: recoveryCheckDialogue,
    },
  ],
  intro: [
    {
      type: 'show-sequence',
      entries: [
        { speaker: 'DRUKARKA 3D', text: 'DYSZA: 0,4 MM', tone: 'system' },
        { speaker: 'BOHATER', text: 'Za wolno.', tone: 'speech' },
        { speaker: 'NOWY CEL', text: 'Kup dyszę 0,6 mm w sklepie 3D.', tone: 'system' },
      ],
    },
  ],
  steps: [
    {
      id: 'inspect-nozzle',
      objective: 'Sprawdź obecną dyszę w drukarce 3D.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] SPRAWDŹ DYSZĘ',
    },
    {
      id: 'buy-nozzle-0-6',
      objective: 'Kup dyszę 0,6 mm w sklepie 3D.',
      trigger: { type: 'interaction', targetId: 'nozzle-shelf' },
      interactionPrompt: '[E] KUP DYSZĘ 0,6 MM',
      effects: [
        { type: 'add-item', itemId: 'nozzle-0-6' },
        {
          type: 'show-sequence',
          entries: [{ speaker: 'ZDOBYTO', text: 'DYSZA 0,6 MM', tone: 'success' }],
        },
      ],
    },
    {
      id: 'install-nozzle-0-6',
      objective: 'Wróć do mieszkania i zainstaluj dyszę w drukarce.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] ZAINSTALUJ DYSZĘ 0,6 MM',
      effects: [
        { type: 'play-minigame', minigame: { kind: 'timing', variant: 'nozzle' } },
        { type: 'remove-item', itemId: 'nozzle-0-6' },
        { type: 'add-desk-item', itemId: 'nozzle-0-6-installed' },
        {
          type: 'show-sequence',
          entries: [
            { speaker: 'DRUKARKA 3D', text: 'DYSZA 0,6 MM ZAINSTALOWANA', tone: 'success' },
            { speaker: 'BOHATER', text: 'Teraz to będzie drukować.', tone: 'speech' },
          ],
        },
      ],
    },
  ],
} as const satisfies MissionDefinition;
