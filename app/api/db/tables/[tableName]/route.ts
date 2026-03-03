// app/api/db/tables/[tableName]/route.ts
import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  context: { params: Promise<{ tableName: string }> }, // ← correct typing
) {
  // Must await params!
  const params = await context.params;
  const tableName = params.tableName;

  // Very basic protection — in production use better validation + auth
  const allowedTables = ["products", "users", "documents", "orders"];

  if (!allowedTables.includes(tableName)) {
    return NextResponse.json(
      { error: "Table not allowed or does not exist" },
      { status: 400 },
    );
  }

  try {
    // NEVER trust tableName directly in production without sanitization
    // Here we use it only after allow-list check
    const result = await pool.query(
      `
      SELECT *
      FROM ${tableName}
      ORDER BY id ASC
      LIMIT 500;           -- safety limit – add pagination later if needed
      `,
    );

    return NextResponse.json({
      table: tableName,
      rows: result.rows,
      count: result.rowCount,
    });
  } catch (err: unknown) {
    console.error(`Error fetching table ${tableName}:`, err);
    return NextResponse.json(
      { error: "Database error", details: (err as Error)?.message },
      { status: 500 },
    );
  }
}
