import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";
import { logAuditAction } from "@/lib/audit";

/**
 * GET /api/admin/questions — List all Q&A questions for moderation
 */
export async function GET(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const filter = searchParams.get("filter") || "all";

    let whereClause = "";
    if (filter === "unanswered") whereClause = "WHERE q.is_answered = FALSE";
    else if (filter === "answered") whereClause = "WHERE q.is_answered = TRUE";

    const result = await query(`
      SELECT 
        q.*,
        c.name AS company_name,
        c.city AS company_city
      FROM company_questions q
      INNER JOIN companies c ON q.company_id = c.id
      ${whereClause}
      ORDER BY q.created_at DESC
    `);

    return NextResponse.json({ success: true, questions: result.rows });
  } catch (error) {
    console.error("GET /api/admin/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * PATCH /api/admin/questions — Answer a question on behalf of a company
 */
export async function PATCH(request: NextRequest) {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, answer_text, answered_by } = await request.json();
    if (!id || !answer_text?.trim()) {
      return NextResponse.json({ error: "ID dan jawaban wajib diisi" }, { status: 400 });
    }

    const result = await query(
      `UPDATE company_questions 
       SET answer_text = $2, answered_by = $3, answered_at = NOW(), is_answered = TRUE
       WHERE id = $1
       RETURNING *`,
      [id, answer_text.trim(), answered_by?.trim() || "Admin Portal Magang"]
    );

    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "answer_question",
      targetType: "question",
      targetId: id,
      details: { answer_preview: answer_text.trim().substring(0, 100) },
    });

    return NextResponse.json({ success: true, question: result.rows[0] });
  } catch (error) {
    console.error("PATCH /api/admin/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

/**
 * DELETE /api/admin/questions — Delete an inappropriate question
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

    const question = await query(`SELECT question_text FROM company_questions WHERE id = $1`, [id]);
    const questionPreview = question.rows[0]?.question_text?.substring(0, 100) || "";

    const result = await query(`DELETE FROM company_questions WHERE id = $1 RETURNING id`, [id]);
    if (result.rows.length === 0) {
      return NextResponse.json({ error: "Pertanyaan tidak ditemukan" }, { status: 404 });
    }

    await logAuditAction({
      adminUsername: admin.username,
      action: "delete_question",
      targetType: "question",
      targetId: id,
      details: { question_preview: questionPreview },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/questions error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
