import type {
  DialogueAdvanceResult,
  DialogueCallbacks,
  DialogueChoice,
  DialogueLine,
  DialogueResult,
  DialogueSelection,
  DialogueSequenceDefinition,
  DialogueSnapshot,
  DialogueTypewriterConfig,
} from '../domain/dialogue/dialogue-types';

interface DialogueRequest {
  definition: DialogueSequenceDefinition;
  pages: readonly DialogueLine[];
  callbacks: DialogueCallbacks;
}

export class DialogueSystem {
  private activeRequest: DialogueRequest | null = null;
  private readonly queue: DialogueRequest[] = [];
  private pageIndex = 0;
  private visibleCharacterCount = 0;
  private selectedChoiceIndex = 0;
  private characterWaitMs = 0;
  private selections: DialogueSelection[] = [];

  public constructor(private readonly config: DialogueTypewriterConfig) {
    validateConfig(config);
  }

  public showSequence(
    definition: DialogueSequenceDefinition,
    callbacks: DialogueCallbacks = {},
  ): void {
    validateDefinition(definition);
    const request: DialogueRequest = {
      definition,
      pages: paginateLines(definition.lines, this.config.maxCharactersPerPage),
      callbacks,
    };

    if (this.activeRequest) {
      this.queue.push(request);
      return;
    }

    this.startRequest(request);
  }

  public update(deltaMs: number): void {
    const line = this.getCurrentLine();
    if (!line || !this.isTyping()) return;

    this.characterWaitMs -= Math.max(0, deltaMs);
    const characters = Array.from(line.text);

    while (this.characterWaitMs <= 0 && this.visibleCharacterCount < characters.length) {
      const character = characters[this.visibleCharacterCount] ?? '';
      this.visibleCharacterCount += 1;
      this.characterWaitMs += this.delayFor(character);
    }
  }

  public advance(): DialogueAdvanceResult {
    const request = this.activeRequest;
    const line = this.getCurrentLine();
    if (!request || !line) return 'inactive';

    if (this.isTyping()) {
      this.visibleCharacterCount = Array.from(line.text).length;
      this.characterWaitMs = 0;
      return 'revealed';
    }

    const choice = line.choices?.[this.selectedChoiceIndex];
    if (choice) {
      const selection = { lineIndex: this.pageIndex, choiceId: choice.id };
      this.selections.push(selection);
      request.callbacks.onChoice?.(choice.id, this.pageIndex);
    }

    if (this.pageIndex + 1 < request.pages.length) {
      this.pageIndex += 1;
      this.resetPageState();
      return 'advanced';
    }

    this.finishActiveRequest();
    return 'completed';
  }

  public moveChoice(direction: -1 | 1): boolean {
    const line = this.getCurrentLine();
    const choices = line?.choices ?? [];
    if (!line || this.isTyping() || choices.length < 2) return false;

    this.selectedChoiceIndex =
      (this.selectedChoiceIndex + direction + choices.length) % choices.length;
    return true;
  }

  public isActive(): boolean {
    return this.activeRequest !== null;
  }

  public getSnapshot(): DialogueSnapshot {
    const request = this.activeRequest;
    const line = this.getCurrentLine();
    if (!request || !line) return inactiveSnapshot(this.queue.length);

    const characters = Array.from(line.text);
    return {
      active: true,
      dialogueId: request.definition.id,
      speaker: line.speaker ?? null,
      text: characters.slice(0, this.visibleCharacterCount).join(''),
      fullText: line.text,
      tone: line.tone ?? 'neutral',
      choices: line.choices ?? [],
      selectedChoiceIndex: this.selectedChoiceIndex,
      isTyping: this.visibleCharacterCount < characters.length,
      pauseWorld: request.definition.pauseWorld,
      lockPlayerMovement: request.definition.lockPlayerMovement,
      queueLength: this.queue.length,
      pageIndex: this.pageIndex,
      pageCount: request.pages.length,
    };
  }

  public clear(): void {
    this.activeRequest = null;
    this.queue.length = 0;
    this.pageIndex = 0;
    this.visibleCharacterCount = 0;
    this.selectedChoiceIndex = 0;
    this.characterWaitMs = 0;
    this.selections = [];
  }

  private getCurrentLine(): DialogueLine | null {
    return this.activeRequest?.pages[this.pageIndex] ?? null;
  }

  private isTyping(): boolean {
    const line = this.getCurrentLine();
    return line !== null && this.visibleCharacterCount < Array.from(line.text).length;
  }

  private startRequest(request: DialogueRequest): void {
    this.activeRequest = request;
    this.pageIndex = 0;
    this.selections = [];
    this.resetPageState();
  }

  private resetPageState(): void {
    this.visibleCharacterCount = 0;
    this.selectedChoiceIndex = 0;
    this.characterWaitMs = this.config.characterDelayMs;
  }

  private finishActiveRequest(): void {
    const completed = this.activeRequest;
    if (!completed) return;

    const result: DialogueResult = {
      dialogueId: completed.definition.id,
      selections: [...this.selections],
    };
    this.activeRequest = null;
    completed.callbacks.onComplete?.(result);

    // A completion callback may synchronously start the next part of a
    // mission sequence. Do not overwrite that request with an older queued
    // dialogue; the queued request will be picked up when the new active
    // sequence finishes.
    if (!this.activeRequest) {
      const next = this.queue.shift();
      if (next) this.startRequest(next);
    }
  }

  private delayFor(character: string): number {
    if ('.!?'.includes(character)) return this.config.sentenceDelayMs;
    if (',;:'.includes(character)) return this.config.commaDelayMs;
    return this.config.characterDelayMs;
  }
}

function paginateLines(lines: readonly DialogueLine[], maxCharacters: number): DialogueLine[] {
  return lines.flatMap((line) => {
    const chunks = splitText(line.text, maxCharacters);
    return chunks.map((text, index) => ({
      ...line,
      text,
      choices: index === chunks.length - 1 ? line.choices : undefined,
    }));
  });
}

function splitText(text: string, maxCharacters: number): string[] {
  const characters = Array.from(text);
  if (characters.length <= maxCharacters) return [text];

  const words = text.split(/\s+/u);
  const pages: string[] = [];
  let page = '';

  for (const word of words) {
    const candidate = page ? `${page} ${word}` : word;
    if (Array.from(candidate).length <= maxCharacters) {
      page = candidate;
      continue;
    }
    if (page) pages.push(page);
    page = word;
  }
  if (page) pages.push(page);
  return pages;
}

function validateDefinition(definition: DialogueSequenceDefinition): void {
  if (!definition.id || definition.lines.length === 0) {
    throw new Error('Dialogue definition requires an id and at least one line.');
  }
  for (const line of definition.lines) {
    if (!line.text) throw new Error(`Dialogue ${definition.id} contains an empty line.`);
    const ids = new Set<string>();
    for (const choice of line.choices ?? []) {
      if (!choice.id || !choice.text || ids.has(choice.id)) {
        throw new Error(`Dialogue ${definition.id} contains an invalid choice.`);
      }
      ids.add(choice.id);
    }
  }
}

function validateConfig(config: DialogueTypewriterConfig): void {
  if (
    config.characterDelayMs <= 0 ||
    config.commaDelayMs < config.characterDelayMs ||
    config.sentenceDelayMs < config.commaDelayMs ||
    config.maxCharactersPerPage < 40
  ) {
    throw new Error('Invalid dialogue typewriter configuration.');
  }
}

function inactiveSnapshot(queueLength: number): DialogueSnapshot {
  return {
    active: false,
    dialogueId: null,
    speaker: null,
    text: '',
    fullText: '',
    tone: 'neutral',
    choices: [] as readonly DialogueChoice[],
    selectedChoiceIndex: 0,
    isTyping: false,
    pauseWorld: false,
    lockPlayerMovement: false,
    queueLength,
    pageIndex: 0,
    pageCount: 0,
  };
}
