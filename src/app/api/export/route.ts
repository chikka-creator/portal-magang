import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";

/**
 * Format an array of objects into CSV string
 */
function toCSV(data: Record<string, any>[]): string {
  if (data.length === 0) return "";
  const headers = Object.keys(data[0]);
  const rows = data.map((row) =>
    headers
      .map((header) => {
        let val = row[header];
        if (val === null || val === undefined) val = "";
        const str = String(val).replace(/"/g, '""');
        return `"${str}"`;
      })
      .join(",")
  );
  return [headers.join(","), ...rows].join("\n");
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type") || "companies";
    const format = searchParams.get("format") || "csv";

    let filename = `portal-magang-${type}-${new Date().toISOString().split("T")[0]}`;
    let resultData: any[] = [];

    if (type === "companies") {
      const res = await query(`
        SELECT 
          c.name as "Nama Perusahaan",
          c.city as "Kota",
          COALESCE(c.industry, 'Umum') as "Industri",
          COALESCE(COUNT(r.id), 0)::int as "Total Ulasan",
          COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int as "Rata-rata Uang Saku",
          COALESCE(ROUND(AVG(r.environment_score)::numeric, 1), 0)::float as "Skor Lingkungan",
          COALESCE(ROUND(AVG(r.mentorship_score)::numeric, 1), 0)::float as "Skor Mentorship"
        FROM companies c
        LEFT JOIN reviews r ON c.id = r.company_id AND (r.status = 'published' OR r.status IS NULL)
        GROUP BY c.id
        ORDER BY "Total Ulasan" DESC, c.name ASC
      `);
      resultData = res.rows;
    } else if (type === "reviews") {
      // SECURITY: student_hash is explicitly excluded!
      const res = await query(`
        SELECT 
          c.name as "Perusahaan",
          r.position as "Jurusan/Posisi",
          r.stipend_amount as "Uang Saku",
          r.environment_score as "Skor Lingkungan",
          r.mentorship_score as "Skor Mentorship",
          r.review_text as "Isi Ulasan",
          r.helpful_count as "Jumlah Vote Bermanfaat",
          TO_CHAR(r.created_at, 'YYYY-MM-DD HH24:MI') as "Waktu Dikirim"
        FROM reviews r
        JOIN companies c ON r.company_id = c.id
        WHERE (r.status = 'published' OR r.status IS NULL)
        ORDER BY r.created_at DESC
      `);
      resultData = res.rows;
    } else if (type === "analytics") {
      const res = await query(`
        SELECT 
          c.industry as "Sektor Industri",
          COUNT(r.id)::int as "Total Review",
          ROUND(AVG(r.stipend_amount)::numeric, 0)::int as "Rata-rata Uang Saku",
          ROUND(AVG(r.environment_score)::numeric, 1)::float as "Rata-rata Lingkungan",
          ROUND(AVG(r.mentorship_score)::numeric, 1)::float as "Rata-rata Mentor"
        FROM companies c
        JOIN reviews r ON c.id = r.company_id
        WHERE (r.status = 'published' OR r.status IS NULL)
        GROUP BY c.industry
        ORDER BY "Total Review" DESC
      `);
      resultData = res.rows;
    }

    if (format === "json") {
      return NextResponse.json(resultData);
    }

    const csvOutput = toCSV(resultData);

    return new NextResponse(csvOutput, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${filename}.csv"`,
      },
    });
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Gagal mengekspor data" }, { status: 500 });
  }
}
