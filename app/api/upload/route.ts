import { pool } from "@/lib/db";
import { generateImageEmbedding } from "@/lib/gemini";
import { NextRequest, NextResponse } from "next/server";

// Helper functions
function generateRandomName(index: number) {
  const adjectives = ["Premium", "Smart", "Eco", "Ultra", "Classic", "Modern"];
  const items = ["Item", "Product", "Gadget", "Accessory", "Gear", "Device"];

  const adj = adjectives[Math.floor(Math.random() * adjectives.length)];
  const item = items[Math.floor(Math.random() * items.length)];

  return `${adj} ${item} ${Date.now()}-${index}`;
}

function generateRandomDescription() {
  const descriptions = [
    "High quality product.",
    "Best in class performance.",
    "Limited edition item.",
    "Top rated customer choice.",
    "Durable and reliable.",
    "Value for money product.",
  ];

  return descriptions[Math.floor(Math.random() * descriptions.length)];
}

function generateRandomPrice() {
  return (Math.floor(Math.random() * 5000) + 500).toString(); // ₹500 - ₹5500
}

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const files = formData.getAll("image") as File[];

  if (!files || files.length === 0) {
    return NextResponse.json({ error: "No images uploaded" }, { status: 400 });
  }

  const isBulk = files.length > 1;

  try {
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (!file || file.size === 0) continue;

      const buffer = Buffer.from(await file.arrayBuffer());
      const base64Image = buffer.toString("base64");

      const embedding = await generateImageEmbedding(base64Image);
      const vectorString = `[${embedding.join(",")}]`;

      let name: string;
      let description: string;
      let price: string;

      if (isBulk) {
        // 🔥 Generate random data
        name = generateRandomName(i);
        description = generateRandomDescription();
        price = generateRandomPrice();
      } else {
        // Normal single upload
        name = formData.get("name") as string;
        description = formData.get("description") as string;
        price = formData.get("price") as string;
      }

      await pool.query(
        `
        INSERT INTO products (name, description, price, image_base64, embedding)
        VALUES ($1, $2, $3, $4, $5)
        `,
        [name, description, price, base64Image, vectorString],
      );
    }

    return NextResponse.json({
      message: isBulk
        ? `${files.length} products uploaded successfully`
        : "Product stored successfully",
    });
  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: "Upload failed" }, { status: 500 });
  }
}
