import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStudentSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getStudentSession();
    if (!session?.studentHash) {
      return NextResponse.json(
        { error: "Sesi siswa tidak ditemukan. Silakan tulis ulasan terlebih dahulu." },
        { status: 401 }
      );
    }

    const sql = `
      SELECT 
        r.id,
        r.company_id,
        c.name as company_name,
        c.city,
        c.industry,
        r.position,
        r.stipend_amount,
        r.environment_score,
        r.mentorship_score,
        r.review_text,
        r.helpful_count,
        r.status,
        r.created_at,
        cr.reply_text as company_reply_text,
        cr.created_at as company_reply_date
      FROM reviews r
      JOIN companies c ON r.company_id = c.id
      LEFT JOIN company_replies cr ON r.id = cr.review_id
      WHERE r.student_hash = $1
      ORDER BY r.created_at DESC
    `;

    const res = await query(sql, [session.studentHash]);
    return NextResponse.json({ reviews: res.rows });
  } catch (error) {
    console.error("Profile reviews fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session?.studentHash) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, position, stipend_amount, environment_score, mentorship_score, review_text } =
      await req.json();

    if (!id || !position || !review_text) {
      return NextResponse.json({ error: "Data ulasan tidak lengkap" }, { status: 400 });
    }

    // Verify ownership
    const ownerCheck = await query(
      "SELECT id FROM reviews WHERE id = $1 AND student_hash = $2",
      [id, session.studentHash]
    );

    if (ownerCheck.rows.length === 0) {
      return NextResponse.json(
        { error: "Anda tidak memiliki akses untuk mengedit ulasan ini" },
        { status: 403 }
      );
    }

    const res = await query(
      `UPDATE reviews 
       SET position = $1, stipend_amount = $2, environment_score = $3, mentorship_score = $4, review_text = $5
       WHERE id = $6 AND student_hash = $7
       RETURNING id, position, stipend_amount, environment_score, mentorship_score, review_text`,
      [
        position.trim(),
        Number(stipend_amount) || 0,
        Number(environment_score),
        Number(mentorship_score),
        review_text.trim(),
        id,
        session.studentHash,
      ]
    );

    return NextResponse.json({
      success: true,
      message: "Ulasan berhasil diperbarui",
      review: res.rows[0],
    });
  } catch (error) {
    console.error("Profile review update error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const session = await getStudentSession();
    if (!session?.studentHash) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json({ error: "ID ulasan wajib diisi" }, { status: 400 });
    }

    // Verify ownership and delete
    const res = await query(
      "DELETE FROM reviews WHERE id = $1 AND student_hash = $2 RETURNING id",
      [id, session.studentHash]
    );

    if (res.rows.length === 0) {
      return NextResponse.json(
        { error: "Ulasan tidak ditemukan atau Anda tidak memiliki akses" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: "Ulasan berhasil dihapus secara permanen.",
    });
  } catch (error) {
    console.error("Profile review delete error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
