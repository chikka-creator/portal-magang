import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

interface ParsedFilters {
  industries: string[];
  cities: string[];
  minStipend: number;
  minScore: number;
  sortBy: string;
  keywords: string[];
}

function parseQuery(raw: string): ParsedFilters {
  const q = raw.toLowerCase().trim();
  const filters: ParsedFilters = {
    industries: [],
    cities: [],
    minStipend: 0,
    minScore: 0,
    sortBy: "review_count",
    keywords: [],
  };

  // Industry detection
  if (q.includes("teknologi") || q.includes("rpl") || q.includes("tkj") || q.includes("informatika") || q.includes("programming") || q.includes("developer")) {
    filters.industries.push("Teknologi");
  }
  if (q.includes("telekomunikasi") || q.includes("telkom") || q.includes("jaringan") || q.includes("fiber")) {
    filters.industries.push("Telekomunikasi");
  }
  if (q.includes("manufaktur") || q.includes("mesin") || q.includes("otomotif") || q.includes("produksi")) {
    filters.industries.push("Manufaktur");
  }
  if (q.includes("perkapalan") || q.includes("kapal") || q.includes("maritim") || q.includes("galangan")) {
    filters.industries.push("Perkapalan & Pertahanan");
  }
  if (q.includes("logistik") || q.includes("pelabuhan") || q.includes("shipping")) {
    filters.industries.push("Logistik & Maritim");
  }
  if (q.includes("konstruksi") || q.includes("bangunan") || q.includes("material")) {
    filters.industries.push("Konstruksi & Material");
  }
  if (q.includes("kimia") || q.includes("petrokimia") || q.includes("industri")) {
    filters.industries.push("Kimia & Industri");
  }
  if (q.includes("akuntansi") || q.includes("finansial") || q.includes("keuangan")) {
    filters.industries.push("Akuntansi");
  }
  if (q.includes("pemasaran") || q.includes("marketing") || q.includes("digital")) {
    filters.industries.push("Pemasaran");
  }

  // City detection
  if (q.includes("surabaya")) filters.cities.push("Surabaya");
  if (q.includes("gresik")) filters.cities.push("Gresik");
  if (q.includes("sidoarjo")) filters.cities.push("Sidoarjo");

  // Stipend detection
  const stipendMatch = q.match(/(?:uang\s*saku|stipend|gaji|bayaran)\s*(?:>=?|lebih\s*dari|di\s*atas|minimum|min)?\s*(?:rp\.?\s*)?(\d[\d.]+)/);
  if (stipendMatch) {
    filters.minStipend = parseInt(stipendMatch[1].replace(/\./g, ""));
  }
  // Round number patterns like "500 ribu" or "750rb"
  const ribuMatch = q.match(/(\d+)\s*(?:ribu|rb|k)/);
  if (ribuMatch) {
    filters.minStipend = Math.max(filters.minStipend, parseInt(ribuMatch[1]) * 1000);
  }

  // Score detection
  if (q.includes("terbaik") || q.includes("bagus") || q.includes("bintang") || q.includes("skor tinggi")) {
    filters.minScore = 4.0;
  } else if (q.includes("lumayan") || q.includes("cukup")) {
    filters.minScore = 3.0;
  }

  // Sort detection
  if (q.includes("uang saku") || q.includes("stipend") || q.includes("gaji")) {
    filters.sortBy = "avg_stipend";
  } else if (q.includes("mentor") || q.includes("bimbingan")) {
    filters.sortBy = "avg_mentorship";
  } else if (q.includes("lingkungan") || q.includes("suasana")) {
    filters.sortBy = "avg_environment";
  }

  // Fallback: extract meaningful keywords
  if (filters.industries.length === 0 && filters.cities.length === 0) {
    const words = q.split(/\s+/).filter(w => w.length > 3 && !["yang", "dengan", "untuk", "terbaik", "adalah", "tempat", "magang", "cari", "cari"].includes(w));
    filters.keywords = words.slice(0, 3);
  }

  return filters;
}

export async function POST(req: NextRequest) {
  try {
    const { query: rawQuery } = await req.json();
    if (!rawQuery || typeof rawQuery !== "string") {
      return NextResponse.json(
        { success: false, error: "query wajib diisi" },
        { status: 400 }
      );
    }

    const filters = parseQuery(rawQuery);

    let sql = `
      SELECT
        c.id, c.name, c.city, c.industry,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend,
        COALESCE(ROUND(AVG(r.environment_score)::numeric, 1), 0)::float AS avg_environment,
        COALESCE(ROUND(AVG(r.mentorship_score)::numeric, 1), 0)::float AS avg_mentorship,
        COUNT(r.id)::int AS review_count
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
    `;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIdx = 1;

    if (filters.industries.length > 0) {
      conditions.push(`c.industry IN (${filters.industries.map((_, i) => `$${paramIdx + i}`).join(", ")})`);
      params.push(...filters.industries);
      paramIdx += filters.industries.length;
    }

    if (filters.cities.length > 0) {
      conditions.push(`c.city IN (${filters.cities.map((_, i) => `$${paramIdx + i}`).join(", ")})`);
      params.push(...filters.cities);
      paramIdx += filters.cities.length;
    }

    if (filters.minStipend > 0) {
      conditions.push(`COALESCE(AVG(r.stipend_amount), 0) >= $${paramIdx}`);
      params.push(filters.minStipend);
      paramIdx++;
    }

    if (filters.minScore > 0) {
      conditions.push(`COALESCE(AVG(r.environment_score) + AVG(r.mentorship_score), 0) / 2 >= $${paramIdx}`);
      params.push(filters.minScore);
      paramIdx++;
    }

    if (filters.keywords.length > 0) {
      const kwConditions = filters.keywords.map((kw) => {
        const cond = `(c.name ILIKE $${paramIdx} OR c.industry ILIKE $${paramIdx} OR c.city ILIKE $${paramIdx})`;
        params.push(`%${kw}%`);
        paramIdx++;
        return cond;
      });
      conditions.push(`(${kwConditions.join(" OR ")})`);
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` GROUP BY c.id, c.name, c.city, c.industry`;

    const orderMap: Record<string, string> = {
      avg_stipend: "avg_stipend DESC",
      avg_mentorship: "avg_mentorship DESC",
      avg_environment: "avg_environment DESC",
      review_count: "review_count DESC, (COALESCE(AVG(r.environment_score),0) + COALESCE(AVG(r.mentorship_score),0))/2 DESC",
    };
    sql += ` ORDER BY ${orderMap[filters.sortBy] || orderMap.review_count}`;
    sql += ` LIMIT 10`;

    const result = await query(sql, params);

    const results = result.rows.map((row: any) => {
      const matchReasons: string[] = [];
      let confidence = 50;

      if (filters.industries.length > 0 && filters.industries.includes(row.industry)) {
        confidence += 25;
        matchReasons.push(`Sesuai industri ${row.industry}`);
      }
      if (filters.cities.length > 0 && filters.cities.includes(row.city)) {
        confidence += 10;
        matchReasons.push(`Lokasi di ${row.city}`);
      }
      if (filters.minStipend > 0 && row.avg_stipend >= filters.minStipend) {
        confidence += 10;
        matchReasons.push(`Uang saku ${row.avg_stipend.toLocaleString("id-ID")}/bulan`);
      }
      if (row.review_count > 0) {
        confidence += Math.min(10, row.review_count * 2);
        matchReasons.push(`${row.review_count} ulasan`);
      }
      if (row.avg_environment >= 4.0 || row.avg_mentorship >= 4.0) {
        confidence += 5;
        matchReasons.push("Skor tinggi dari siswa");
      }
      confidence = Math.min(99, confidence);

      return {
        id: row.id,
        name: row.name,
        city: row.city,
        industry: row.industry,
        avg_stipend: row.avg_stipend,
        avg_environment: row.avg_environment,
        avg_mentorship: row.avg_mentorship,
        review_count: row.review_count,
        confidence,
        matchReasons,
      };
    });

    results.sort((a: any, b: any) => b.confidence - a.confidence);

    return NextResponse.json({
      success: true,
      query: rawQuery,
      parsedFilters: filters,
      count: results.length,
      data: results,
    });
  } catch (error) {
    console.error("POST /api/ai-search error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pencarian" },
      { status: 500 }
    );
  }
}
