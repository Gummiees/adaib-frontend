import { DetailedMatch } from '@shared/models/match';
import { Round } from '@shared/models/round';
import { Team } from '@shared/models/team';

export interface PlayoffSeedSlot {
  seed: number;
  team: Team | null;
}

export interface PlayoffMatchView {
  index: number;
  legs: PlayoffLegView[];
  homeTeam: Team | null;
  awayTeam: Team | null;
  winner: Team | null;
  isTwoLegged: boolean;
  aggregateHomeScore: number | null;
  aggregateAwayScore: number | null;
}

export interface PlayoffLegView {
  index: number;
  match: DetailedMatch | null;
  homeTeam: Team | null;
  awayTeam: Team | null;
  dateDraftKey: string;
  locationDraftKey: string;
}

export interface PlayoffRoundView {
  index: number;
  name: string;
  round: Round | null;
  matches: PlayoffMatchView[];
}

export type ScoreSide = 'home' | 'away';

export interface ScoreDraft {
  home: string;
  away: string;
}
