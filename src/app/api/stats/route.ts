import { NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * GET /api/stats
 *
 * Dashboard statistics endpoint.
 * Returns aggregate platform metrics and trending companies.
 */
export async function GET() {
  try {
    // Aggregate platform stats
    const statsResult = await query<{
      total_companies: number;
      total_reviews: number;
      avg_stipend: number;
      avg_environment: number;
      avg_mentorship: number;
    }>(`
      SELECT
        (SELECT COUNT(*)::int FROM companies) AS total_companies,
        (SELECT COUNT(*)::int FROM reviews) AS total_reviews,
        (SELECT COALESCE(ROUND(AVG(stipend_amount)::numeric, 0), 0)::int FROM reviews) AS avg_stipend,
        (SELECT COALESCE(ROUND(AVG(environment_score)::numeric, 1), 0)::float FROM reviews) AS avg_environment,
        (SELECT COALESCE(ROUND(AVG(mentorship_score)::numeric, 1), 0)::float FROM reviews) AS avg_mentorship
    `);

    // Trending companies (most reviews + highest avg score)
    const trendingResult = await query(`
      SELECT
        c.id,
        c.name,
        c.city,
        c.industry,
        COUNT(r.id)::int AS review_count,
        ROUND(
          (AVG(r.environment_score) + AVG(r.mentorship_score))::numeric / 2, 1
        )::float AS avg_score
      FROM companies c
      JOIN reviews r ON c.id = r.company_id
      GROUP BY c.id
      HAVING COUNT(r.id) > 0
      ORDER BY review_count DESC, avg_score DESC
      LIMIT 5
    `);

    // Industry breakdown
    const industryResult = await query(`
      SELECT
        c.industry,
        COUNT(DISTINCT c.id)::int AS company_count,
        COUNT(r.id)::int AS review_count,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id
      WHERE c.industry IS NOT NULL
      GROUP BY c.industry
      ORDER BY review_count DESC
    `);

    return NextResponse.json({
      success: true,
      data: {
        ...statsResult.rows[0],
        trending_companies: trendingResult.rows,
        industry_breakdown: industryResult.rows,
      },
    });
  } catch (error) {
    console.error("GET /api/stats error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil statistik" },
      { status: 500 }
    );
  }
}
