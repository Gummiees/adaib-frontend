export interface Team {
  id: number;
  name: string;
  description?: string | null;
  imageUrl?: string | null;
  visible: boolean;
}
