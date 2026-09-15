import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashNISN } from "@/lib/hash";
import { validateReviewRequest } from "@/lib/validation";
import { ReviewSortField, SortOrder } from "@/lib/types";
import { createToken } from "@/lib/auth";
import { STUDENT_COOKIE_NAME } from "@/lib/session";
import { getAllPlatformSettings } from "@/lib/settings";

/**
 * GET /api/reviews
 *
 * Fetch reviews with filtering, sorting, and pagination.
 * Query params: ?company_id=, ?sort=, ?order=, ?limit=, ?offset=
 *
 * SECURITY: student_hash is NEVER returned in the response.
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const companyId = searchParams.get("company_id");
    const sortField = (searchParams.get("sort") || "helpful_count") as ReviewSortField;
    const sortOrder = (searchParams.get("order") || "desc") as SortOrder;
    const limit = Math.min(parseInt(searchParams.get("limit") || "20"), 50);
    const offset = parseInt(searchParams.get("offset") || "0");

    // Whitelist allowed sort fields to prevent SQL injection
    const allowedSortFields: ReviewSortField[] = [
      "created_at",
      "environment_score",
      "mentorship_score",
      "stipend_amount",
      "helpful_count",
    ];
    const safeSortField = allowedSortFields.includes(sortField)
      ? sortField
      : "helpful_count";
    const safeSortOrder = sortOrder === "asc" ? "ASC" : "DESC";

    let sql = `
      SELECT
        r.id,
        r.company_id,
        c.name AS company_name,
        r.position,
        r.stipend_amount,
        r.environment_score,
        r.mentorship_score,
        r.review_text,
        r.helpful_count,
        r.status,
        r.created_at,
        cr.id AS reply_id,
        cr.reply_text,
        cr.created_at AS reply_created_at
      FROM reviews r
      JOIN companies c ON r.company_id = c.id
      LEFT JOIN company_replies cr ON r.id = cr.review_id
      WHERE (r.status = 'published' OR r.status IS NULL)
    `;

    const params: unknown[] = [];
    let paramIndex = 1;

    if (companyId) {
      sql += ` AND r.company_id = $${paramIndex}`;
      params.push(companyId);
      paramIndex++;
    }

    sql += ` ORDER BY r.${safeSortField} ${safeSortOrder}, r.created_at DESC`;
    sql += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    params.push(limit, offset);

    const result = await query(sql, params);

    // Format rows to nest company reply cleanly and mark most helpful
    let maxHelpful = 0;
    const rows = result.rows.map((row: any) => {
      if (row.helpful_count > maxHelpful) {
        maxHelpful = row.helpful_count;
      }
      return {
        id: row.id,
        company_id: row.company_id,
        company_name: row.company_name,
        position: row.position,
        stipend_amount: row.stipend_amount,
        environment_score: row.environment_score,
        mentorship_score: row.mentorship_score,
        review_text: row.review_text,
        helpful_count: row.helpful_count,
        status: row.status,
        created_at: row.created_at,
        reply: row.reply_id
          ? {
              id: row.reply_id,
              review_id: row.id,
              company_id: row.company_id,
              reply_text: row.reply_text,
              created_at: row.reply_created_at,
            }
          : null,
      };
    });

    // Mark most helpful review if helpful_count > 0
    const finalData = rows.map((r) => ({
      ...r,
      is_most_helpful: maxHelpful > 0 && r.helpful_count === maxHelpful,
    }));

    // Get total count for pagination
    let countSql = `SELECT COUNT(*)::int AS total FROM reviews WHERE (status = 'published' OR status IS NULL)`;
    const countParams: unknown[] = [];
    if (companyId) {
      countSql += ` AND company_id = $1`;
      countParams.push(companyId);
    }
    const countResult = await query<{ total: number }>(countSql, countParams);
    const total = countResult.rows[0]?.total || 0;

    return NextResponse.json({
      success: true,
      data: finalData,
      pagination: {
        total,
        limit,
        offset,
        has_more: offset + limit < total,
      },
    });
  } catch (error) {
    console.error("GET /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data review" },
      { status: 500 }
    );
  }
}

/**
 * POST /api/reviews
 *
 * Submit a new anonymous review.
 *
 * SECURITY CRITICAL:
 * 1. Receives raw NISN from the client
 * 2. Hashes NISN with SECRET_SALT via SHA-256
 * 3. Stores ONLY the hash — NISN is NEVER persisted
 * 4. Raw NISN is discarded from memory immediately after hashing
 */
export async function POST(request: NextRequest) {
  try {
    // Parse request body
    const body = await request.json();

    // Check platform settings
    const platformSettings = await getAllPlatformSettings();
    if (platformSettings.maintenance_mode === "true") {
      return NextResponse.json(
        { success: false, error: "Portal saat ini sedang dalam mode pemeliharaan sistem. Silakan coba beberapa saat lagi." },
        { status: 503 }
      );
    }

    if (platformSettings.allow_student_reviews === "false") {
      return NextResponse.json(
        { success: false, error: "Pengiriman ulasan magang baru saat ini sedang dinonaktifkan oleh administrator." },
        { status: 403 }
      );
    }

    const minLength = parseInt(platformSettings.min_review_length || "30", 10);
    if (body.review_text && body.review_text.trim().length < minLength) {
      return NextResponse.json(
        { success: false, error: `Ulasan pengalaman magang minimal ${minLength} karakter agar bermanfaat bagi siswa lain.` },
        { status: 400 }
      );
    }

    // Validate all fields
    const errors = validateReviewRequest(body);
    if (errors.length > 0) {
      return NextResponse.json(
        { success: false, errors },
        { status: 400 }
      );
    }

    // ========================================
    // CRITICAL SECURITY: Hash NISN
    // ========================================
    let nisn: string | null = body.nisn?.trim();
    const studentHash = hashNISN(nisn!);

    // IMMEDIATELY discard raw NISN from memory
    nisn = null;
    delete body.nisn;
    // ========================================

    // Verify company exists
    const companyCheck = await query(
      `SELECT id FROM companies WHERE id = $1`,
      [body.company_id]
    );
    if (companyCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Perusahaan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Determine initial status based on auto-approve policy
    const initialStatus = platformSettings.auto_approve_reviews === "false" ? "pending" : "published";

    // Insert review
    const result = await query(
      `
      INSERT INTO reviews (
        company_id, position, stipend_amount,
        environment_score, mentorship_score,
        review_text, student_hash, status
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, company_id, position, stipend_amount,
                environment_score, mentorship_score,
                review_text, helpful_count, status, created_at
      `,
      [
        body.company_id,
        body.position.trim(),
        body.stipend_amount,
        body.environment_score,
        body.mentorship_score,
        body.review_text.trim(),
        studentHash,
        initialStatus,
      ]
    );

    // Send notification to existing reviewers about new review for same company
    try {
      const priorReviewers = await query(
        "SELECT DISTINCT student_hash FROM reviews WHERE company_id = $1 AND student_hash != $2 LIMIT 5",
        [body.company_id, studentHash]
      );
      for (const rev of priorReviewers.rows) {
        await query(
          `INSERT INTO notifications (recipient_hash, type, title, body, reference_id)
           VALUES ($1, 'new_review', $2, $3, $4)`,
          [
            rev.student_hash,
            "Ulasan baru ditambahkan",
            `Seseorang baru saja membagikan pengalaman magang baru di ${companyCheck.rows[0].name || "perusahaan yang Anda ulas"}.`,
            body.company_id,
          ]
        );
      }
    } catch (notifErr) {
      console.warn("Failed to dispatch review notifications:", notifErr);
    }

    const sessionToken = createToken({ studentHash }, 24 * 30); // 30 days session
    const response = NextResponse.json(
      {
        success: true,
        data: result.rows[0],
        message: "Review berhasil dikirim!",
      },
      { status: 201 }
    );

    response.cookies.set({
      name: STUDENT_COOKIE_NAME,
      value: sessionToken,
      httpOnly: true,
      path: "/",
      sameSite: "lax",
      maxAge: 86400 * 30,
    });

    return response;
  } catch (error: unknown) {
    // Handle duplicate review constraint violation
    if (
      error instanceof Error &&
      error.message.includes("uq_review_per_student")
    ) {
      return NextResponse.json(
        {
          success: false,
          error:
            "Kamu sudah pernah me-review perusahaan ini. Satu siswa hanya bisa memberikan satu review per perusahaan.",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/reviews error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan review" },
      { status: 500 }
    );
  }
}
