import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

/**
 * GET /api/admin/audit — List admin audit logs (paginated)
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const actionFilter = searchParams.get("action") || "all";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
    const limit = 30;
    const offset = (page - 1) * limit;

    let whereClause = "";
    if (actionFilter !== "all") {
      whereClause = `WHERE action = '${actionFilter.replace(/'/g, "''")}'`;
    }

    const countResult = await query(
      `SELECT COUNT(*)::int AS total FROM admin_audit_logs ${whereClause}`
    );

    const result = await query(`
      SELECT * FROM admin_audit_logs
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ${limit} OFFSET ${offset}
    `);

    return NextResponse.json({
      success: true,
      logs: result.rows,
      total: countResult.rows[0]?.total || 0,
      page,
      totalPages: Math.ceil((countResult.rows[0]?.total || 0) / limit),
    });
  } catch (error) {
    console.error("GET /api/admin/audit error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
