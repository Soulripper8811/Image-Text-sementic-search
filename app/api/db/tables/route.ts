import { pool } from "@/lib/db";
import { NextResponse } from "next/server";

// app/api/db/tables/route.ts
export async function GET() {
  const result = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public'
    ORDER BY table_name;
  `);
  // Optionally add row counts with extra query per table (can be slow)
  return NextResponse.json({
    tables: result.rows.map((r) => ({ name: r.table_name })),
  });
}
