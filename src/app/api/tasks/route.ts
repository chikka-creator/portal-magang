import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { CreateTaskRequest } from "@/lib/types";

/**
 * GET /api/tasks
 *
 * Fetch all tasks for a student.
 * Query params: ?student_hash= (required)
 *
 * SECURITY: Only returns tasks for the authenticated student.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const studentHash = searchParams.get("student_hash");

    if (!studentHash) {
      return NextResponse.json(
        { success: false, error: "student_hash is required" },
        { status: 400 }
      );
    }

    const result = await query(
      `SELECT
        t.id,
        t.student_hash,
        t.title,
        t.company_id,
        c.name AS company_name,
        t.description,
        t.status,
        t.due_date,
        t.completed_at,
        t.created_at,
        t.updated_at
      FROM user_tasks t
      JOIN companies c ON t.company_id = c.id
      WHERE t.student_hash = $1
      ORDER BY t.created_at DESC`,
      [studentHash]
    );

    return NextResponse.json({
      success: true,
      data: result.rows,
    });
  } catch (error) {
    console.error("GET /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data tasks" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/tasks
 *
 * Create a new task for a student.
 * Body: { student_hash, title, company_id, description?, due_date? }
 *
 * SECURITY: company_id must exist in companies table.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { student_hash, title, company_id, description, due_date } = body as CreateTaskRequest;

    if (!student_hash || !title || !company_id) {
      return NextResponse.json(
        { success: false, error: "student_hash, title, dan company_id wajib diisi" },
        { status: 400 }
      );
    }

    if (title.trim().length < 3) {
      return NextResponse.json(
        { success: false, error: "Judul tugas minimal 3 karakter" },
        { status: 400 }
      );
    }

    // Verify company exists
    const companyCheck = await query(
      `SELECT id, name FROM companies WHERE id = $1`,
      [company_id]
    );
    if (companyCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Perusahaan tidak ditemukan" },
        { status: 404 }
      );
    }

    const result = await query(
      `INSERT INTO user_tasks (student_hash, title, company_id, description, due_date)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, student_hash, title, company_id, description, status, due_date, completed_at, created_at, updated_at`,
      [
        student_hash,
        title.trim(),
        company_id,
        description?.trim() || null,
        due_date || null,
      ]
    );

    const newTask = {
      ...result.rows[0],
      company_name: companyCheck.rows[0].name,
    };

    return NextResponse.json(
      { success: true, data: newTask, message: "Task berhasil dibuat!" },
      { status: 201 }
    );
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message.includes("uq_task_per_student")
    ) {
      return NextResponse.json(
        { success: false, error: "Tugas dengan judul ini sudah ada" },
        { status: 409 }
      );
    }

    console.error("POST /api/tasks error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat task" },
      { status: 500 }
    );
  }
}
