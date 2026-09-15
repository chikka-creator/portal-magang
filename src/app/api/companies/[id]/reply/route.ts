import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { verifyPassword } from "@/lib/auth";
import { getAdminSession } from "@/lib/session";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: company_id } = await params;
    const body = await req.json();
    const { review_id, reply_text, email, password } = body;

    if (!review_id || !reply_text?.trim()) {
      return NextResponse.json(
        { error: "review_id dan reply_text wajib diisi" },
        { status: 400 }
      );
    }

    // Check if user is admin or authorized company representative
    const admin = await getAdminSession();
    let isAuthorized = !!admin;

    if (!isAuthorized) {
      if (!email || !password) {
        return NextResponse.json(
          { error: "Autentikasi perwakilan perusahaan (email & password) diperlukan." },
          { status: 401 }
        );
      }

      // Check claim status and password
      const claimRes = await query(
        "SELECT claim_password_hash, status FROM company_claims WHERE company_id = $1 AND contact_email = $2",
        [company_id, email.trim().toLowerCase()]
      );

      if (claimRes.rows.length === 0 || claimRes.rows[0].status !== "approved") {
        return NextResponse.json(
          { error: "Perusahaan belum memiliki klaim yang disetujui atau email tidak cocok." },
          { status: 403 }
        );
      }

      const validPass = await verifyPassword(password, claimRes.rows[0].claim_password_hash);
      if (!validPass) {
        return NextResponse.json(
          { error: "Password klaim perusahaan salah." },
          { status: 401 }
        );
      }
      isAuthorized = true;
    }

    // Insert or update reply
    const insertRes = await query(
      `INSERT INTO company_replies (review_id, company_id, reply_text)
       VALUES ($1, $2, $3)
       ON CONFLICT (review_id) DO UPDATE SET reply_text = $3, created_at = CURRENT_TIMESTAMP
       RETURNING id, review_id, company_id, reply_text, created_at`,
      [review_id, company_id, reply_text.trim()]
    );

    // Fetch company name and student_hash to trigger notification
    const reviewRes = await query(
      `SELECT r.student_hash, c.name as company_name 
       FROM reviews r 
       JOIN companies c ON r.company_id = c.id 
       WHERE r.id = $1`,
      [review_id]
    );

    if (reviewRes.rows.length > 0) {
      const { student_hash, company_name } = reviewRes.rows[0];
      await query(
        `INSERT INTO notifications (recipient_hash, type, title, body, reference_id)
         VALUES ($1, 'reply_received', $2, $3, $4)`,
        [
          student_hash,
          `Perusahaan membalas ulasan Anda`,
          `${company_name} telah menanggapi ulasan magang yang Anda tulis.`,
          company_id,
        ]
      );
    }

    return NextResponse.json({
      success: true,
      message: "Tanggapan resmi perusahaan berhasil dipublikasikan.",
      reply: insertRes.rows[0],
    });
  } catch (error) {
    console.error("Company reply error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
