import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { Company } from "@/lib/types";

/**
 * GET /api/companies
 *
 * Fetch all companies with optional filtering.
 * Query params: ?city=, ?industry=, ?search=
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const city = searchParams.get("city");
    const industry = searchParams.get("industry");
    const search = searchParams.get("search");
    const minStipend = searchParams.get("min_stipend");
    const maxStipend = searchParams.get("max_stipend");
    const minRating = searchParams.get("min_rating");
    const sortBy = searchParams.get("sort_by") || "reviews";
    const sortOrder = searchParams.get("sort_order")?.toLowerCase() === "asc" ? "ASC" : "DESC";

    let sql = `
      SELECT
        c.*,
        COALESCE(COUNT(r.id), 0)::int AS review_count,
        COALESCE(ROUND(AVG(r.environment_score)::numeric, 1), 0)::float AS avg_environment,
        COALESCE(ROUND(AVG(r.mentorship_score)::numeric, 1), 0)::float AS avg_mentorship,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend,
        (cc.status = 'approved') AS is_claimed
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id AND (r.status = 'published' OR r.status IS NULL)
      LEFT JOIN company_claims cc ON c.id = cc.company_id
    `;

    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (city && city !== "Semua") {
      conditions.push(`c.city ILIKE $${paramIndex}`);
      params.push(`%${city}%`);
      paramIndex++;
    }

    if (industry && industry !== "Semua") {
      conditions.push(`c.industry ILIKE $${paramIndex}`);
      params.push(`%${industry}%`);
      paramIndex++;
    }

    if (search) {
      conditions.push(`c.name ILIKE $${paramIndex}`);
      params.push(`%${search}%`);
      paramIndex++;
    }

    if (conditions.length > 0) {
      sql += ` WHERE ${conditions.join(" AND ")}`;
    }

    sql += ` GROUP BY c.id, cc.status`;

    // HAVING filters
    const havingConditions: string[] = [];
    if (minStipend) {
      havingConditions.push(`COALESCE(AVG(r.stipend_amount), 0) >= $${paramIndex}`);
      params.push(parseInt(minStipend, 10));
      paramIndex++;
    }
    if (maxStipend) {
      havingConditions.push(`COALESCE(AVG(r.stipend_amount), 0) <= $${paramIndex}`);
      params.push(parseInt(maxStipend, 10));
      paramIndex++;
    }
    if (minRating) {
      havingConditions.push(
        `(COALESCE(AVG(r.environment_score), 0) + COALESCE(AVG(r.mentorship_score), 0)) / 2 >= $${paramIndex}`
      );
      params.push(parseFloat(minRating));
      paramIndex++;
    }

    if (havingConditions.length > 0) {
      sql += ` HAVING ${havingConditions.join(" AND ")}`;
    }

    // Sorting
    let orderClause = `review_count DESC, c.name ASC`;
    if (sortBy === "rating") {
      orderClause = `(avg_environment + avg_mentorship) ${sortOrder}, review_count DESC`;
    } else if (sortBy === "stipend") {
      orderClause = `avg_stipend ${sortOrder}`;
    } else if (sortBy === "name") {
      orderClause = `c.name ${sortOrder}`;
    } else if (sortBy === "reviews") {
      orderClause = `review_count ${sortOrder}, c.name ASC`;
    }

    sql += ` ORDER BY ${orderClause}`;

    const result = await query(sql, params);

    return NextResponse.json({
      success: true,
      data: result.rows,
      count: result.rows.length,
    });
  } catch (error) {
    console.error("GET /api/companies error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal mengambil data perusahaan" },
      { status: 500 }
    );
  }
}
