import crypto from "crypto";

/**
 * Hashing Utility for NISN Anonymization
 *
 * SECURITY CRITICAL:
 * - NISN is NEVER stored in the database
 * - NISN is concatenated with SECRET_SALT and hashed via SHA-256
 * - Only the resulting hash is persisted as `student_hash`
 * - The raw NISN must be discarded from memory immediately after hashing
 */

/**
 * Hash a student's NISN for anonymous identification.
 *
 * @param nisn - Raw NISN (Nomor Induk Siswa Nasional)
 * @returns SHA-256 hash string
 * @throws Error if SECRET_SALT is not configured
 */
export function hashNISN(nisn: string): string {
  const salt = process.env.SECRET_SALT;

  if (!salt) {
    throw new Error(
      "SECRET_SALT environment variable is not set. " +
        "This is required for secure NISN hashing."
    );
  }

  const hash = crypto
    .createHash("sha256")
    .update(nisn + salt)
    .digest("hex");

  return hash;
}

/**
 * Generate a voter hash for anonymous review voting.
 * Uses a combination of IP address and user agent as a fingerprint.
 *
 * @param fingerprint - A string combining IP + User-Agent or similar identifier
 * @returns SHA-256 hash string
 */
export function hashVoterFingerprint(fingerprint: string): string {
  const salt = process.env.SECRET_SALT;

  if (!salt) {
    throw new Error("SECRET_SALT environment variable is not set.");
  }

  return crypto
    .createHash("sha256")
    .update(fingerprint + salt)
    .digest("hex");
}
