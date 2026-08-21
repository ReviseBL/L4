export type TitleFlowAction = 'new-game' | 'continue';

export const TITLE_FLOW_SCENE = {
  opening: 'OpeningScene',
  campaign: 'GameScene',
} as const;

export function resolveTitleFlowScene(action: TitleFlowAction): string {
  return action === 'new-game' ? TITLE_FLOW_SCENE.opening : TITLE_FLOW_SCENE.campaign;
}

