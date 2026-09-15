import { CreateReviewRequest } from "./types";

/**
 * Validation utilities for API inputs.
 * All validation is performed server-side to prevent tampering.
 */

export interface ValidationError {
  field: string;
  message: string;
}

/**
 * Validate a review submission request.
 * Returns an array of validation errors (empty = valid).
 */
export function validateReviewRequest(
  body: Partial<CreateReviewRequest>
): ValidationError[] {
  const errors: ValidationError[] = [];

  // NISN validation (10-digit numeric string)
  if (!body.nisn || typeof body.nisn !== "string") {
    errors.push({ field: "nisn", message: "NISN wajib diisi" });
  } else if (!/^\d{10}$/.test(body.nisn.trim())) {
    errors.push({
      field: "nisn",
      message: "NISN harus berupa 10 digit angka",
    });
  }

  // Company ID validation (UUID format)
  if (!body.company_id || typeof body.company_id !== "string") {
    errors.push({ field: "company_id", message: "Perusahaan wajib dipilih" });
  } else if (
    !/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
      body.company_id
    )
  ) {
    errors.push({
      field: "company_id",
      message: "ID perusahaan tidak valid",
    });
  }

  // Position validation
  if (!body.position || typeof body.position !== "string") {
    errors.push({ field: "position", message: "Posisi/jurusan wajib diisi" });
  } else if (body.position.trim().length < 3 || body.position.trim().length > 50) {
    errors.push({
      field: "position",
      message: "Posisi harus antara 3-50 karakter",
    });
  }

  // Stipend amount validation
  if (body.stipend_amount === undefined || body.stipend_amount === null) {
    errors.push({
      field: "stipend_amount",
      message: "Jumlah uang saku wajib diisi",
    });
  } else if (
    typeof body.stipend_amount !== "number" ||
    body.stipend_amount < 0 ||
    body.stipend_amount > 10000000
  ) {
    errors.push({
      field: "stipend_amount",
      message: "Uang saku harus antara Rp 0 - Rp 10.000.000",
    });
  }

  // Score validations (1-5)
  validateScore(body.environment_score, "environment_score", "Skor lingkungan", errors);
  validateScore(body.mentorship_score, "mentorship_score", "Skor mentorship", errors);

  // Review text validation
  if (!body.review_text || typeof body.review_text !== "string") {
    errors.push({ field: "review_text", message: "Review wajib diisi" });
  } else if (body.review_text.trim().length < 20) {
    errors.push({
      field: "review_text",
      message: "Review minimal 20 karakter",
    });
  } else if (body.review_text.trim().length > 5000) {
    errors.push({
      field: "review_text",
      message: "Review maksimal 5000 karakter",
    });
  }

  return errors;
}

function validateScore(
  value: number | undefined,
  field: string,
  label: string,
  errors: ValidationError[]
): void {
  if (value === undefined || value === null) {
    errors.push({ field, message: `${label} wajib diisi` });
  } else if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < 1 ||
    value > 5
  ) {
    errors.push({
      field,
      message: `${label} harus antara 1-5`,
    });
  }
}
