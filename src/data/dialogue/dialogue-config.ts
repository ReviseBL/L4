import type { DialogueTypewriterConfig } from '../../domain/dialogue/dialogue-types';

export const dialogueConfig = {
  characterDelayMs: 30,
  commaDelayMs: 55,
  sentenceDelayMs: 85,
  maxCharactersPerPage: 150,
} as const satisfies DialogueTypewriterConfig;
