import type { MissionDefinition } from '../../domain/missions/mission-types';

export const filamentMission = {
  id: 'filament-run',
  campaignMonth: 1,
  title: 'FILAMENT SIĘ SKOŃCZYŁ',
  goal: 'Kup szpulę filamentu do drukarki 3D.',
  daysPassed: 4,
  intro: [
    {
      type: 'show-sequence',
      entries: [{ speaker: 'MISJA', text: 'FILAMENT SIĘ SKOŃCZYŁ', tone: 'system' }],
    },
  ],
  completionEffects: [{ type: 'complete-print', printJobId: 'cable-holder' }],
  steps: [
    {
      id: 'inspect-empty-printer',
      objective: 'Podejdź do drukarki 3D i sprawdź filament.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] SPRAWDŹ DRUKARKĘ 3D',
      effects: [
        {
          type: 'show-sequence',
          entries: [
            { speaker: 'DRUKARKA 3D', text: 'BEEP BEEP\nFILAMENT: 0%', tone: 'system' },
            { speaker: 'BOHATER', text: 'Kurwa.', tone: 'speech' },
            { speaker: 'NOWY CEL', text: 'Kup szpulę filamentu do drukarki 3D.', tone: 'system' },
          ],
        },
      ],
    },
    {
      id: 'buy-petg-spool',
      objective: 'Kup szpulę filamentu do drukarki 3D.',
      trigger: { type: 'interaction', targetId: 'filament-shelf' },
      interactionPrompt: '[E] KUP FILAMENT',
      effects: [
        { type: 'add-item', itemId: 'petg-spool' },
        {
          type: 'show-sequence',
          entries: [{ speaker: 'ZDOBYTO', text: 'SZPULA PETG', tone: 'success' }],
        },
      ],
    },
    {
      id: 'load-petg',
      objective: 'Wróć do mieszkania i załaduj filament do drukarki.',
      trigger: { type: 'interaction', targetId: 'home-printer' },
      interactionPrompt: '[E] ZAŁADUJ FILAMENT PETG',
      effects: [
        { type: 'play-minigame', minigame: { kind: 'threading', variant: 'petg' } },
        { type: 'remove-item', itemId: 'petg-spool' },
        { type: 'add-filament-spool', spoolId: 'petg' },
        { type: 'start-print', printJobId: 'cable-holder' },
        {
          type: 'show-sequence',
          entries: [
            { speaker: 'DRUKARKA 3D', text: 'FILAMENT PETG ZAŁADOWANY', tone: 'success' },
            { speaker: 'DRUKARKA 3D', text: 'DRUKOWANIE: UCHWYT DO KABLA\nCZAS DRUKU: 7h 42m', tone: 'system' },
          ],
        },
      ],
    },
  ],
} as const satisfies MissionDefinition;
