import { query } from "@/lib/db";

/**
 * Get a single platform setting value by key
 */
export async function getPlatformSetting(key: string, defaultValue = ""): Promise<string> {
  try {
    const result = await query(
      `SELECT value FROM platform_settings WHERE key = $1 LIMIT 1`,
      [key]
    );
    if (result.rows.length > 0 && result.rows[0].value !== null) {
      return result.rows[0].value;
    }
    return defaultValue;
  } catch (error) {
    console.error(`[Settings] Failed to get setting '${key}':`, error);
    return defaultValue;
  }
}

/**
 * Get all platform settings as a key-value dictionary
 */
export async function getAllPlatformSettings(): Promise<Record<string, string>> {
  try {
    const result = await query(
      `SELECT key, value FROM platform_settings`
    );
    const dict: Record<string, string> = {};
    for (const row of result.rows) {
      dict[row.key] = row.value;
    }
    return dict;
  } catch (error) {
    console.error("[Settings] Failed to get all settings:", error);
    return {};
  }
}

/**
 * Quick helper to check if maintenance mode is enabled
 */
export async function isMaintenanceMode(): Promise<boolean> {
  const val = await getPlatformSetting("maintenance_mode", "false");
  return val === "true";
}
