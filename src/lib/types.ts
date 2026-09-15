/**
 * Shared TypeScript types for the Portal Magang application.
 * Used across both API routes and frontend components.
 */

// ============================================================
// Database Row Types
// ============================================================

export interface Company {
  id: string;
  name: string;
  city: string;
  industry: string | null;
  created_at: string;
}

export interface Review {
  id: string;
  company_id: string;
  position: string;
  stipend_amount: number;
  environment_score: number;
  mentorship_score: number;
  review_text: string;
  student_hash?: string; // Never exposed to client
  helpful_count: number;
  status: "published" | "hidden" | "flagged";
  flagged_count: number;
  created_at: string;
}

export interface ReviewVote {
  id: string;
  review_id: string;
  voter_hash: string;
  created_at: string;
}

export interface AdminUser {
  id: string;
  username: string;
  role: "admin" | "moderator";
  created_at: string;
}

export interface CompanyClaim {
  id: string;
  company_id: string;
  company_name?: string;
  contact_name: string;
  contact_email: string;
  contact_position?: string;
  status: "pending" | "approved" | "rejected";
  verified_at?: string;
  created_at: string;
}

export interface CompanyReply {
  id: string;
  review_id: string;
  company_id: string;
  company_name?: string;
  reply_text: string;
  created_at: string;
}

export interface Notification {
  id: string;
  recipient_hash: string;
  type: "new_review" | "vote_received" | "reply_received" | "claim_status";
  title: string;
  body?: string;
  reference_id?: string;
  is_read: boolean;
  created_at: string;
}

export interface ReviewFlag {
  id: string;
  review_id: string;
  review_text?: string;
  company_name?: string;
  reporter_hash: string;
  reason: "spam" | "inappropriate" | "fake" | "other";
  description?: string;
  status: "pending" | "resolved" | "dismissed";
  resolved_by?: string;
  created_at: string;
}

export interface CompanyQuestion {
  id: string;
  company_id: string;
  question_text: string;
  student_hash: string;
  answer_text?: string | null;
  answered_by?: string | null;
  answered_at?: string | null;
  is_answered: boolean;
  created_at: string;
}

// ============================================================
// API Request/Response Types
// ============================================================

/** POST /api/reviews — Request body */
export interface CreateReviewRequest {
  nisn: string;
  company_id: string;
  position: string;
  stipend_amount: number;
  environment_score: number;
  mentorship_score: number;
  review_text: string;
}

/** GET /api/companies/[id] — Response with aggregated stats */
export interface CompanyDetail extends Company {
  review_count: number;
  avg_environment: number;
  avg_mentorship: number;
  avg_stipend: number;
  min_stipend: number;
  max_stipend: number;
  is_claimed?: boolean;
  claim_info?: {
    contact_name: string;
    contact_position?: string;
    verified_at?: string;
  } | null;
}

/** GET /api/reviews — A review as returned to the client (no student_hash) */
export interface ReviewPublic {
  id: string;
  company_id: string;
  company_name?: string;
  position: string;
  stipend_amount: number;
  environment_score: number;
  mentorship_score: number;
  review_text: string;
  helpful_count: number;
  status?: string;
  flagged_count?: number;
  created_at: string;
  reply?: CompanyReply | null;
  is_most_helpful?: boolean;
}

/** GET /api/stats — Dashboard statistics */
export interface DashboardStats {
  total_companies: number;
  total_reviews: number;
  avg_stipend: number;
  avg_environment: number;
  avg_mentorship: number;
  trending_companies: TrendingCompany[];
}

export interface TrendingCompany {
  id: string;
  name: string;
  city: string;
  industry: string;
  review_count: number;
  avg_score: number;
}

export interface AnalyticsData {
  industryAverages: {
    industry: string;
    avgStipend: number;
    avgEnvironment: number;
    avgMentorship: number;
    reviewCount: number;
  }[];
  monthlyTrends: {
    month: string;
    reviewCount: number;
    avgStipend: number;
  }[];
  scoreDistribution: {
    score: number;
    environmentCount: number;
    mentorshipCount: number;
  }[];
  topCompaniesComparison: {
    name: string;
    environment: number;
    mentorship: number;
    stipend: number;
    reviews: number;
  }[];
}

// ============================================================
// Query Parameter Types
// ============================================================

export type ReviewSortField = "created_at" | "environment_score" | "mentorship_score" | "stipend_amount" | "helpful_count";
export type SortOrder = "asc" | "desc";

