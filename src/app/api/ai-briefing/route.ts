import { NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function GET() {
  try {
    const statsResult = await query(`
      SELECT
        COUNT(DISTINCT c.id)::int AS total_companies,
        COUNT(r.id)::int AS total_reviews,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
    `);

    const industryResult = await query(`
      SELECT
        c.industry,
        COUNT(r.id)::int AS review_count,
        COALESCE(ROUND(AVG(r.environment_score + r.mentorship_score)::numeric / 2, 1), 0)::float AS avg_score
      FROM companies c
      JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
      WHERE c.industry IS NOT NULL
      GROUP BY c.industry
      HAVING COUNT(r.id) >= 1
      ORDER BY avg_score DESC, review_count DESC
      LIMIT 1
    `);

    const recentResult = await query(`
      SELECT COUNT(*)::int AS recent_count
      FROM reviews
      WHERE created_at >= NOW() - INTERVAL '30 days' AND status = 'published'
    `);

    const topCompanyResult = await query(`
      SELECT
        c.name,
        ROUND((AVG(r.environment_score) + AVG(r.mentorship_score))::numeric / 2, 1)::float AS avg_score,
        COUNT(r.id)::int AS review_count
      FROM companies c
      JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
      GROUP BY c.id, c.name
      ORDER BY avg_score DESC
      LIMIT 1
    `);

    const stats = statsResult.rows[0];
    const topIndustry = industryResult.rows[0];
    const recent = recentResult.rows[0];
    const topCompany = topCompanyResult.rows[0];

    const topIndustryName = topIndustry?.industry || "Teknologi";
    const topIndustryScore = topIndustry?.avg_score || 0;
    const avgStipend = stats?.avg_stipend || 0;
    const totalReviews = stats?.total_reviews || 0;
    const recentCount = recent?.recent_count || 0;

    const generatedText = [
      `Dari ${totalReviews} ulasan siswa, sektor ${topIndustryName} mencatat skor kepuasan tertinggi (${topIndustryScore}/5.0).`,
      topCompany ? `Perusahaan terbaik saat ini: ${topCompany.name} dengan skor ${topCompany.avg_score}/5.0 dari ${topCompany.review_count} ulasan.` : "",
      `Uang saku rata-rata platform: Rp ${avgStipend.toLocaleString("id-ID")}/bulan.`,
      recentCount > 0 ? `${recentCount} ulasan baru dalam 30 hari terakhir.` : "Belum ada ulasan baru bulan ini.",
      "Semua data dijamin anonim dan tervalidasi NISN siswa.",
    ].filter(Boolean).join(" ");

    return NextResponse.json({
      success: true,
      data: {
        topIndustry: topIndustryName,
        topIndustryScore,
        avgStipend,
        totalReviews,
        recentReviewCount: recentCount,
        generatedText,
      },
    });
  } catch (error) {
    console.error("GET /api/ai-briefing error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil briefing" },
      { status: 500 }
    );
  }
}
