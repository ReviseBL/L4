export type HomeUnlockCondition =
  | { type: 'filament-spool-owned'; spoolId: string }
  | { type: 'print-completed'; printJobId: string }
  | { type: 'desk-item-owned'; itemId: string }
  | { type: 'decoration-owned'; decorationId: string }
  | { type: 'mission-completed'; missionId: string }
  | { type: 'campaign-month-at-least'; month: number };

export type HomeVisualKind = 'filament-spool' | 'printed-object' | 'desk-item' | 'decoration';

export interface HomeVisualDefinition {
  id: string;
  kind: HomeVisualKind;
  x: number;
  y: number;
  width: number;
  height: number;
  depth?: number;
  color: number;
  label: string;
  unlock: HomeUnlockCondition;
}
