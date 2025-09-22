import { DetailedMatch } from './match';

export interface Team {
  id: number;
  name: string;
  shortName?: string | null;
  description?: string | null;
  location?: string | null;
  arena?: string | null;
  arenaUrl?: string | null;
  imageUrl?: string | null;
  active: boolean;
}

export interface DetailedTeam extends Team {
  matches: DetailedMatch[];
}
