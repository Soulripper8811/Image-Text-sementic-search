import { NextRequest, NextResponse } from "next/server";
import { generateEmbedding } from "@/lib/gemini";
import { pool } from "@/lib/db";

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("image") as File;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Image = buffer.toString("base64");

  // Embed meaningful product text
  const textToEmbed = `${name}. ${description}. Price: ${price}`;
  const embedding = await generateEmbedding(textToEmbed);

  await pool.query(
    `
  INSERT INTO products (name, description, price, image_base64, embedding)
  VALUES ($1, $2, $3, $4, $5)
  `,
    [name, description, price, base64Image, `[${embedding.join(",")}]`]
  );

  return NextResponse.json({ message: "Product stored successfully" });
}
