import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const sql = `
      SELECT 
        cc.id,
        cc.company_id,
        c.name as company_name,
        c.city,
        c.industry,
        cc.contact_name,
        cc.contact_email,
        cc.contact_position,
        cc.status,
        cc.verified_at,
        cc.created_at
      FROM company_claims cc
      JOIN companies c ON cc.company_id = c.id
      ORDER BY cc.created_at DESC
    `;

    const res = await query(sql);
    return NextResponse.json({ claims: res.rows });
  } catch (error) {
    console.error("Admin claims fetch error:", error);
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

    if (!id || !["pending", "approved", "rejected"].includes(status)) {
      return NextResponse.json({ error: "Parameter tidak valid" }, { status: 400 });
    }

    const verifiedAt = status === "approved" ? "CURRENT_TIMESTAMP" : "NULL";

    const res = await query(
      `UPDATE company_claims 
       SET status = $1, verified_at = ${verifiedAt} 
       WHERE id = $2 
       RETURNING id, company_id, status, verified_at`,
      [status, id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ error: "Klaim tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: status === "approved" ? "approve_claim" : "reject_claim",
      targetType: "claim",
      targetId: id,
      details: { company_id: res.rows[0].company_id, status },
    });

    return NextResponse.json({ success: true, claim: res.rows[0] });
  } catch (error) {
    console.error("Admin update claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
