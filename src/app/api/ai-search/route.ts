import { NextRequest, NextResponse } from "next/server";
import { query } from "@/lib/db";
import { askLima, parseJsonObject } from "@/lib/ai";

interface ParsedFilters {
  industries: string[];
  cities: string[];
  minStipend: number;
  minScore: number;
  sortBy: string;
  keywords: string[];
}

type Intent = "companies" | "tasks" | "reviews" | "summary";

const INTENTS: Intent[] = ["companies", "tasks", "reviews", "summary"];
const SORT_KEYS = ["review_count", "avg_stipend", "avg_mentorship", "avg_environment"];
const TASK_STATUSES = ["pending", "in_progress", "completed"];
const INDUSTRIES = [
  "Teknologi", "Telekomunikasi", "Manufaktur", "Perkapalan & Pertahanan",
  "Logistik & Maritim", "Konstruksi & Material", "Kimia & Industri", "Akuntansi", "Pemasaran",
];
const CITIES = ["Surabaya", "Gresik", "Sidoarjo"];

function parseQuery(raw: string): ParsedFilters {
  const q = raw.toLowerCase().trim();
  const filters: ParsedFilters = {
    industries: [],
    cities: [],
    minStipend: 0,
    minScore: 0,
    sortBy: "review_count",
    keywords: [],
  };

  // Industry detection
  if (q.includes("teknologi") || q.includes("rpl") || q.includes("tkj") || q.includes("informatika") || q.includes("programming") || q.includes("developer")) {
    filters.industries.push("Teknologi");
  }
  if (q.includes("telekomunikasi") || q.includes("telkom") || q.includes("jaringan") || q.includes("fiber")) {
    filters.industries.push("Telekomunikasi");
  }
  if (q.includes("manufaktur") || q.includes("mesin") || q.includes("otomotif") || q.includes("produksi")) {
    filters.industries.push("Manufaktur");
  }
  if (q.includes("perkapalan") || q.includes("kapal") || q.includes("maritim") || q.includes("galangan")) {
    filters.industries.push("Perkapalan & Pertahanan");
  }
  if (q.includes("logistik") || q.includes("pelabuhan") || q.includes("shipping")) {
    filters.industries.push("Logistik & Maritim");
  }
  if (q.includes("konstruksi") || q.includes("bangunan") || q.includes("material")) {
    filters.industries.push("Konstruksi & Material");
  }
  if (q.includes("kimia") || q.includes("petrokimia") || q.includes("industri")) {
    filters.industries.push("Kimia & Industri");
  }
  if (q.includes("akuntansi") || q.includes("finansial") || q.includes("keuangan")) {
    filters.industries.push("Akuntansi");
  }
  if (q.includes("pemasaran") || q.includes("marketing") || q.includes("digital")) {
    filters.industries.push("Pemasaran");
  }

  // City detection
  if (q.includes("surabaya")) filters.cities.push("Surabaya");
  if (q.includes("gresik")) filters.cities.push("Gresik");
  if (q.includes("sidoarjo")) filters.cities.push("Sidoarjo");

  // Stipend detection
  const stipendMatch = q.match(/(?:uang\s*saku|stipend|gaji|bayaran)\s*(?:>=?|lebih\s*dari|di\s*atas|minimum|min)?\s*(?:rp\.?\s*)?(\d[\d.]+)/);
  if (stipendMatch) {
    filters.minStipend = parseInt(stipendMatch[1].replace(/\./g, ""));
  }
  // Round number patterns like "500 ribu" or "750rb"
  const ribuMatch = q.match(/(\d+)\s*(?:ribu|rb|k)/);
  if (ribuMatch) {
    filters.minStipend = Math.max(filters.minStipend, parseInt(ribuMatch[1]) * 1000);
  }

  // Score detection
  if (q.includes("terbaik") || q.includes("bagus") || q.includes("bintang") || q.includes("skor tinggi")) {
    filters.minScore = 4.0;
  } else if (q.includes("lumayan") || q.includes("cukup")) {
    filters.minScore = 3.0;
  }

  // Sort detection
  if (q.includes("uang saku") || q.includes("stipend") || q.includes("gaji")) {
    filters.sortBy = "avg_stipend";
  } else if (q.includes("mentor") || q.includes("bimbingan")) {
    filters.sortBy = "avg_mentorship";
  } else if (q.includes("lingkungan") || q.includes("suasana")) {
    filters.sortBy = "avg_environment";
  }

  // Fallback: extract meaningful keywords
  if (filters.industries.length === 0 && filters.cities.length === 0) {
    const words = q.split(/\s+/).filter(w => w.length > 3 && !["yang", "dengan", "untuk", "terbaik", "adalah", "tempat", "magang", "cari", "cari"].includes(w));
    filters.keywords = words.slice(0, 3);
  }

  return filters;
}

const PARSE_SYSTEM = `Kamu mesin pencari "Lima", portal magang siswa SMK Indonesia.
Balas HANYA dengan satu objek JSON (tanpa markdown, tanpa teks lain):
{
  "intent": "companies" | "tasks" | "reviews" | "summary",
  "filters": {
    "industries": string[],
    "cities": string[],
    "minStipend": number,
    "minScore": number,
    "sortBy": "review_count" | "avg_stipend" | "avg_mentorship" | "avg_environment",
    "keywords": string[]
  },
  "taskStatus": "pending" | "in_progress" | "completed" | null,
  "answer": "ringkasan 1-2 kalimat Bahasa Indonesia sebagai jawaban langsung ke user"
}
Aturan intent:
- "tasks": user menanyakan tugas/jadwal/rencananya sendiri ("rencana saya", "tugas hari ini", "todo", "pekerjaan saya").
- "summary": user minta ringkasan/ikhtisar/statistik ("ringkasan", "summary", "statistik", "gambaran umum").
- "reviews": user minta pengalaman/ulasan/opini siswa ("ulasan", "review", "pengalaman", "cerita", "kata siswa").
- "companies": default — mencari/memfilter perusahaan magang.
Contoh: "pengalaman siswa soal mentor" → reviews; "rencana magang saya hari ini" → tasks; "ringkasan uang saku" → summary; "magang teknologi Surabaya" → companies.
Aturan filters:
- industries hanya dari: Teknologi, Telekomunikasi, Manufaktur, Perkapalan & Pertahanan, Logistik & Maritim, Konstruksi & Material, Kimia & Industri, Akuntansi, Pemasaran. Selain itu [].
- cities hanya: Surabaya, Gresik, Sidoarjo. Selain itu [].
- minStipend dalam Rupiah utuh (mis. "2 juta" → 2000000). minScore 0-5.
- sortBy: "avg_stipend" jika topik uang saku/gaji, "avg_mentorship" jika bimbingan mentor, "avg_environment" jika lingkungan/kantor, selain itu "review_count".
- keywords: 0-3 kata bermakna huruf kecil untuk pencarian teks; buang kata umum (yang, dengan, untuk, magang, saya, cari).
- taskStatus diisi hanya saat intent "tasks"; jika user bilang "hari ini"/"belum selesai" pakai "pending", jika "sedang dikerjakan" pakai "in_progress", jika "selesai" pakai "completed", selain itu null.
- answer dalam Bahasa Indonesia, sebutkan angka/filter spesifik jika ada.`;

function asString(v: unknown): string {
  return typeof v === "string" ? v.trim() : "";
}

function asStringArray(v: unknown, allowed?: string[]): string[] {
  if (!Array.isArray(v)) return [];
  const out = v
    .filter((x): x is string => typeof x === "string" && x.trim().length > 0)
    .map((x) => x.trim())
    .slice(0, 5);
  return allowed ? out.filter((x) => allowed.includes(x)) : out;
}

function asNumber(v: unknown, min: number, max: number): number {
  const n = typeof v === "number" ? v : typeof v === "string" ? parseFloat(v) : NaN;
  if (!Number.isFinite(n)) return min;
  return Math.min(max, Math.max(min, n));
}

function sanitizeFilters(raw: unknown): ParsedFilters {
  const f = (raw && typeof raw === "object" ? raw : {}) as Record<string, unknown>;
  const sortBy = asString(f.sortBy);
  return {
    industries: asStringArray(f.industries, INDUSTRIES),
    cities: asStringArray(f.cities, CITIES),
    minStipend: Math.round(asNumber(f.minStipend, 0, 10000000)),
    minScore: Math.round(asNumber(f.minScore, 0, 5) * 10) / 10,
    sortBy: SORT_KEYS.includes(sortBy) ? sortBy : "review_count",
    keywords: asStringArray(f.keywords).map((k) => k.toLowerCase()).slice(0, 3),
  };
}

function sanitizeIntent(v: unknown): Intent {
  const s = asString(v);
  return (INTENTS as string[]).includes(s) ? (s as Intent) : "companies";
}

// Deterministic override — kerehore routes to random upstreams, so LLM intent
// alone is flaky for obvious queries. ponytail: keywords > LLM, keep list short.
function guessIntent(raw: string): Intent | null {
  const q = raw.toLowerCase();
  if (/(ringkasan|summary|ikhtisar|statistik|gambaran umum|rekap)/.test(q)) return "summary";
  if (/(rencana|tugas|todo|jadwal)/.test(q) && /(saya|aku|hari ini|saya hari)/.test(q)) return "tasks";
  if (/(pengalaman|ulasan|review|opini|testimoni|kata siswa|cerita)/.test(q)) return "reviews";
  return null;
}

async function llmParse(rawQuery: string): Promise<{
  intent: Intent;
  filters: ParsedFilters;
  taskStatus: string | null;
  answer: string | null;
} | null> {
  const content = await askLima(PARSE_SYSTEM, rawQuery, 700);
  if (!content) return null;
  const json = parseJsonObject(content);
  if (!json) return null;
  const status = asString(json.taskStatus);
  return {
    intent: sanitizeIntent(json.intent),
    filters: sanitizeFilters(json.filters),
    taskStatus: TASK_STATUSES.includes(status) ? status : null,
    answer: asString(json.answer) || null,
  };
}

async function searchCompanies(filters: ParsedFilters): Promise<Record<string, unknown>[]> {
  let sql = `
    SELECT
      c.id, c.name, c.city, c.industry,
      COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend,
      COALESCE(ROUND(AVG(r.environment_score)::numeric, 1), 0)::float AS avg_environment,
      COALESCE(ROUND(AVG(r.mentorship_score)::numeric, 1), 0)::float AS avg_mentorship,
      COUNT(r.id)::int AS review_count
    FROM companies c
    LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
  `;

  const conditions: string[] = [];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.industries.length > 0) {
    conditions.push(`c.industry IN (${filters.industries.map((_, i) => `$${paramIdx + i}`).join(", ")})`);
    params.push(...filters.industries);
    paramIdx += filters.industries.length;
  }

  if (filters.cities.length > 0) {
    conditions.push(`c.city IN (${filters.cities.map((_, i) => `$${paramIdx + i}`).join(", ")})`);
    params.push(...filters.cities);
    paramIdx += filters.cities.length;
  }

  if (filters.minStipend > 0) {
    conditions.push(`COALESCE(AVG(r.stipend_amount), 0) >= $${paramIdx}`);
    params.push(filters.minStipend);
    paramIdx++;
  }

  if (filters.minScore > 0) {
    conditions.push(`COALESCE(AVG(r.environment_score) + AVG(r.mentorship_score), 0) / 2 >= $${paramIdx}`);
    params.push(filters.minScore);
    paramIdx++;
  }

  if (filters.keywords.length > 0) {
    const kwConditions = filters.keywords.map((kw) => {
      const cond = `(c.name ILIKE $${paramIdx} OR c.industry ILIKE $${paramIdx} OR c.city ILIKE $${paramIdx})`;
      params.push(`%${kw}%`);
      paramIdx++;
      return cond;
    });
    conditions.push(`(${kwConditions.join(" OR ")})`);
  }

  if (conditions.length > 0) {
    sql += ` WHERE ${conditions.join(" AND ")}`;
  }

  sql += ` GROUP BY c.id, c.name, c.city, c.industry`;

  const orderMap: Record<string, string> = {
    avg_stipend: "avg_stipend DESC",
    avg_mentorship: "avg_mentorship DESC",
    avg_environment: "avg_environment DESC",
    review_count: "review_count DESC, (COALESCE(AVG(r.environment_score),0) + COALESCE(AVG(r.mentorship_score),0))/2 DESC",
  };
  sql += ` ORDER BY ${orderMap[filters.sortBy] || orderMap.review_count}`;
  sql += ` LIMIT 10`;

  const result = await query(sql, params);

  const results = result.rows.map((row: Record<string, unknown>) => {
    const matchReasons: string[] = [];
    let confidence = 50;

    if (filters.industries.length > 0 && filters.industries.includes(String(row.industry))) {
      confidence += 25;
      matchReasons.push(`Sesuai industri ${row.industry}`);
    }
    if (filters.cities.length > 0 && filters.cities.includes(String(row.city))) {
      confidence += 10;
      matchReasons.push(`Lokasi di ${row.city}`);
    }
    if (filters.minStipend > 0 && Number(row.avg_stipend) >= filters.minStipend) {
      confidence += 10;
      matchReasons.push(`Uang saku ${Number(row.avg_stipend).toLocaleString("id-ID")}/bulan`);
    }
    if (Number(row.review_count) > 0) {
      confidence += Math.min(10, Number(row.review_count) * 2);
      matchReasons.push(`${row.review_count} ulasan`);
    }
    if (Number(row.avg_environment) >= 4.0 || Number(row.avg_mentorship) >= 4.0) {
      confidence += 5;
      matchReasons.push("Skor tinggi dari siswa");
    }
    confidence = Math.min(99, confidence);

    return {
      id: row.id,
      name: row.name,
      city: row.city,
      industry: row.industry,
      avg_stipend: row.avg_stipend,
      avg_environment: row.avg_environment,
      avg_mentorship: row.avg_mentorship,
      review_count: row.review_count,
      confidence,
      matchReasons,
    };
  });

  results.sort((a, b) => Number(b.confidence) - Number(a.confidence));
  return results;
}

const TASK_STATUS_LABEL: Record<string, string> = {
  pending: "Menunggu",
  in_progress: "Sedang berjalan",
  completed: "Selesai",
};

async function searchTasks(studentHash: string, status: string | null): Promise<Record<string, unknown>[]> {
  const params: unknown[] = [studentHash];
  let sql = `
    SELECT t.id, t.title, t.status, t.due_date, c.name AS company_name
    FROM user_tasks t
    JOIN companies c ON t.company_id = c.id
    WHERE t.student_hash = $1`;
  if (status) {
    params.push(status);
    sql += ` AND t.status = $${params.length}`;
  }
  sql += ` ORDER BY (t.status = 'completed') ASC, t.due_date ASC NULLS LAST, t.created_at DESC LIMIT 10`;

  const result = await query(sql, params);
  return result.rows.map((row: Record<string, unknown>) => {
    const status = String(row.status);
    const due = row.due_date ? new Date(String(row.due_date)) : null;
    return {
      id: row.id,
      name: row.title,
      city: row.company_name,
      industry: "Tugas Magang",
      avg_stipend: 0,
      avg_environment: 0,
      avg_mentorship: 0,
      review_count: 0,
      confidence: status === "completed" ? 70 : status === "in_progress" ? 88 : 95,
      matchReasons: [
        `Status: ${TASK_STATUS_LABEL[status] || status}`,
        due ? `Tenggat ${due.toLocaleDateString("id-ID")}` : "Tanpa tenggat",
      ],
    };
  });
}

async function searchReviews(filters: ParsedFilters): Promise<Record<string, unknown>[]> {
  const conditions = [`r.status = 'published'`];
  const params: unknown[] = [];
  let paramIdx = 1;

  if (filters.cities.length > 0) {
    conditions.push(`c.city IN (${filters.cities.map(() => `$${paramIdx++}`).join(", ")})`);
    params.push(...filters.cities);
  }
  if (filters.industries.length > 0) {
    conditions.push(`c.industry IN (${filters.industries.map(() => `$${paramIdx++}`).join(", ")})`);
    params.push(...filters.industries);
  }
  if (filters.minStipend > 0) {
    conditions.push(`r.stipend_amount >= $${paramIdx++}`);
    params.push(filters.minStipend);
  }

  const result = await query(
    `SELECT
       r.id, r.position, r.review_text, r.stipend_amount,
       r.environment_score, r.mentorship_score,
       c.id AS company_id, c.name, c.city, c.industry
     FROM reviews r
     JOIN companies c ON c.id = r.company_id
     WHERE ${conditions.join(" AND ")}
     ORDER BY (r.environment_score + r.mentorship_score) DESC, r.helpful_count DESC, r.created_at DESC
     LIMIT 10`,
    params
  );

  return result.rows.map((row: Record<string, unknown>) => {
    const score = (Number(row.environment_score) + Number(row.mentorship_score)) / 2;
    const text = String(row.review_text || "");
    const snippet = text.length > 90 ? `${text.slice(0, 90)}…` : text;
    return {
      id: row.company_id,
      name: row.name,
      city: row.city,
      industry: row.industry,
      avg_stipend: row.stipend_amount,
      avg_environment: Number(row.environment_score),
      avg_mentorship: Number(row.mentorship_score),
      review_count: 1,
      confidence: Math.min(99, Math.round(score * 20)),
      matchReasons: [`Posisi ${row.position}`, `${score.toFixed(1)}/5 · ${snippet}`],
    };
  });
}

async function buildSummary(rawQuery: string): Promise<string> {
  try {
    const [statsRes, topRes] = await Promise.all([
      query(`SELECT
        COUNT(DISTINCT c.id)::int AS total_companies,
        COUNT(r.id)::int AS total_reviews,
        COALESCE(ROUND(AVG(r.stipend_amount)::numeric, 0), 0)::int AS avg_stipend
      FROM companies c
      LEFT JOIN reviews r ON c.id = r.company_id AND r.status = 'published'`),
      query(`SELECT
        c.name,
        ROUND((AVG(r.environment_score) + AVG(r.mentorship_score))::numeric / 2, 1)::float AS avg_score,
        COUNT(r.id)::int AS review_count
      FROM companies c
      JOIN reviews r ON c.id = r.company_id AND r.status = 'published'
      GROUP BY c.id, c.name
      ORDER BY avg_score DESC
      LIMIT 3`),
    ]);

    const stats = statsRes.rows[0] || {};
    const topCompanies = topRes.rows.map((t: Record<string, unknown>) => ({
      name: t.name,
      avg_score: t.avg_score,
      reviews: t.review_count,
    }));
    const facts = {
      total_companies: stats.total_companies || 0,
      total_reviews: stats.total_reviews || 0,
      avg_stipend: stats.avg_stipend || 0,
      top_companies: topCompanies,
    };

    const content = await askLima(
      "Kamu 'Lima', asisten magang siswa SMK Indonesia. Tulis ringkasan 2-3 kalimat Bahasa Indonesia berdasarkan data JSON dan pertanyaan user. Jawaban polos tanpa markdown.",
      `Pertanyaan: ${rawQuery}\nData: ${JSON.stringify(facts)}`,
      400
    );
    if (content && content.trim()) return content.trim();

    const top = topCompanies[0];
    return [
      `Platform berisi ${facts.total_companies} perusahaan dengan ${facts.total_reviews} ulasan siswa; uang saku rata-rata Rp ${Number(facts.avg_stipend).toLocaleString("id-ID")}/bulan.`,
      top ? `Perusahaan skor tertinggi: ${top.name} (${top.avg_score}/5 dari ${top.reviews} ulasan).` : "",
    ].filter(Boolean).join(" ");
  } catch (error) {
    console.error("buildSummary error:", error);
    return "";
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const rawQuery = body?.query;
    const studentHash =
      typeof body?.student_hash === "string" && body.student_hash
        ? body.student_hash
        : "hash_demo_student";

    if (!rawQuery || typeof rawQuery !== "string") {
      return NextResponse.json(
        { success: false, error: "query wajib diisi" },
        { status: 400 }
      );
    }

    const parsed = await llmParse(rawQuery);
    const llmIntent = parsed?.intent ?? "companies";
    const intent: Intent = guessIntent(rawQuery) ?? llmIntent;
    const filters = parsed ? parsed.filters : parseQuery(rawQuery);
    let answer = intent !== llmIntent ? null : (parsed?.answer ?? null);
    let data: Record<string, unknown>[] = [];

    if (intent === "tasks") {
      data = await searchTasks(studentHash, parsed?.taskStatus ?? null);
      if (data.length === 0 && !answer) answer = "Belum ada tugas yang cocok.";
    } else if (intent === "reviews") {
      data = await searchReviews(filters);
      if (data.length === 0 && !answer) answer = "Belum ada ulasan yang cocok.";
    } else if (intent === "summary") {
      const summary = await buildSummary(rawQuery);
      answer = summary || null;
    } else {
      data = await searchCompanies(filters);
    }

    return NextResponse.json({
      success: true,
      query: rawQuery,
      intent,
      answer,
      parsedFilters: filters,
      count: data.length,
      data,
    });
  } catch (error) {
    console.error("POST /api/ai-search error:", error);
    return NextResponse.json(
      { success: false, error: "Gagal memproses pencarian" },
      { status: 500 }
    );
  }
}
