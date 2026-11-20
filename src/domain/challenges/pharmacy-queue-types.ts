export type SeniorId = 'halinka' | 'zdzislaw' | 'jadzia';

export interface SeniorDefinition {
  id: SeniorId;
  displayName: string;
  /** Placeholder colour until the ChatGPT sprite exists. */
  placeholderColor: number;
  /** Texture key of the real sprite (loaded only when the art exists). */
  textureKey: string;
}

export interface QueueLine {
  speaker: 'senior' | 'pharmacist';
  text: string;
}

export interface QueueCustomer {
  seniorId: SeniorId;
  /** Small talk at the counter; serving takes lines × lineMs. */
  lines: readonly QueueLine[];
}

export interface PharmacyQueueDefinition {
  id: string;
  customers: readonly QueueCustomer[];
}

export interface PharmacyQueueConfig {
  /** How long each spoken line stays above the senior's head (ms). */
  lineMs: number;
  /** Player counts as "in the queue" within this distance of the end spot (px). */
  playerZoneRadius: number;
  /** World positions: serving spot first, then waiting spots. */
  spots: readonly { x: number; y: number }[];
  /** Where the player waits (end of the queue). */
  playerSpot: { x: number; y: number };
  /** Where served seniors walk to before disappearing. */
  exit: { x: number; y: number };
  /** The pharmacist stands behind the counter. */
  pharmacistSpot: { x: number; y: number };
}

export type PharmacyQueueEvent =
  | { type: 'served'; customerIndex: number }
  | { type: 'your-turn' };
