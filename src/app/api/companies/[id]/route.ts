import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/companies/[id]
 *
 * Fetch a single company with aggregated review statistics.
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    // Validate UUID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(id)
    ) {
      return NextResponse.json(
        { success: false, error: "ID perusahaan tidak valid" },
        { status: 400 }
      );
    }

    const companyResult = await query(
      `
      SELECT
        c.*,
        COALESCE(COUNT(r.id), 0)::int AS review_count,
        COALESCE(ROUND(AVG(r.environment_score)::numeric, 1), 0)::float AS avg_environment,
        COALESCE(ROUND(AVG(r.mentorship_score)::numeric, 1), 0)::float AS avg_mentorship,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend,
        COALESCE(MIN(r.stipend_amount), 0)::int AS min_stipend,
        COALESCE(MAX(r.stipend_amount), 0)::int AS max_stipend
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id
      WHERE c.id = $1
      GROUP BY c.id
      `,
      [id]
    );

    if (companyResult.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Perusahaan tidak ditemukan" },
        { status: 404 }
      );
    }

    // Get score distribution for charts
    const distributionResult = await query(
      `
      SELECT
        environment_score,
        mentorship_score,
        COUNT(*)::int AS count
      FROM reviews
      WHERE company_id = $1
      GROUP BY environment_score, mentorship_score
      ORDER BY environment_score, mentorship_score
      `,
      [id]
    );

    // Get position breakdown
    const positionResult = await query(
      `
      SELECT
        position,
        COUNT(*)::int AS count,
        ROUND(AVG(stipend_amount)::numeric, 0)::int AS avg_stipend
      FROM reviews
      WHERE company_id = $1
      GROUP BY position
      ORDER BY count DESC
      `,
      [id]
    );

    // Get claim info
    const claimResult = await query(
      `SELECT id, status, contact_name, contact_position, verified_at 
       FROM company_claims 
       WHERE company_id = $1`,
      [id]
    );
    const claim = claimResult.rows[0];
    const isClaimed = claim?.status === "approved";

    return NextResponse.json({
      success: true,
      data: {
        ...companyResult.rows[0],
        is_claimed: isClaimed,
        claim_status: claim?.status || "unclaimed",
        claim_info: isClaimed
          ? {
              contact_name: claim.contact_name,
              contact_position: claim.contact_position,
              verified_at: claim.verified_at,
            }
          : null,
        score_distribution: distributionResult.rows,
        position_breakdown: positionResult.rows,
      },
    });
  } catch (error) {
    console.error("GET /api/companies/[id] error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data perusahaan" },
      { status: 500 }
    );
  }
}
