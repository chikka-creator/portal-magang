import { NextResponse } from "next/server";
import { query } from "@/lib/db";
import { getAdminSession } from "@/lib/session";

export async function GET() {
  try {
    const admin = await getAdminSession();
    if (!admin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const [
      reviewsCount,
      hiddenCount,
      flagsCount,
      claimsPending,
      claimsApproved,
      companiesCount,
      recentReviews,
      recentClaims,
    ] = await Promise.all([
      query("SELECT COUNT(*) as count FROM reviews"),
      query("SELECT COUNT(*) as count FROM reviews WHERE status = 'hidden'"),
      query("SELECT COUNT(*) as count FROM review_flags WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM company_claims WHERE status = 'pending'"),
      query("SELECT COUNT(*) as count FROM company_claims WHERE status = 'approved'"),
      query("SELECT COUNT(*) as count FROM companies"),
      query(`
        SELECT r.id, r.position, r.created_at, c.name as company_name 
        FROM reviews r 
        JOIN companies c ON r.company_id = c.id 
        ORDER BY r.created_at DESC 
        LIMIT 5
      `),
      query(`
        SELECT cc.id, cc.contact_name, cc.contact_position, cc.created_at, c.name as company_name 
        FROM company_claims cc 
        JOIN companies c ON cc.company_id = c.id 
        ORDER BY cc.created_at DESC 
        LIMIT 5
      `),
    ]);

    return NextResponse.json({
      stats: {
        totalReviews: parseInt(reviewsCount.rows[0]?.count || "0", 10),
        hiddenReviews: parseInt(hiddenCount.rows[0]?.count || "0", 10),
        pendingFlags: parseInt(flagsCount.rows[0]?.count || "0", 10),
        pendingClaims: parseInt(claimsPending.rows[0]?.count || "0", 10),
        approvedClaims: parseInt(claimsApproved.rows[0]?.count || "0", 10),
        totalCompanies: parseInt(companiesCount.rows[0]?.count || "0", 10),
      },
      recentReviews: recentReviews.rows,
      recentClaims: recentClaims.rows,
    });
  } catch (error) {
    console.error("Admin stats fetch error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
