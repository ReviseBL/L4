export type PlayerDirection = 'down' | 'up' | 'left' | 'right';

export type PlayerVisualAction =
  | 'idle'
  | 'walk'
  | 'sprint'
  | 'carry-idle'
  | 'carry-walk'
  | 'phone'
  | 'interact';

export interface PlayerVisualStateInput {
  direction: PlayerDirection;
  moving: boolean;
  sprinting: boolean;
  carrying: boolean;
  phoneActive: boolean;
  hidden: boolean;
  interacting: boolean;
}

export interface PlayerVisualSelection {
  action: PlayerVisualAction;
  direction: PlayerDirection;
  hidden: boolean;
}

