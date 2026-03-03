import { NextRequest, NextResponse } from "next/server";
import { pool } from "@/lib/db";
import { generateImageEmbedding } from "@/lib/gemini";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("image") as File;

    if (!file) {
      return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
    }

    // Convert image to base64
    const buffer = Buffer.from(await file.arrayBuffer());
    const base64Image = buffer.toString("base64");

    // 🔥 Generate CLIP embedding
    const embedding = await generateImageEmbedding(base64Image);

    // Convert to pgvector format
    const vectorString = `[${embedding.join(",")}]`;

    // 🔥 Vector similarity search
    const result = await pool.query(
      `
      SELECT *,
      embedding <-> $1 AS distance
      FROM products
      ORDER BY embedding <-> $1
      LIMIT 6
      `,
      [vectorString],
    );

    return NextResponse.json(result.rows);
  } catch (error) {
    console.error("Image search error:", error);
    return NextResponse.json({ error: "Image search failed" }, { status: 500 });
  }
}
