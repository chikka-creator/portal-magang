import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/companies — List all companies with review counts
 */
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const result = await query(`
      SELECT 
        c.*,
        COALESCE(COUNT(r.id), 0)::int AS review_count,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id
      GROUP BY c.id
      ORDER BY c.name ASC
    `);

    return NextResponse.json({ success: true, companies: result.rows });
  } catch (error) {
    console.error("GET /api/admin/companies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * POST /api/admin/companies — Create a new company
 */
export async function POST(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, city, industry } = await request.json();

    if (!name || name.trim().length < 2) {
      return NextResponse.json({ error: "Nama perusahaan wajib diisi (min 2 karakter)" }, { status: 400 });
    }

    const result = await query(
      `INSERT INTO companies (name, city, industry) VALUES ($1, $2, $3) RETURNING *`,
      [name.trim(), city?.trim() || "Surabaya", industry?.trim() || null]
    );

    await logAuditAction({
      adminUsername: admin.username,
      action: "create_company",
      targetType: "company",
      targetId: result.rows[0].id,
      details: { name: name.trim(), city: city || "Surabaya", industry },
    });

    return NextResponse.json({ success: true, company: result.rows[0] });
  } catch (error) {
    console.error("POST /api/admin/companies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/companies — Update a company
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, city, industry } = await request.json();
    if (!id) return NextResponse.json({ error: "ID wajib" }, { status: 400 });

    const result = await query(
      `UPDATE companies SET name = COALESCE($2, name), city = COALESCE($3, city), industry = COALESCE($4, industry) WHERE id = $1 RETURNING *`,
      [id, name?.trim() || null, city?.trim() || null, industry?.trim() || null]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "update_company",
      targetType: "company",
      targetId: id,
      details: { name, city, industry },
    });

    return NextResponse.json({ success: true, company: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/admin/companies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/companies — Delete a company (cascade)
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

    // Get company name before deleting for audit log
    const company = await query(`SELECT name FROM companies WHERE id = $1`, [id]);
    const companyName = company.rows[0]?.name || "Unknown";

    const result = await query(`DELETE FROM companies WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "delete_company",
      targetType: "company",
      targetId: id,
      details: { name: companyName },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/companies error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
