import type { CampaignStatisticsData, FinalRank, FinaleEndingId } from '../game-state/game-state-types';

export const ZUS_FINALE_PHASE = {
  Documents: 'DOCUMENTS',
  Questions: 'QUESTIONS',
  Inkblots: 'INKBLOTS',
  Reflex: 'REFLEX',
  WalkTest: 'WALK_TEST',
  Analysis: 'ANALYSIS',
  Verdict: 'VERDICT',
  Summary: 'SUMMARY',
} as const;

export type ZusFinalePhase = (typeof ZUS_FINALE_PHASE)[keyof typeof ZUS_FINALE_PHASE];

export interface DocumentChoiceDefinition {
  id: string;
  label: string;
  credibilityDelta: number;
  correct: boolean;
}

export interface FinaleCampaignContext {
  suspicion: number;
  hrFirstMeetingChoice: string | null;
  l4PrintCompleted: boolean;
  completedMissionCount: number;
  acquiredFilamentCount: number;
  completedPrintCount: number;
  phoneStats: { totalAnswered: number; totalMissed: number; totalDeclined: number };
  campaignStats: CampaignStatisticsData;
}

export interface ZusFinaleSnapshot {
  phase: ZusFinalePhase;
  credibility: number;
  selectedDocumentIds: readonly string[];
  sprintIncidents: number;
}

export interface FinaleResult {
  credibility: number;
  endingId: FinaleEndingId;
  score: number;
  rank: FinalRank;
}
