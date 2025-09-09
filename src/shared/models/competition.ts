import { Team } from '@shared/models/team';
import { ApiPhase, Phase } from './phase';

export type CompetitionStatus = 'NotStarted' | 'Ongoing' | 'Finished';

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

export interface DetailedApiCompetition {
  id: number;
  sportName: string;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  active: boolean;
  status: CompetitionStatus;
  startDate?: Date | null;
  endDate?: Date | null;
  teams: Team[];
  phases: ApiPhase[];
}
