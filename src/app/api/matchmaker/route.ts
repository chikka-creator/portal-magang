import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

export async function POST(req: NextRequest) {
  try {
    const { major, priority, minStipend } = await req.json();

    // Fetch all companies with stats
    const companiesRes = await query(`
      SELECT 
        c.id, c.name, c.city, c.industry,
        COALESCE(AVG(r.stipend_amount), 0) as avg_stipend,
        COALESCE(AVG(r.environment_score), 0) as avg_env,
        COALESCE(AVG(r.mentorship_score), 0) as avg_mentorship,
        COUNT(r.id) as review_count
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
      GROUP BY c.id, c.name, c.city, c.industry
    `);

    const targetMinStipend = Number(minStipend) || 0;

    const matchedCompanies = companiesRes.rows.map((c: any) => {
      const avgStipend = Math.round(Number(c.avg_stipend));
      const avgEnv = Number(c.avg_env);
      const avgMentorship = Number(c.avg_mentorship);
      const overallAvg = (avgEnv + avgMentorship) / 2;

      let score = 50; // Base score
      const highlights: string[] = [];

      // Industry / Major matching logic
      const industry = (c.industry || "").toLowerCase();
      const userMajor = (major || "").toLowerCase();

      if (
        (userMajor.includes("rpl") || userMajor.includes("tkj") || userMajor.includes("informatika")) &&
        (industry.includes("teknologi") || industry.includes("telekomunikasi"))
      ) {
        score += 20;
        highlights.push("Sangat relevan dengan Jurusan RPL / TKJ / IT");
      } else if (
        (userMajor.includes("mesin") || userMajor.includes("otomotif") || userMajor.includes("perkapalan")) &&
        (industry.includes("manufaktur") || industry.includes("perkapalan"))
      ) {
        score += 20;
        highlights.push("Relevan untuk Jurusan Mesin & Teknik");
      } else if (
        (userMajor.includes("akuntansi") || userMajor.includes("pemasaran")) &&
        (industry.includes("finansial") || industry.includes("retail"))
      ) {
        score += 20;
        highlights.push("Relevan untuk Bisnis & Pemasaran");
      } else {
        score += 10;
        highlights.push("Terbuka untuk berbagai jurusan SMK");
      }

      // Priority matching
      if (priority === "stipend") {
        if (avgStipend >= 500000) {
          score += 20;
          highlights.push(`Kompensasi menarik (Rp ${avgStipend.toLocaleString("id-ID")}/bln)`);
        } else if (avgStipend > 0) {
          score += 10;
        }
      } else if (priority === "mentorship") {
        if (avgMentorship >= 4.0) {
          score += 20;
          highlights.push(`Bimbingan mentor bintang lima (${avgMentorship.toFixed(1)}/5)`);
        } else {
          score += Math.round(avgMentorship * 3);
        }
      } else if (priority === "environment") {
        if (avgEnv >= 4.0) {
          score += 20;
          highlights.push(`Lingkungan kerja sangat suportif (${avgEnv.toFixed(1)}/5)`);
        } else {
          score += Math.round(avgEnv * 3);
        }
      } else {
        score += Math.round(overallAvg * 4);
      }

      // Stipend condition bonus/penalty
      if (targetMinStipend > 0) {
        if (avgStipend >= targetMinStipend) {
          score += 10;
          highlights.push(`Memenuhi batas minimal saku siswa`);
        } else {
          score -= 10;
        }
      }

      // Clamp score between 60 and 99
      const matchPercentage = Math.min(99, Math.max(62, score));

      let badgeLabel = "Sangat Cocok";
      let badgeColor = "emerald";

      if (matchPercentage >= 90) {
        badgeLabel = "Super Match 🌟";
        badgeColor = "emerald";
      } else if (matchPercentage >= 80) {
        badgeLabel = "Rekomendasi Utama 👍";
        badgeColor = "blue";
      } else if (matchPercentage >= 70) {
        badgeLabel = "Sesuai Kriteria";
        badgeColor = "amber";
      } else {
        badgeLabel = "Opsi Alternatif";
        badgeColor = "slate";
      }

      return {
        ...c,
        avg_stipend: avgStipend,
        avg_env: avgEnv.toFixed(1),
        avg_mentorship: avgMentorship.toFixed(1),
        overall_avg: overallAvg.toFixed(1),
        match_score: matchPercentage,
        badge_label: badgeLabel,
        badge_color: badgeColor,
        highlights,
      };
    });

    // Sort by match_score DESC
    matchedCompanies.sort((a: any, b: any) => b.match_score - a.match_score);

    return NextResponse.json({
      query: { major, priority, minStipend },
      matches: matchedCompanies,
    });
  } catch (error) {
    console.error("Matchmaker error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
