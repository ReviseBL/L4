import type { DialogueSequenceDefinition } from '../../domain/dialogue/dialogue-types';
import type { SuspicionEventType } from '../../domain/suspicion/suspicion-types';

export const HR_FIRST_MEETING_ID = 'hrFirstMeeting';

export const hrFirstMeetingDialogue = {
  id: 'hr-first-meeting',
  pauseWorld: true,
  lockPlayerMovement: true,
  lines: [
    {
      speaker: 'HR',
      text: 'O, cześć! Jak się czujesz?',
      tone: 'speech',
      choices: [
        { id: 'still_sick', text: 'Jeszcze słabo.' },
        { id: 'getting_better', text: 'Coraz lepiej.' },
        { id: 'great', text: 'Świetnie!' },
      ],
    },
  ],
} as const satisfies DialogueSequenceDefinition;

export const hrDialogueResponses: Readonly<Record<string, {
  eventType: SuspicionEventType | null;
  response: string;
}>> = {
  still_sick: { eventType: null, response: 'Rozumiem. Dbaj o siebie.' },
  getting_better: { eventType: 'hrDialogueGettingBetter', response: 'To dobrze. Mam nadzieję, że niedługo się zobaczymy.' },
  great: { eventType: 'hrDialogueGreat', response: 'Świetnie? To naprawdę dobra wiadomość...' },
};

export const hrRepeatMeetingDialogue = {
  id: 'hr-repeat-meeting',
  pauseWorld: true,
  lockPlayerMovement: true,
  lines: [{ speaker: 'HR', text: 'Znowu się spotykamy. Odpoczywaj rozsądnie.', tone: 'speech' }],
} as const satisfies DialogueSequenceDefinition;
