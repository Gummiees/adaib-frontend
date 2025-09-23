import { Round } from './round';
import { Team } from './team';

export type MatchStatus =
  | 'NotStarted'
  | 'OnGoing'
  | 'Finished'
  | 'Cancelled'
  | 'Rest'
  | 'NoShow';

export type MatchResult = 'Home' | 'Away';

export interface ApiMatch {
  id: number;
  homeTeamId: number;
  awayTeamId?: number;
  roundId?: number;
  date?: string | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  result?: MatchResult | null;
  status: MatchStatus;
  noShowTeamId?: number | null;
}

export type FormApiMatch = Omit<ApiMatch, 'result'>;

export interface Match {
  id: number;
  round: Round;
  homeTeam: Team;
  awayTeam?: Team;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  result?: MatchResult | null;
  status: MatchStatus;
  noShowTeam?: Team | null;
}

export interface DetailedMatch extends Match {
  phaseName: string;
  groupName: string;
}
