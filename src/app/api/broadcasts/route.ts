import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/broadcasts — Public endpoint for active broadcasts
 * Called by the student portal to display announcement banners
 */
export async function GET() {
  try {
    const result = await query(`
      SELECT id, title, body, priority, created_at
      FROM admin_broadcasts
      WHERE is_active = TRUE
        AND (expires_at IS NULL OR expires_at > NOW())
      ORDER BY 
        CASE priority 
          WHEN 'urgent' THEN 0 
          WHEN 'warning' THEN 1 
          ELSE 2 
        END,
        created_at DESC
      LIMIT 5
    `);

    return NextResponse.json({ success: true, broadcasts: result.rows });
  } catch (error) {
    console.error("GET /api/broadcasts error:", error);
    return NextResponse.json({ success: true, broadcasts: [] });
  }
}
