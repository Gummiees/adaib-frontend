import { ApiGroup, Group } from './group';

export interface ApiPhase {
  id: number;
  name: string;
  groups: ApiGroup[];
}

export interface Phase {
  id: number;
  name: string;
  groups: Group[];
}
