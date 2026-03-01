import { GoogleGenAI } from "@google/genai";

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
