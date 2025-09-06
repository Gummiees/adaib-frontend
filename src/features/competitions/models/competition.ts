export type CompetitionStatus = 'NotStarted' | 'OnGoing' | 'Finished';

export interface Competition {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  visible: boolean;
  status: CompetitionStatus;
  startDate?: Date | null;
  endDate?: Date | null;
}
