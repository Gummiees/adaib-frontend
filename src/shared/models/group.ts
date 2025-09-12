import { Classification } from './classification';
import { ApiMatch, DetailedMatch } from './match';
import { Round } from './round';

export interface ApiGroup {
  id: number;
  name: string;
  actualRoundId?: number | null;
  matches: ApiMatch[];
  teamIds: number[];
  classification: Classification[];
}

export interface Group {
  id: number;
  name: string;
  actualRound?: Round | null;
  matches: DetailedMatch[];
  teamIds: number[];
  classification: Classification[];
}
