export type ActionInputOwner = 'DIALOGUE' | 'SUMMARY' | 'MONTH_TRANSITION' | 'GAMEPLAY';

export interface ActionInputContext {
  dialogueActive: boolean;
  summaryVisible: boolean;
  monthTransitionVisible: boolean;
}

/**
 * Resolves the single owner of the E action for the current frame.
 * The physical key edge is read once by GameScene; this class only decides
 * which system may consume that edge.
 */
export class ActionInputRouter {
  public resolve(context: Readonly<ActionInputContext>): ActionInputOwner {
    if (context.dialogueActive) return 'DIALOGUE';
    if (context.summaryVisible) return 'SUMMARY';
    if (context.monthTransitionVisible) return 'MONTH_TRANSITION';
    return 'GAMEPLAY';
  }
}
