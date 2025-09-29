import type { Book } from "./types.js";
import { type FeatureExtractionPipeline, pipeline } from "@xenova/transformers";

let embedder: FeatureExtractionPipeline | null = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

function meanPool(tokens: number[][]): number[] {
  const dim = tokens[0].length;
  const sums = new Array(dim).fill(0);
  for (const token of tokens) {
    for (let i = 0; i < dim; i++) sums[i] += token[i];
  }
  return sums.map((v) => v / tokens.length);
}

export async function vectorizeSummary(book: Book): Promise<number[]> {
  const text = book.summaries[0] ?? "";
  const embedder = await getEmbedder();
  const { data, dims } = await embedder(text);

  if (!data || !dims || dims.length !== 3) {
    throw new Error(`Unexpected model output shape: ${JSON.stringify({ dims })}`);
  }

  const [, numTokens, embeddingDim] = dims;
  const tokens: number[][] = [];
  for (let i = 0; i < numTokens; i++) {
    const start = i * embeddingDim;
    tokens.push(Array.from(data.slice(start, start + embeddingDim)));
  }

  return meanPool(tokens);
}
