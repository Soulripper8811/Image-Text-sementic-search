import { NextRequest, NextResponse } from "next/server";
import { Groq } from "groq-sdk";
import { pool } from "@/lib/db";
import { generateEmbedding } from "@/lib/gemini";

import { PDFLoader } from "@langchain/community/document_loaders/fs/pdf";
import { RecursiveCharacterTextSplitter } from "@langchain/textsplitters";
import { Document } from "@langchain/core/documents"; // for typing

import { Readable } from "stream"; // helps convert Buffer → stream for loader

export const runtime = "nodejs";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY!,
});

// We'll use this splitter (you can tune chunkSize / overlap)
const textSplitter = new RecursiveCharacterTextSplitter({
  chunkSize: 1000,
  chunkOverlap: 200,
  separators: ["\n\n", "\n", " ", ""], // good defaults
});

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const arrayBuffer = await file.arrayBuffer();
    const uint8Array = new Uint8Array(arrayBuffer);
    const buffer = Buffer.from(uint8Array);
    const fileType = file.type;

    let docs: Document[] = [];
    let fileCategory: "pdf" | "image" = "pdf";

    // ────────────────────────────────────────────────
    // PDF → LangChain PDFLoader
    // ────────────────────────────────────────────────
    if (fileType === "application/pdf") {
      // PDFLoader expects a path or Blob-like → we trick it with a Readable stream
      const stream = Readable.from(buffer);

      // Fake "file path" – PDFLoader can work with Blob in recent versions
      // but safest is to use the fs/pdf loader with a temp approach or stream hack
      const blob = new Blob([buffer], { type: "application/pdf" });
      const loader = new PDFLoader(blob, {
        // pdfjs: () => import("pdfjs-dist/legacy/build/pdf.mjs"), // optional override
      });

      const rawDocs = await loader.load();

      // Split into chunks
      docs = await textSplitter.splitDocuments(rawDocs);

      fileCategory = "pdf";
    }

    // ────────────────────────────────────────────────
    // Image → multimodal description via Groq Llama vision
    // ────────────────────────────────────────────────
    else if (fileType.startsWith("image/")) {
      const base64Image = buffer.toString("base64");
      const imageDataUrl = `data:${fileType};base64,${base64Image}`;

      const result = await groq.chat.completions.create({
        model: "llama-3.2-90b-vision-preview", // good choice
        messages: [
          {
            role: "user",
            content: [
              {
                type: "text",
                text: `
Analyze this image carefully and return a detailed structured summary in plain text. Include:
- Main subject / key objects with descriptions
- Any visible text (transcribe exactly)
- Scene / environment / setting
- Overall mood, style, colors if relevant
- Any notable details (logos, brands, text orientation, etc.)
Keep formatting clean and readable.
                `,
              },
              {
                type: "image_url",
                image_url: { url: imageDataUrl },
              },
            ],
          },
        ],
        temperature: 0.3,
        max_tokens: 1200,
      });

      const extractedText = result.choices?.[0]?.message?.content?.trim() || "";

      if (!extractedText) {
        throw new Error("Vision model returned empty description");
      }

      // Treat the whole description as one "document", then split if large
      const singleDoc = new Document({
        pageContent: extractedText,
        metadata: { source: file.name, image: true },
      });

      docs = await textSplitter.splitDocuments([singleDoc]);

      fileCategory = "image";
    } else {
      return NextResponse.json(
        { error: "Unsupported file type. Only PDF and images are allowed." },
        { status: 400 },
      );
    }

    if (docs.length === 0) {
      return NextResponse.json(
        { error: "Could not extract any readable content from the file" },
        { status: 422 },
      );
    }

    // ────────────────────────────────────────────────
    // Embed & store chunks
    // ────────────────────────────────────────────────
    let chunksStored = 0;

    for (let i = 0; i < docs.length; i++) {
      const doc = docs[i];
      const content = doc.pageContent.trim();

      if (content.length < 50) continue;

      const embedding = await generateEmbedding(content);
      const vectorString = `[${embedding.join(",")}]`;

      await pool.query(
        `
        INSERT INTO documents
        (file_name, file_type, content, metadata, embedding)
        VALUES ($1, $2, $3, $4, $5::vector)
        ON CONFLICT DO NOTHING
        `,
        [
          file.name,
          fileCategory,
          content,
          JSON.stringify({
            ...doc.metadata,
            size: file.size,
            mime: fileType,
            uploadedAt: new Date().toISOString(),
            chunk_index: i,
            total_chunks: docs.length,
          }),
          vectorString,
        ],
      );

      chunksStored++;
    }

    return NextResponse.json({
      success: true,
      fileName: file.name,
      chunksStored,
      message:
        "File processed, text extracted and embedded successfully using LangChain",
    });
  } catch (error: unknown) {
    console.error("[UPLOAD_ERROR]", error);
    let message = "Internal server error";
    if (error instanceof Error) {
      message = error.message;
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
