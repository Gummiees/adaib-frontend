import { Group } from './group';

export interface Phase {
  id: number;
  name: string;
  groups: Group[];
}
