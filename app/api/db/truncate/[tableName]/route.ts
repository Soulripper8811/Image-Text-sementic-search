// app/api/db/truncate/[tableName]/route.ts
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function POST(
  request: Request,
  context: { params: Promise<{ tableName: string }> }, // ← correct typing for Next.js 15+
) {
  // 1. Await params (required in Next.js 15+)
  const params = await context.params;
  const tableName = params.tableName;

  // 2. Very selective allow-list (NEVER remove this!)
  const allowedTables = ["products", "documents"]; // Add only tables you really want to allow truncating

  if (!allowedTables.includes(tableName)) {
    return NextResponse.json(
      { error: "Truncate not allowed on this table" },
      { status: 403 },
    );
  }

  // 3. Read body → expect { password: string }
  let body;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { password } = body;

  // 4. Compare password (use env var in production!)
  //    Never hard-code real passwords in git — this is just an example
  const CORRECT_PASSWORD = process.env.ADMIN_TRUNCATE_PASSWORD;

  if (!password || password !== CORRECT_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }

  // 5. At this point → authenticated → proceed with truncate
  try {
    await pool.query(`
      TRUNCATE TABLE ${tableName} RESTART IDENTITY CASCADE;
    `);

    return NextResponse.json({
      message: `Table "${tableName}" truncated successfully`,
      truncatedAt: new Date().toISOString(),
      table: tableName,
    });
  } catch (err: unknown) {
    console.error(`TRUNCATE failed on ${tableName}:`, err);
    return NextResponse.json(
      { error: "Truncate failed", details: (err as Error)?.message },
      { status: 500 },
    );
  }
}
