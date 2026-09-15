import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/broadcasts — List all broadcasts
 */
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(`
      SELECT * FROM admin_broadcasts
      ORDER BY created_at DESC
    `);

    return NextResponse.json({ success: true, broadcasts: result.rows });
  } catch (error) {
    console.error("GET /api/admin/broadcasts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/broadcasts — Create a new broadcast
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { title, body, priority, expires_at } = await request.json();

    if (!title?.trim()) {
      return NextResponse.json({ error: "Judul pengumuman wajib diisi" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO admin_broadcasts (title, body, priority, expires_at)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [
        title.trim(),
        body?.trim() || null,
        priority || "info",
        expires_at || null,
      ]
    );

    await logAuditAction({
      adminUsername: admin.username,
      action: "create_broadcast",
      targetType: "broadcast",
      targetId: result.rows[0].id,
      details: { title: title.trim(), priority },
    });

    return NextResponse.json({ success: true, broadcast: result.rows[0] });
  } catch (error) {
    console.error("POST /api/admin/broadcasts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/broadcasts — Toggle active/inactive
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, is_active } = await request.json();
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const result = await query(
      `UPDATE admin_broadcasts SET is_active = $2 WHERE id = $1 RETURNING *`,
      [id, is_active !== false]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Broadcast tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: is_active ? "activate_broadcast" : "deactivate_broadcast",
      targetType: "broadcast",
      targetId: id,
    });

    return NextResponse.json({ success: true, broadcast: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/admin/broadcasts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/broadcasts — Delete a broadcast
 */
export async function DELETE(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const broadcast = await query(`SELECT title FROM admin_broadcasts WHERE id = $1`, [id]);

    const result = await query(`DELETE FROM admin_broadcasts WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Broadcast tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "delete_broadcast",
      targetType: "broadcast",
      targetId: id,
      details: { title: broadcast.rows[0]?.title },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/broadcasts error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
