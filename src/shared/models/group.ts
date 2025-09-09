import { Classification } from './classification';
import { ApiMatch, Match } from './match';

export interface ApiGroup {
  id: number;
  name: string;
  actualRound: number;
  matches: ApiMatch[];
  teamIds: number[];
  classification: Classification[];
}

export interface Group {
  id: number;
  name: string;
  actualRound: number;
  matches: Match[];
  teamIds: number[];
  classification: Classification[];
}
