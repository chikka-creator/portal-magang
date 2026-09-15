import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStudentSession, getAdminSession } from "@/lib/session";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;

    const res = await query(
      `SELECT id, company_id, question_text, answer_text, answered_by, answered_at, is_answered, created_at
       FROM company_questions
       WHERE company_id = $1
       ORDER BY is_answered DESC, created_at DESC`,
      [companyId]
    );

    return NextResponse.json({ questions: res.rows });
  } catch (error) {
    console.error("Fetch questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { question_text } = await req.json();

    if (!question_text || question_text.trim().length < 10) {
      return NextResponse.json(
        { error: "Pertanyaan minimal 10 karakter" },
        { status: 400 }
      );
    }

    const session = await getStudentSession();
    const studentHash = session?.studentHash || `anon_${Date.now()}`;

    const res = await query(
      `INSERT INTO company_questions (company_id, question_text, student_hash)
       VALUES ($1, $2, $3)
       RETURNING id, company_id, question_text, is_answered, created_at`,
      [companyId, question_text.trim(), studentHash]
    );

    // Notify company/admin of new question
    await query(
      `INSERT INTO notifications (recipient_hash, type, title, body, reference_id)
       VALUES ('admin_hash', 'question_received', 'Pertanyaan baru dari siswa', $1, $2)`,
      [`Pertanyaan: "${question_text.trim().substring(0, 60)}..."`, companyId]
    );

    return NextResponse.json({ success: true, question: res.rows[0] });
  } catch (error) {
    console.error("Create question error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: companyId } = await params;
    const { question_id, answer_text, answered_by } = await req.json();

    if (!question_id || !answer_text) {
      return NextResponse.json(
        { error: "ID Pertanyaan dan teks jawaban wajib diisi" },
        { status: 400 }
      );
    }

    // Verify admin or claim status
    const adminSession = await getAdminSession();
    const authorName = answered_by || (adminSession ? `Admin (${adminSession.username})` : "HRD Perusahaan");

    const res = await query(
      `UPDATE company_questions
       SET answer_text = $1, answered_by = $2, answered_at = CURRENT_TIMESTAMP, is_answered = TRUE
       WHERE id = $3 AND company_id = $4
       RETURNING *`,
      [answer_text.trim(), authorName, question_id, companyId]
    );

    if (res.rowCount === 0) {
      return NextResponse.json(
        { error: "Pertanyaan tidak ditemukan" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true, question: res.rows[0] });
  } catch (error) {
    console.error("Answer question error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
