import { Team } from './team';

export interface ClassificationApi {
  position: number;
  teamId: number;
  points: number;
}

export interface Classification {
  id: string;
  team: Team;
  position: number;
  points: number;
}
