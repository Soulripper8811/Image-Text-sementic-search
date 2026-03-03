import { GoogleGenAI } from "@google/genai";

import Replicate from "replicate";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN!,
});

const ai = new GoogleGenAI({
  apiKey: process.env.GEMINI_API_KEY,
});

export async function generateEmbedding(text: string) {
  const response = await ai.models.embedContent({
    model: "gemini-embedding-001",
    contents: [text],
    config: {
      outputDimensionality: 768,
    },
  });

  if (!response?.embeddings?.[0]?.values) {
    console.error("Failed to generate embedding:", response);
    throw new Error("Failed to generate embedding");
  }
  return response?.embeddings[0]?.values;
}

export async function generateImageEmbedding(base64: string) {
  const output = (await replicate.run(
    "krthr/clip-embeddings:1c0371070cb827ec3c7f2f28adcdde54b50dcd239aa6faea0bc98b174ef03fb4",
    {
      input: {
        image: `data:image/jpeg;base64,${base64}`,
      },
    },
  )) as { embedding: number[] };

  //   console.log("CLIP Output:", output);

  // Depending on model response structure
  const embedding = output?.embedding || output;

  if (!embedding || !Array.isArray(embedding)) {
    throw new Error("Invalid CLIP embedding response");
  }

  return embedding;
}
