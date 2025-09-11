import { Classification } from './classification';
import { ApiMatch, DetailedMatch } from './match';

export interface ApiGroup {
  id: number;
  name: string;
  actualRoundId?: number;
  matches: ApiMatch[];
  teamIds: number[];
  classification: Classification[];
}

export interface Group {
  id: number;
  name: string;
  actualRoundId?: number;
  matches: DetailedMatch[];
  teamIds: number[];
  classification: Classification[];
}
