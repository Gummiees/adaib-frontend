import { Round } from './round';
import { Team } from './team';

export type MatchStatus =
  | 'NotStarted'
  | 'Ongoing'
  | 'Finished'
  | 'Cancelled'
  | 'Rest';

export type MatchResult = 'Home' | 'Away' | 'Draw';

export interface ApiMatch {
  id: number;
  homeTeamId: number;
  awayTeamId?: number;
  roundId?: number;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  location?: string | null;
  result?: MatchResult;
  status: MatchStatus;
}

export interface Match {
  id: number;
  round: Round;
  homeTeam: Team;
  awayTeam?: Team;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  location?: string | null;
  result?: MatchResult;
  status: MatchStatus;
}

export interface DetailedMatch extends Match {
  phaseName: string;
  groupName: string;
}
