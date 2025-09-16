import { Team } from '@shared/models/team';
import { ApiPhase, Phase } from './phase';

export type CompetitionStatus = 'NotStarted' | 'Ongoing' | 'Finished';

export interface ApiCompetition {
  id: number;
  sportName: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  status: CompetitionStatus;
  startDate?: string | null;
  endDate?: string | null;
}

export interface DetailedApiCompetition extends ApiCompetition {
  teams: Team[];
  phases: ApiPhase[];
}

export interface Competition {
  id: number;
  sportName: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  status: CompetitionStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}

export interface DetailedCompetition extends Competition {
  teams: Team[];
  phases: Phase[];
}
