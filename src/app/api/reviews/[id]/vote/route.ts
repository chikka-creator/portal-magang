import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { hashVoterFingerprint } from "@/lib/hash";

/**
 * POST /api/reviews/[id]/vote
 *
 * Submit a "helpful" vote on a review.
 * Uses IP + User-Agent hash for anonymous duplicate prevention.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: reviewId } = await params;

    // Validate UUID format
    if (
      !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
        reviewId
      )
    ) {
      return NextResponse.json(
        { success: false, error: "ID review tidak valid" },
        { status: 400 }
      );
    }

    // Create anonymous voter fingerprint
    const ip =
      request.headers.get("x-forwarded-for") ||
      request.headers.get("x-real-ip") ||
      "unknown";
    const userAgent = request.headers.get("user-agent") || "unknown";
    const voterHash = hashVoterFingerprint(`${ip}:${userAgent}`);

    // Verify review exists
    const reviewCheck = await query(
      `SELECT id FROM reviews WHERE id = $1`,
      [reviewId]
    );
    if (reviewCheck.rows.length === 0) {
      return NextResponse.json(
        { success: false, error: "Review tidak ditemukan" },
        { status: 404 }
      );
    }

    // Insert vote and increment helpful_count atomically
    await query(
      `INSERT INTO review_votes (review_id, voter_hash) VALUES ($1, $2)`,
      [reviewId, voterHash]
    );

    const result = await query<{ helpful_count: number }>(
      `
      UPDATE reviews
      SET helpful_count = helpful_count + 1
      WHERE id = $1
      RETURNING helpful_count
      `,
      [reviewId]
    );

    return NextResponse.json({
      success: true,
      helpful_count: result.rows[0].helpful_count,
      message: "Terima kasih atas vote-mu!",
    });
  } catch (error: unknown) {
    // Handle duplicate vote
    if (
      error instanceof Error &&
      error.message.includes("uq_vote_per_voter")
    ) {
      return NextResponse.json(
        {
          success: false,
          error: "Kamu sudah pernah vote review ini",
        },
        { status: 409 }
      );
    }

    console.error("POST /api/reviews/[id]/vote error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal menyimpan vote" },
      { status: 500 }
    );
  }
}
