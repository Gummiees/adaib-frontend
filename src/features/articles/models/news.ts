export interface News {
  id: number;
  title: string;
  subtitle?: string | null;
  content: string;
  event: 0 | 1;
}
