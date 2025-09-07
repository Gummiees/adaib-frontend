export interface Card {
  id: number;
  title: string;
  subtitle?: string | null;
  imageUrl?: string | null;
  imageAlt?: string | null;
  link?: string | null;
}
