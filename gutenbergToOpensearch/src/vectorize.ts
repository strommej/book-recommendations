import type { Book } from "./types.js";
import { type FeatureExtractionPipeline, pipeline } from "@xenova/transformers";

// Cache the loaded embedding pipeline so it's only loaded once
let embedder: FeatureExtractionPipeline | null = null;

// Loads the transformer pipeline for feature extraction (embeddings)
async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

// Averages token embeddings to produce a single vector for the whole summary
function meanPool(tokens: number[][]): number[] {
  const dim = tokens[0].length;
  const sums = new Array(dim).fill(0);
  for (const token of tokens) {
    for (let i = 0; i < dim; i++) sums[i] += token[i];
  }
  return sums.map((v) => v / tokens.length);
}

/**
 * Converts a book summary to a vector embedding using a transformer model.
 * - Loads the model pipeline if needed
 * - Extracts the first summary from the book
 * - Gets token embeddings from the model
 * - Reshapes the flat output into a 2D array
 * - Applies mean pooling to get a single vector
 */
export async function vectorizeSummary(book: Book): Promise<number[]> {
  // Use the first summary, or empty string if none
  const text = book.summaries[0] ?? "";
  // Get the embedding pipeline
  const embedder = await getEmbedder();
  // Run the model to get embeddings
  const { data, dims } = await embedder(text);

  // Validate output shape
  if (!data || !dims || dims.length !== 3) {
    throw new Error(`Unexpected model output shape: ${JSON.stringify({ dims })}`);
  }

  // dims: [batchSize, numTokens, embeddingDim]
  const [, numTokens, embeddingDim] = dims;
  // Reshape flat array into [numTokens][embeddingDim]
  const tokens: number[][] = [];
  for (let i = 0; i < numTokens; i++) {
    const start = i * embeddingDim;
    tokens.push(Array.from(data.slice(start, start + embeddingDim)));
  }
  // Average token vectors to get a single summary embedding
  return meanPool(tokens);
}
