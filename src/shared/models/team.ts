import { Match } from '@shared/models/match';

export interface Team {
  id: number;
  name: string;
  shortName?: string | null;
  description?: string | null;
  location?: string | null;
  imageUrl?: string | null;
  active: boolean;
}

export interface DetailedTeam extends Team {
  phaseName: string;
  groupName: string;
  matches: Match[];
}
