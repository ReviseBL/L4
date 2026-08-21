export type DialogueTone = 'neutral' | 'system' | 'speech' | 'success' | 'warning';

export interface DialogueChoice {
  id: string;
  text: string;
}

export interface DialogueLine {
  speaker?: string;
  text: string;
  tone?: DialogueTone;
  choices?: readonly DialogueChoice[];
}

export interface DialogueSequenceDefinition {
  id: string;
  pauseWorld: boolean;
  lockPlayerMovement: boolean;
  lines: readonly DialogueLine[];
}

export interface DialogueSelection {
  lineIndex: number;
  choiceId: string;
}

export interface DialogueResult {
  dialogueId: string;
  selections: readonly DialogueSelection[];
}

export interface DialogueCallbacks {
  onComplete?: (result: DialogueResult) => void;
  onChoice?: (choiceId: string, lineIndex: number) => void;
}

export interface DialogueTypewriterConfig {
  characterDelayMs: number;
  commaDelayMs: number;
  sentenceDelayMs: number;
  maxCharactersPerPage: number;
}

export interface DialogueSnapshot {
  active: boolean;
  dialogueId: string | null;
  speaker: string | null;
  text: string;
  fullText: string;
  tone: DialogueTone;
  choices: readonly DialogueChoice[];
  selectedChoiceIndex: number;
  isTyping: boolean;
  pauseWorld: boolean;
  lockPlayerMovement: boolean;
  queueLength: number;
  pageIndex: number;
  pageCount: number;
}

export type DialogueAdvanceResult = 'inactive' | 'revealed' | 'advanced' | 'completed';
