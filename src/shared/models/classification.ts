import { Team } from './team';

export interface ClassificationApi {
  position: number;
  teamId: number;
  points: number;
  played: number;
  wins: number;
  draws: number;
  loses: number;
  scored: number;
  conced: number;
  difference: number;
}

export type Classification = Omit<ClassificationApi, 'teamId'> & {
  id: string;
  team: Team;
};
