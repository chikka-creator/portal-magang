import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

/**
 * GET /api/admin/analytics
 * Returns comprehensive analytics data for the admin dashboard.
 */
export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 1. Monthly review trend (last 12 months)
    const trendResult = await query(`
      SELECT 
        TO_CHAR(DATE_TRUNC('month', created_at), 'YYYY-MM') AS month,
        COUNT(*)::int AS count
      FROM reviews
      WHERE created_at >= NOW() - INTERVAL '12 months'
      GROUP BY DATE_TRUNC('month', created_at)
      ORDER BY month ASC
    `);

    // 2. Score distribution (environment + mentorship)
    const envDistResult = await query(`
      SELECT environment_score AS score, COUNT(*)::int AS count
      FROM reviews
      GROUP BY environment_score
      ORDER BY environment_score
    `);

    const mentDistResult = await query(`
      SELECT mentorship_score AS score, COUNT(*)::int AS count
      FROM reviews
      GROUP BY mentorship_score
      ORDER BY mentorship_score
    `);

    // 3. Top companies by overall score
    const topCompaniesResult = await query(`
      SELECT 
        c.id, c.name, c.city, c.industry,
        COUNT(r.id)::int AS review_count,
        ROUND(((AVG(r.environment_score) + AVG(r.mentorship_score)) / 2)::numeric, 2)::float AS avg_overall,
        ROUND(AVG(r.stipend_amount)::numeric, 0)::int AS avg_stipend
      FROM companies c
      INNER JOIN reviews r ON c.id = r.company_id
      WHERE r.status = 'published'
      GROUP BY c.id
      HAVING COUNT(r.id) >= 1
      ORDER BY avg_overall DESC
      LIMIT 5
    `);

    // 4. Weekly activity heatmap (reviews per day-of-week)
    const heatmapResult = await query(`
      SELECT 
        EXTRACT(DOW FROM created_at)::int AS day_of_week,
        COUNT(*)::int AS count
      FROM reviews
      WHERE created_at >= NOW() - INTERVAL '3 months'
      GROUP BY day_of_week
      ORDER BY day_of_week
    `);

    // 5. Q&A stats
    const qaResult = await query(`
      SELECT 
        COUNT(*)::int AS total_questions,
        COUNT(*) FILTER (WHERE is_answered = TRUE)::int AS answered,
        COUNT(*) FILTER (WHERE is_answered = FALSE)::int AS unanswered
      FROM company_questions
    `);

    // 6. Stipend distribution ranges
    const stipendRanges = await query(`
      SELECT 
        CASE
          WHEN stipend_amount = 0 THEN 'Tidak Ada'
          WHEN stipend_amount < 300000 THEN '< 300rb'
          WHEN stipend_amount < 500000 THEN '300-500rb'
          WHEN stipend_amount < 1000000 THEN '500rb-1jt'
          ELSE '> 1jt'
        END AS range,
        COUNT(*)::int AS count
      FROM reviews
      GROUP BY range
      ORDER BY MIN(stipend_amount)
    `);

    // 7. Recent admin actions count
    const auditCountResult = await query(`
      SELECT COUNT(*)::int AS total_actions
      FROM admin_audit_logs
      WHERE created_at >= NOW() - INTERVAL '7 days'
    `);

    return NextResponse.json({
      success: true,
      analytics: {
        monthlyTrend: trendResult.rows,
        environmentDist: envDistResult.rows,
        mentorshipDist: mentDistResult.rows,
        topCompanies: topCompaniesResult.rows,
        weeklyHeatmap: heatmapResult.rows,
        qaStats: qaResult.rows[0] || { total_questions: 0, answered: 0, unanswered: 0 },
        stipendRanges: stipendRanges.rows,
        recentAdminActions: auditCountResult.rows[0]?.total_actions || 0,
      },
    });
  } catch (error) {
    console.error("GET /api/admin/analytics error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
