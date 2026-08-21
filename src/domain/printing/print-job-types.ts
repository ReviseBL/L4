export interface PrintJobDefinition {
  id: string;
  displayName: string;
  filamentType: string;
  durationLabel: string;
  description: string;
  iconTextureKey?: string;
  filamentUsage?: string;
}

export const PRINT_PROJECT_STATE = {
  Locked: 'LOCKED',
  Planned: 'PLANNED',
  MaterialsReady: 'MATERIALS_READY',
  Printing: 'PRINTING',
  Completed: 'COMPLETED',
} as const;

export type PrintProjectState = (typeof PRINT_PROJECT_STATE)[keyof typeof PRINT_PROJECT_STATE];
