import { query } from "@/lib/db";

/**
 * Log an admin action to the audit trail.
 * Called by admin API routes after performing modifying actions.
 */
export async function logAuditAction(params: {
  adminUsername: string;
  action: string;
  targetType: string;
  targetId?: string;
  details?: Record<string, any>;
  ipAddress?: string;
}) {
  try {
    await query(
      `INSERT INTO admin_audit_logs (admin_username, action, target_type, target_id, details, ip_address)
       VALUES ($1, $2, $3, $4, $5::jsonb, $6)`,
      [
        params.adminUsername,
        params.action,
        params.targetType,
        params.targetId || null,
        JSON.stringify(params.details || {}),
        params.ipAddress || null,
      ]
    );
  } catch (err) {
    console.error("[Audit] Failed to log action:", err);
    // Don't throw — audit logging failure should not break the main operation
  }
}
