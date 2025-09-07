import { Match } from '../../../shared/models/match';
import { Classification } from './classification';

export interface Group {
  id: number;
  name: string;
  actualRound: number;
  matches: Match[];
  teamIds: number[];
  classification: Classification[];
}
