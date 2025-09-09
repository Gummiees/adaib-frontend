import { ApiGroup, Group } from './group';
import { Round, RoundWithMatches } from './round';

export interface ApiPhase {
  id: number;
  name: string;
  groups: ApiGroup[];
  rounds: Round[];
}

export interface Phase {
  id: number;
  name: string;
  groups: Group[];
  rounds: Round[];
}

export interface CustomPhase extends Phase {
  roundsWithMatches: RoundWithMatches[];
}
