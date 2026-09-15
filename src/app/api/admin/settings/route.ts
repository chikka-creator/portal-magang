import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/admin/settings — Get all platform settings
 */
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(`
      SELECT key, value, label, description, setting_type, updated_at
      FROM platform_settings
      ORDER BY key
    `);

    return NextResponse.json({ success: true, settings: result.rows });
  } catch (error) {
    console.error("GET /api/admin/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/settings — Update one or more settings
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { settings } = await request.json();

    if (!settings || typeof settings !== "object") {
      return NextResponse.json({ error: "Settings object wajib" }, { status: 400 });
    }

    const updates: string[] = [];
    for (const [key, value] of Object.entries(settings)) {
      await query(
        `INSERT INTO platform_settings (key, value, updated_at)
         VALUES ($1, $2, NOW())
         ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = NOW()`,
        [key, String(value)]
      );
      updates.push(`${key} = ${value}`);
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "update_settings",
      targetType: "settings",
      details: { updates },
    });

    // Return updated settings
    const result = await query(`
      SELECT key, value, label, description, setting_type, updated_at
      FROM platform_settings
      ORDER BY key
    `);

    return NextResponse.json({ success: true, settings: result.rows });
  } catch (error) {
    console.error("PATCH /api/admin/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/settings — Change admin password
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { current_password, new_password } = await request.json();

    if (!current_password || !new_password) {
      return NextResponse.json({ error: "Password lama dan baru wajib diisi" }, { status: 400 });
    }

    if (new_password.length < 6) {
      return NextResponse.json({ error: "Password baru minimal 6 karakter" }, { status: 400 });
    }

    // Verify current password
    const bcrypt = await import("bcryptjs");
    const adminResult = await query(
      `SELECT id, password_hash FROM admin_users WHERE username = $1 LIMIT 1`,
      [admin.username]
    );

    if (adminResult.rows.length === 0) {
      return NextResponse.json({ error: "Admin user tidak ditemukan" }, { status: 404 });
    }

    const isValid = await bcrypt.compare(current_password, adminResult.rows[0].password_hash);
    if (!isValid) {
      return NextResponse.json({ error: "Password lama salah" }, { status: 401 });
    }

    // Hash new password and update
    const newHash = await bcrypt.hash(new_password, 12);
    await query(
      `UPDATE admin_users SET password_hash = $1 WHERE username = $2`,
      [newHash, admin.username]
    );

    await logAuditAction({
      adminUsername: admin.username,
      action: "change_password",
      targetType: "admin",
    });

    return NextResponse.json({ success: true, message: "Password berhasil diubah" });
  } catch (error) {
    console.error("POST /api/admin/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
