import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getStudentSession } from "@/lib/session";

export async function GET() {
  try {
    const session = await getStudentSession();
    const recipient = session?.studentHash || "hash_student_001_laingroup";

    const res = await query(
      `SELECT id, type, title, body, reference_id, is_read, created_at 
       FROM notifications 
       WHERE recipient_hash = $1 
       ORDER BY created_at DESC 
       LIMIT 20`,
      [recipient]
    );

    const unreadCount = res.rows.filter((n: any) => !n.is_read).length;

    return NextResponse.json({
      notifications: res.rows,
      unreadCount,
    });
  } catch (error) {
    console.error("Notifications fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { id, markAll } = await req.json();

    if (markAll) {
      const session = await getStudentSession();
      const recipient = session?.studentHash || "hash_student_001_laingroup";
      await query(
        "UPDATE notifications SET is_read = TRUE WHERE recipient_hash = $1",
        [recipient]
      );
      return NextResponse.json({ success: true, message: "Semua ditandai sudah dibaca" });
    }

    if (!id) {
      return NextResponse.json({ error: "ID notifikasi wajib diisi" }, { status: 400 });
    }

    await query("UPDATE notifications SET is_read = TRUE WHERE id = $1", [id]);
    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Update notification error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
