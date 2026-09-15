import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";
import crypto from "crypto";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = `
      SELECT 
        f.id,
        f.review_id,
        f.reason,
        f.description,
        f.status,
        f.created_at,
        r.position,
        r.review_text,
        r.environment_score,
        r.mentorship_score,
        c.name as company_name
      FROM review_flags f
      JOIN reviews r ON f.review_id = r.id
      JOIN companies c ON r.company_id = c.id
      ORDER BY f.created_at DESC
    `;

    const res = await query(sql);
    return NextResponse.json({ flags: res.rows });
  } catch (error) {
    console.error("Admin flags fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const { review_id, reason, description } = await req.json();

    if (!review_id || !reason) {
      return NextResponse.json(
        { error: "review_id dan reason wajib diisi" },
        { status: 400 }
      );
    }

    // Generate anonymous reporter hash based on IP and headers
    const forwardedFor = req.headers.get("x-forwarded-for") || "127.0.0.1";
    const userAgent = req.headers.get("user-agent") || "unknown";
    const reporter_hash = crypto
      .createHash("sha256")
      .update(`${forwardedFor}-${userAgent}`)
      .digest("hex");

    // Insert flag
    await query(
      `INSERT INTO review_flags (review_id, reporter_hash, reason, description, status)
       VALUES ($1, $2, $3, $4, 'pending')
       ON CONFLICT (review_id, reporter_hash) DO UPDATE SET reason = $3, description = $4`,
      [review_id, reporter_hash, reason, description || null]
    );

    // Update flagged_count on reviews
    await query(
      `UPDATE reviews SET flagged_count = flagged_count + 1 WHERE id = $1`,
      [review_id]
    );

    return NextResponse.json({
      success: true,
      message: "Laporan berhasil dikirim dan akan ditinjau oleh tim moderator.",
    });
  } catch (error) {
    console.error("Flag review error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, status, hide_review } = await req.json();

    if (!id || !["pending", "resolved", "dismissed"].includes(status)) {
      return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }

    const res = await query(
      "UPDATE review_flags SET status = $1, resolved_by = $2 WHERE id = $3 RETURNING id, review_id, status",
      [status, admin.adminId, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Laporan tidak ditemukan" }, { status: 404 });
    }

    if (hide_review && res.rows[0].review_id) {
      await query("UPDATE reviews SET status = 'hidden' WHERE id = $1", [
        res.rows[0].review_id,
      ]);
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "resolve_flag",
      targetType: "flag",
      targetId: id,
      details: { status, hide_review: !!hide_review, review_id: res.rows[0].review_id },
    });

    return NextResponse.json({ success: true, flag: res.rows[0] });
  } catch (error) {
    console.error("Admin resolve flag error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
