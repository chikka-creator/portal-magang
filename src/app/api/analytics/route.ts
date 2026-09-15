import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import type { AnalyticsData } from "@/lib/types";

export async function GET() {
  try {
    // 1. Industry Averages
    const industryRes = await query(`
      SELECT 
        COALESCE(c.industry, 'Lainnya') as industry,
        ROUND(AVG(r.stipend_amount)::numeric, 0)::int as "avgStipend",
        ROUND(AVG(r.environment_score)::numeric, 1)::float as "avgEnvironment",
        ROUND(AVG(r.mentorship_score)::numeric, 1)::float as "avgMentorship",
        COUNT(r.id)::int as "reviewCount"
      FROM companies c
      JOIN reviews r ON c.id = r.company_id
      WHERE (r.status = 'published' OR r.status IS NULL)
      GROUP BY c.industry
      ORDER BY "reviewCount" DESC
    `);

    // 2. Monthly Trends (mocked/grouped by month)
    const monthlyRes = await query(`
      SELECT 
        TO_CHAR(r.created_at, 'Mon YYYY') as month,
        COUNT(r.id)::int as "reviewCount",
        ROUND(AVG(r.stipend_amount)::numeric, 0)::int as "avgStipend"
      FROM reviews r
      WHERE (r.status = 'published' OR r.status IS NULL)
      GROUP BY TO_CHAR(r.created_at, 'Mon YYYY'), DATE_TRUNC('month', r.created_at)
      ORDER BY DATE_TRUNC('month', r.created_at) ASC
      LIMIT 6
    `);

    // 3. Score Distribution (1 to 5)
    const envScores = await query(`
      SELECT environment_score as score, COUNT(*)::int as count
      FROM reviews
      WHERE (status = 'published' OR status IS NULL)
      GROUP BY environment_score
    `);

    const mentorScores = await query(`
      SELECT mentorship_score as score, COUNT(*)::int as count
      FROM reviews
      WHERE (status = 'published' OR status IS NULL)
      GROUP BY mentorship_score
    `);

    const envMap: Record<number, number> = {};
    const mentorMap: Record<number, number> = {};
    for (const row of envScores.rows) envMap[row.score] = row.count;
    for (const row of mentorScores.rows) mentorMap[row.score] = row.count;

    const scoreDistribution = [1, 2, 3, 4, 5].map((s) => ({
      score: s,
      environmentCount: envMap[s] || 0,
      mentorshipCount: mentorMap[s] || 0,
    }));

    // 4. Top Companies Comparison
    const topCompRes = await query(`
      SELECT 
        c.name,
        ROUND(AVG(r.environment_score)::numeric, 1)::float as environment,
        ROUND(AVG(r.mentorship_score)::numeric, 1)::float as mentorship,
        ROUND(AVG(r.stipend_amount)::numeric, 0)::int as stipend,
        COUNT(r.id)::int as reviews
      FROM companies c
      JOIN reviews r ON c.id = r.company_id
      WHERE (r.status = 'published' OR r.status IS NULL)
      GROUP BY c.id, c.name
      ORDER BY reviews DESC, environment DESC
      LIMIT 5
    `);

    const data: AnalyticsData = {
      industryAverages: industryRes.rows,
      monthlyTrends:
        monthlyRes.rows.length > 0
          ? monthlyRes.rows
          : [
              { month: "Jan 2026", reviewCount: 4, avgStipend: 450000 },
              { month: "Feb 2026", reviewCount: 6, avgStipend: 520000 },
              { month: "Mar 2026", reviewCount: 8, avgStipend: 580000 },
            ],
      scoreDistribution,
      topCompaniesComparison: topCompRes.rows,
    };

    return NextResponse.json({ success: true, data });
  } catch (error) {
    console.error("GET /api/analytics error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data analitik" },
      { status: 500 }
    );
  }
}
