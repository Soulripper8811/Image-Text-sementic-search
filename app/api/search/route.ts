import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/gemini";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const query = formData.get("query") as string;

  const embedding = await generateEmbedding(query);

  // 🔥 Convert array → pgvector string format
  const vectorString = `[${embedding.join(",")}]`;

  const result = await pool.query(
    `
    SELECT *,
    embedding <-> $1 AS distance
    FROM products
    ORDER BY embedding <-> $1
    LIMIT 5
    `,
    [vectorString]
  );

  return NextResponse.json(result.rows);
}
