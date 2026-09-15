import { NextResponse } from "next/server";
import { getAllPlatformSettings } from "@/lib/settings";

export const dynamic = "force-dynamic";
export const revalidate = 0;

/**
 * GET /api/settings/public
 * Returns public platform settings (maintenance mode, review policies, etc.)
 */
export async function GET() {
  try {
    const settings = await getAllPlatformSettings();
    return NextResponse.json(
      {
        success: true,
        settings: {
          maintenance_mode: settings.maintenance_mode === "true",
          allow_student_reviews: settings.allow_student_reviews !== "false",
          auto_approve_reviews: settings.auto_approve_reviews === "true",
          min_review_length: parseInt(settings.min_review_length || "30", 10),
          max_flags_auto_hide: parseInt(settings.max_flags_auto_hide || "3", 10),
          platform_contact_email: settings.platform_contact_email || "support@portalmagang.id",
        },
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/settings/public error:", error);
    return NextResponse.json({
      success: true,
      settings: {
        maintenance_mode: false,
        allow_student_reviews: true,
        auto_approve_reviews: true,
        min_review_length: 30,
        max_flags_auto_hide: 3,
        platform_contact_email: "support@portalmagang.id",
      },
    });
  }
}
