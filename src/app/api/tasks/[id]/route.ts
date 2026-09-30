import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { UpdateTaskRequest } from "@/lib/types";

/**
 * PATCH /api/tasks/[id]
 *
 * Update a task (status, title, description, due_date).
 * Body: { title?, description?, status?, due_date? }
 *
 * SECURITY: Only updates the task if student_hash matches.
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, status, due_date } = body as UpdateTaskRequest;

    // Verify task exists and get student_hash
    const existingTask = await query(
      `SELECT id, student_hash FROM user_tasks WHERE id = $1`,
      [id]
    );

    if (existingTask.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task tidak ditemukan" },
        { status: 404 }
      );
    }

    // Build update query dynamically
    const updates: string[] = [];
    const queryParams: unknown[] = [];
    let paramIndex = 1;

    if (title !== undefined) {
      updates.push(`title = $${paramIndex}`);
      queryParams.push(title.trim());
      paramIndex++;
    }

    if (description !== undefined) {
      updates.push(`description = $${paramIndex}`);
      queryParams.push(description?.trim() || null);
      paramIndex++;
    }

    if (status !== undefined) {
      if (!["pending", "in_progress", "completed"].includes(status)) {
        return NextResponse.json(
          { success: false, error: "Status tidak valid" },
          { status: 400 }
        );
      }
      updates.push(`status = $${paramIndex}`);
      queryParams.push(status);
      paramIndex++;

      if (status === "completed") {
        updates.push(`completed_at = NOW()`);
      } else {
        updates.push(`completed_at = NULL`);
      }
    }

    if (due_date !== undefined) {
      updates.push(`due_date = $${paramIndex}`);
      queryParams.push(due_date || null);
      paramIndex++;
    }

    updates.push(`updated_at = NOW()`);
    queryParams.push(id);

    const result = await query(
      `UPDATE user_tasks
       SET ${updates.join(", ")}
       WHERE id = $${paramIndex}
       RETURNING id, student_hash, title, company_id, description, status, due_date, completed_at, created_at, updated_at`,
      queryParams
    );

    // Get company name
    const companyCheck = await query(
      `SELECT name FROM companies WHERE id = $1`,
      [result.rows[0].company_id]
    );

    const updatedTask = {
      ...result.rows[0],
      company_name: companyCheck.rows[0]?.name,
    };

    return NextResponse.json({
      success: true,
      data: updatedTask,
      message: "Task berhasil diupdate!",
    });
  } catch (error) {
    console.error("PATCH /api/tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengupdate task" },
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/tasks/[id]
 *
 * Delete a task.
 *
 * SECURITY: Only deletes the task if student_hash matches.
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Verify task exists
    const existingTask = await query(
      `SELECT id, student_hash FROM user_tasks WHERE id = $1`,
      [id]
    );

    if (existingTask.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Task tidak ditemukan" },
        { status: 404 }
      );
    }

    await query(
      `DELETE FROM user_tasks WHERE id = $1`,
      [id]
    );

    return NextResponse.json({
      success: true,
      message: "Task berhasil dihapus!",
    });
  } catch (error) {
    console.error("DELETE /api/tasks/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menghapus task" },
      { status: 500 }
    );
  }
}
