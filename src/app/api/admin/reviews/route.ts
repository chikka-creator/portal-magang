import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

export async function GET(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const status = searchParams.get("status");

    let sql = `
      SELECT 
        r.id,
        r.company_id,
        c.name as company_name,
        r.position,
        r.stipend_amount,
        r.environment_score,
        r.mentorship_score,
        r.review_text,
        r.helpful_count,
        r.status,
        r.flagged_count,
        r.created_at
      FROM reviews r
      JOIN companies c ON r.company_id = c.id
    `;

    const params: any[] = [];
    if (status && status !== "all") {
      sql += ` WHERE r.status = $1`;
      params.push(status);
    }

    sql += ` ORDER BY r.created_at DESC`;

    const res = await query(sql, params);
    return NextResponse.json({ reviews: res.rows });
  } catch (error) {
    console.error("Admin reviews fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status } = await req.json();

    if (!id || !["published", "hidden", "flagged"].includes(status)) {
      return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }

    const res = await query(
      "UPDATE reviews SET status = $1 WHERE id = $2 RETURNING id, status",
      [status, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Review tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "moderate_review",
      targetType: "review",
      targetId: id,
      details: { new_status: status },
    });

    return NextResponse.json({ success: true, review: res.rows[0] });
  } catch (error) {
    console.error("Admin update review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "Review ID wajib diisi" }, { status: 400 });
    }

    const res = await query("DELETE FROM reviews WHERE id = $1 RETURNING id", [id]);
    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Review tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "delete_review",
      targetType: "review",
      targetId: id,
    });

    return NextResponse.json({ success: true, message: "Review berhasil dihapus" });
  } catch (error) {
    console.error("Admin delete review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
