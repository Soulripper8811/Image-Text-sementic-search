// import { NextRequest, NextResponse } from "next/server";
// import { generateEmbedding } from "@/lib/gemini";
// import { pool } from "@/lib/db";

import { pool } from "@/lib/db";
import { generateImageEmbedding } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

// export async function POST(req: NextRequest) {
//   const formData = await req.formData();

//   const file = formData.get("image") as File;
//   const name = formData.get("name") as string;
//   const description = formData.get("description") as string;
//   const price = formData.get("price") as string;

//   const buffer = Buffer.from(await file.arrayBuffer());
//   const base64Image = buffer.toString("base64");

//   // Embed meaningful product text
//   const textToEmbed = `${name}. ${description}. Price: ${price}`;
//   const embedding = await generateEmbedding(textToEmbed);

//   await pool.query(
//     `
//   INSERT INTO products (name, description, price, image_base64, embedding)
//   VALUES ($1, $2, $3, $4, $5)
//   `,
//     [name, description, price, base64Image, `[${embedding.join(",")}]`]
//   );

//   return NextResponse.json({ message: "Product stored successfully" });
// }

export async function POST(req: NextRequest) {
  const formData = await req.formData();

  const file = formData.get("image") as File;
  const name = formData.get("name") as string;
  const description = formData.get("description") as string;
  const price = formData.get("price") as string;

  console.log(file, name, description, price);
  if (!file) {
    return NextResponse.json({ error: "No image uploaded" }, { status: 400 });
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const base64Image = buffer.toString("base64");

  console.log("Image buffer length:", buffer.length);

  const embedding = await generateImageEmbedding(base64Image);
  const vectorString = `[${embedding.join(",")}]`;

  await pool.query(
    `
    INSERT INTO products (name, description, price, image_base64, embedding)
    VALUES ($1, $2, $3, $4, $5)
    `,
    [name, description, price, base64Image, vectorString]
  );

  return NextResponse.json({ message: "Product stored successfully" });
}
