import { Book } from "./types.js";
import { pipeline } from "@xenova/transformers";

let embedder: any;

export async function vectorizeSummary(book: Book): Promise<number[]> {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  function meanPool(output: number[][]): number[] {
    const dim = output[0].length;
    const sum = new Array(dim).fill(0);
    for (const token of output) {
      for (let i = 0; i < dim; i++) sum[i] += token[i];
    }
    return sum.map((v) => v / output.length);
  }
  const summaryText = book.summaries.length > 0 ? book.summaries[0] : "";
  const summaryTensor = await embedder(summaryText);
  if (!summaryTensor || !summaryTensor.data || !summaryTensor.dims) {
    console.error("Invalid tensor output:", summaryTensor);
    return [NaN];
  }
  const { data, dims } = summaryTensor;
  const numTokens = dims[1];
  const embeddingDim = dims[2];
  // Convert flat Float32Array to 2D array [numTokens][embeddingDim]
  const tokens: number[][] = [];
  for (let i = 0; i < numTokens; i++) {
    tokens.push(Array.from(data.slice(i * embeddingDim, (i + 1) * embeddingDim)));
  }
  if (!tokens.length || !tokens[0].length) {
    console.error("No valid tokens for mean pooling:", tokens);
    return [NaN];
  }
  const summaryEmbedding = meanPool(tokens);
  return summaryEmbedding;
}
