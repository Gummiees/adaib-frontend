import { Team } from './team';

export type MatchStatus =
  | 'NotStarted'
  | 'Ongoing'
  | 'Finished'
  | 'Cancelled'
  | 'Postponed'
  | 'Rest';

export interface ApiMatch {
  id: number;
  round: number;
  homeTeamId: number;
  awayTeamId?: number;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  location?: string | null;
  status: MatchStatus;
}

export interface Match {
  id: number;
  round: number;
  homeTeam: Team;
  awayTeam?: Team;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  location?: string | null;
  status: MatchStatus;
}
