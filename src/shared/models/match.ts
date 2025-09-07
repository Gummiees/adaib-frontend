export type MatchStatus =
  | 'NotStarted'
  | 'Ongoing'
  | 'Finished'
  | 'Cancelled'
  | 'Postponed';

export interface Match {
  id: number;
  round: number;
  homeTeamId: number;
  awayTeamId: number;
  date?: Date | null;
  homeTeamScore?: number | null;
  awayTeamScore?: number | null;
  location?: string | null;
  status: MatchStatus;
}
