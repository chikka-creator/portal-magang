import { cookies } from "next/headers";
import { createToken, verifyToken } from "./auth";

const STUDENT_COOKIE_NAME = "smk_student_session";
const ADMIN_COOKIE_NAME = "smk_admin_session";

export interface StudentSessionPayload {
  studentHash: string;
}

export interface AdminSessionPayload {
  adminId: string;
  username: string;
  role: "admin" | "moderator";
}

/**
 * Get current student session from cookies (if any)
 */
export async function getStudentSession(): Promise<StudentSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(STUDENT_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken<StudentSessionPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Get current admin session from cookies (if any)
 */
export async function getAdminSession(): Promise<AdminSessionPayload | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(ADMIN_COOKIE_NAME)?.value;
    if (!token) return null;
    return verifyToken<AdminSessionPayload>(token);
  } catch {
    return null;
  }
}

/**
 * Helper to get student cookie name for client checks
 */
export { STUDENT_COOKIE_NAME, ADMIN_COOKIE_NAME };
