import { Match } from './match';

export interface Round {
  id: number;
  name: string;
}

export interface RoundWithMatches extends Round {
  matches: Match[];
}
