import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashPassword } from "@/lib/auth";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const res = await query(
      "SELECT id, status, contact_name, contact_position, verified_at FROM company_claims WHERE company_id = $1",
      [id]
    );

    if (res.rows.length === 0) {
      return NextResponse.json({ claimed: false, status: "unclaimed" });
    }

    const claim = res.rows[0];
    return NextResponse.json({
      claimed: claim.status === "approved",
      status: claim.status,
      verified_at: claim.verified_at,
    });
  } catch (error) {
    console.error("Fetch claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { contact_name, contact_email, contact_position, password } = await req.json();

    if (!contact_name || !contact_email || !password) {
      return NextResponse.json(
        { error: "Nama perwakilan, email resmi, dan password wajib diisi." },
        { status: 400 }
      );
    }

    // Check if company exists
    const compCheck = await query("SELECT name FROM companies WHERE id = $1", [id]);
    if (compCheck.rows.length === 0) {
      return NextResponse.json({ error: "Perusahaan tidak ditemukan" }, { status: 404 });
    }

    // Check existing claim
    const existing = await query(
      "SELECT id, status FROM company_claims WHERE company_id = $1",
      [id]
    );

    if (existing.rows.length > 0) {
      const claim = existing.rows[0];
      if (claim.status === "approved") {
        return NextResponse.json(
          { error: "Halaman perusahaan ini sudah diverifikasi oleh perwakilan resmi." },
          { status: 409 }
        );
      } else if (claim.status === "pending") {
        return NextResponse.json(
          { error: "Klaim untuk perusahaan ini sedang menunggu peninjauan moderator." },
          { status: 409 }
        );
      }
    }

    const passwordHash = await hashPassword(password);

    await query(
      `INSERT INTO company_claims (company_id, contact_name, contact_email, contact_position, claim_password_hash, status)
       VALUES ($1, $2, $3, $4, $5, 'pending')
       ON CONFLICT (company_id) DO UPDATE 
       SET contact_name = $2, contact_email = $3, contact_position = $4, claim_password_hash = $5, status = 'pending'`,
      [id, contact_name.trim(), contact_email.trim().toLowerCase(), contact_position?.trim() || null, passwordHash]
    );

    return NextResponse.json({
      success: true,
      message: "Pengajuan klaim berhasil dikirim. Tim moderator akan meninjau dalam 1-2 hari kerja.",
    });
  } catch (error) {
    console.error("Submit claim error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
