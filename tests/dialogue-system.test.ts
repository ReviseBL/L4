import { describe, expect, it, vi } from 'vitest';
import { dialogueConfig } from '../src/data/dialogue/dialogue-config';
import type { DialogueSequenceDefinition } from '../src/domain/dialogue/dialogue-types';
import { DialogueSystem } from '../src/systems/dialogue-system';

const conversation: DialogueSequenceDefinition = {
  id: 'conversation',
  pauseWorld: false,
  lockPlayerMovement: true,
  lines: [
    { speaker: 'KIEROWNIK', text: 'Cześć, jak się czujesz?' },
    { speaker: 'BOHATER', text: 'Jeszcze dochodzę do siebie.' },
  ],
};

describe('DialogueSystem', () => {
  it('types text, reveals it on the first advance, and changes page on the second', () => {
    const system = new DialogueSystem(dialogueConfig);
    system.showSequence(conversation);

    system.update(60);
    expect(system.getSnapshot().text.length).toBeGreaterThan(0);
    expect(system.getSnapshot().isTyping).toBe(true);

    expect(system.advance()).toBe('revealed');
    expect(system.getSnapshot().text).toBe('Cześć, jak się czujesz?');
    expect(system.advance()).toBe('advanced');
    expect(system.getSnapshot().speaker).toBe('BOHATER');
  });

  it('never closes automatically and completes only after explicit advances', () => {
    const onComplete = vi.fn();
    const system = new DialogueSystem(dialogueConfig);
    system.showSequence(conversation, { onComplete });

    system.update(60_000);
    expect(system.isActive()).toBe(true);
    expect(onComplete).not.toHaveBeenCalled();

    system.advance();
    system.update(60_000);
    system.advance();
    expect(system.isActive()).toBe(false);
    expect(onComplete).toHaveBeenCalledWith({ dialogueId: 'conversation', selections: [] });
  });

  it('queues important sequences instead of replacing the current dialogue', () => {
    const completed: string[] = [];
    const system = new DialogueSystem(dialogueConfig);
    system.showSequence(
      { ...conversation, id: 'first', lines: [{ text: 'Pierwszy komunikat.' }] },
      { onComplete: ({ dialogueId }) => completed.push(dialogueId) },
    );
    system.showSequence(
      { ...conversation, id: 'second', lines: [{ text: 'Drugi komunikat.' }] },
      { onComplete: ({ dialogueId }) => completed.push(dialogueId) },
    );

    expect(system.getSnapshot().queueLength).toBe(1);
    system.advance();
    system.advance();
    expect(system.getSnapshot().dialogueId).toBe('second');
    expect(completed).toEqual(['first']);
  });

  it('does not overwrite a sequence started by an onComplete callback when another dialogue is queued', () => {
    const system = new DialogueSystem(dialogueConfig);
    system.showSequence(
      { ...conversation, id: 'first', lines: [{ text: 'Pierwszy.' }] },
      {
        onComplete: () => system.showSequence({
          ...conversation,
          id: 'callback-chain',
          lines: [{ text: 'Kontynuacja efektu misji.' }],
        }),
      },
    );
    system.showSequence({ ...conversation, id: 'queued', lines: [{ text: 'Zakolejkowany HR.' }] });

    system.advance();
    system.advance();
    expect(system.getSnapshot().dialogueId).toBe('callback-chain');
    expect(system.getSnapshot().queueLength).toBe(1);

    system.advance();
    system.advance();
    expect(system.getSnapshot().dialogueId).toBe('queued');
  });

  it('supports keyboard-style choice navigation without owning story consequences', () => {
    const onChoice = vi.fn();
    const system = new DialogueSystem(dialogueConfig);
    system.showSequence(
      {
        id: 'choice',
        pauseWorld: true,
        lockPlayerMovement: true,
        lines: [
          {
            speaker: 'HR',
            text: 'Jak się czujesz?',
            choices: [
              { id: 'bad', text: 'Jeszcze słabo.' },
              { id: 'better', text: 'Coraz lepiej.' },
              { id: 'great', text: 'Świetnie!' },
            ],
          },
        ],
      },
      { onChoice },
    );

    system.advance();
    expect(system.moveChoice(1)).toBe(true);
    expect(system.getSnapshot().selectedChoiceIndex).toBe(1);
    system.advance();
    expect(onChoice).toHaveBeenCalledWith('better', 0);
  });

  it('paginates long Polish text without breaking Unicode characters', () => {
    const system = new DialogueSystem({ ...dialogueConfig, maxCharactersPerPage: 40 });
    system.showSequence({
      ...conversation,
      id: 'polish',
      lines: [
        {
          text: 'Zażółć gęślą jaźń. Podejrzliwość rośnie, ale bohater wciąż drukuje absurdalne uchwyty.',
        },
      ],
    });

    expect(system.getSnapshot().pageCount).toBeGreaterThan(1);
    system.advance();
    expect(system.getSnapshot().fullText).toContain('Zażółć');
  });
});
