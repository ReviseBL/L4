export interface CarryVisualDefinition {
  label: string;
  color: number;
  size?: 'small' | 'large';
}

export interface ItemDefinition {
  id: string;
  displayName: string;
  description: string;
  sprintMultiplier?: number;
  /** Heavy load: slower walk and no sprint while carried. */
  heavyCarry?: { walkMultiplier: number };
  unavailableHideSpotIds?: readonly string[];
  carryVisual?: CarryVisualDefinition;
}
