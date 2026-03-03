import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { pool } from "@/lib/db";
import { generateEmbedding } from "@/lib/gemini";

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { question } = body;

    if (!question?.trim()) {
      return NextResponse.json(
        { error: "Question is required" },
        { status: 400 },
      );
    }

    // 1. Embed the question using the same model as during upload
    const queryEmbedding = await generateEmbedding(question.trim());
    const vectorString = `[${queryEmbedding.join(",")}]`;

    // 2. Find the most relevant chunks (cosine similarity)
    const searchResult = await pool.query(
      `
      SELECT
        content,
        file_name,
        file_type,
        metadata,
        embedding <=> $1 AS distance
      FROM documents
      ORDER BY embedding <=> $1
      LIMIT 6
      `,
      [vectorString],
    );

    const relevantChunks = searchResult.rows;

    if (relevantChunks.length === 0) {
      return NextResponse.json({
        answer:
          "I don't have enough information in the uploaded documents to answer this question.",
      });
    }

    // 3. Build clean context with source info
    let context = "";
    relevantChunks.forEach((row, idx) => {
      context += `--- Chunk ${idx + 1} from ${row.file_name} (distance: ${row.distance.toFixed(4)}) ---\n`;
      context += `${row.content.trim()}\n\n`;
    });

    // 4. Very strict & clean system prompt
    const systemPrompt = `
You are a factual Q&A assistant that answers using **only** the provided context.

Strict rules:
- Use exclusively information present in the context
- Keep every number, date, percentage, score, name, version, amount etc. **exactly** as written — never round, approximate or change them
- Write in clear, plain sentences — no unnecessary words
- Do NOT use markdown bold **text**, italics, headings, bullet points, numbered lists, or code blocks
- Do NOT write phrases like "In short", "Overall", "The document shows", "according to", "based on", "from the context"
- Do NOT explain your reasoning or add any commentary
- If the question is not clearly and fully answerable from the context → reply **only** with this exact sentence:

I don't have enough information in the uploaded documents to answer this question.

Context:
${context}
`;

    // 5. Generate answer with very low creativity
    const completion = await groq.chat.completions.create({
      model: "openai/gpt-oss-120b",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: question.trim() },
      ],
      temperature: 0.1, // very low → more deterministic & precise
      max_tokens: 900,
      top_p: 0.9,
    });

    const answer =
      completion.choices?.[0]?.message?.content?.trim() ||
      "I don't have enough information in the uploaded documents to answer this question.";

    return NextResponse.json({ answer });
  } catch (error: unknown) {
    console.error("[RAG_CHAT_ERROR]", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json(
      { error: "Failed to process question", details: message },
      { status: 500 },
    );
  }
}
