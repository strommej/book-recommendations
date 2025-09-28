export interface Book {
  id: number;
  title: string;
  authors: string[];
  downloadUrl: string;
  summaries: string[];
  fullText: string;
  summaryEmbedding?: number[];
}