import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const limit = Math.min(Number(searchParams.get("limit")) || 10, 50);

    const result = await query(
      `SELECT id, title, description, event_time, event_type, location, is_active
       FROM upcoming_events
       WHERE is_active = TRUE AND event_time >= NOW()
       ORDER BY event_time ASC
       LIMIT $1`,
      [limit]
    );

    return NextResponse.json({ success: true, data: result.rows });
  } catch (error) {
    console.error("GET /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data event" },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { title, description, event_time, event_type, location } = body;

    if (!title || !event_time) {
      return NextResponse.json(
        { success: false, error: "title dan event_time wajib diisi" },
        { status: 400 }
      );
    }

    const result = await query(
      `INSERT INTO upcoming_events (title, description, event_time, event_type, location)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, title, description, event_time, event_type, location, is_active`,
      [title, description || null, event_time, event_type || "task", location || null]
    );

    return NextResponse.json({ success: true, data: result.rows[0] }, { status: 201 });
  } catch (error) {
    console.error("POST /api/events error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal membuat event" },
      { status: 500 }
    );
  }
}
