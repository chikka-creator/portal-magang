import { Pool } from "pg";

/**
 * PostgreSQL Database Provider (Vercel-compatible)
 *
 * Uses standard PostgreSQL connection pool only.
 * Schema is initialized inline on first connection (no fs.readFileSync).
 * PGlite fallback removed — production uses hosted PostgreSQL (Neon).
 */

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  isInitialized: boolean | undefined;
};

const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS companies (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL,
    city        VARCHAR(50)     DEFAULT 'Surabaya',
    industry    VARCHAR(50),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

CREATE TABLE IF NOT EXISTS reviews (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    position            VARCHAR(50)     NOT NULL,
    stipend_amount      INTEGER         NOT NULL DEFAULT 0,
    environment_score   SMALLINT        NOT NULL CHECK (environment_score >= 1 AND environment_score <= 5),
    mentorship_score    SMALLINT        NOT NULL CHECK (mentorship_score >= 1 AND mentorship_score <= 5),
    review_text         TEXT            NOT NULL,
    student_hash        VARCHAR(255)    NOT NULL,
    helpful_count       INTEGER         DEFAULT 0,
    status              VARCHAR(20)     DEFAULT 'published',
    flagged_count       INTEGER         DEFAULT 0,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_review_per_student UNIQUE (company_id, student_hash)
);
CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_student_hash ON reviews(student_hash);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

CREATE TABLE IF NOT EXISTS review_votes (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID            NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    voter_hash  VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_vote_per_voter UNIQUE (review_id, voter_hash)
);
CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

CREATE TABLE IF NOT EXISTS admin_users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)     UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     DEFAULT 'moderator',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS company_claims (
    id                  UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id          UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    contact_name        VARCHAR(100)    NOT NULL,
    contact_email       VARCHAR(255)    NOT NULL,
    contact_position    VARCHAR(100),
    claim_password_hash VARCHAR(255)    NOT NULL,
    status              VARCHAR(20)     DEFAULT 'pending',
    verified_at         TIMESTAMP,
    created_at          TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_claim_per_company UNIQUE (company_id)
);
CREATE INDEX IF NOT EXISTS idx_claims_status ON company_claims(status);

CREATE TABLE IF NOT EXISTS company_replies (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID            NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    company_id  UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    reply_text  TEXT            NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_reply_per_review UNIQUE (review_id)
);
CREATE INDEX IF NOT EXISTS idx_replies_review ON company_replies(review_id);
CREATE INDEX IF NOT EXISTS idx_replies_company ON company_replies(company_id);

CREATE TABLE IF NOT EXISTS notifications (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    recipient_hash  VARCHAR(255)    NOT NULL,
    type            VARCHAR(30)     NOT NULL,
    title           VARCHAR(200)    NOT NULL,
    body            TEXT,
    reference_id    UUID,
    is_read         BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_notifications_recipient ON notifications(recipient_hash);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(recipient_hash, is_read);
CREATE INDEX IF NOT EXISTS idx_notifications_created ON notifications(created_at DESC);

CREATE TABLE IF NOT EXISTS review_flags (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id       UUID            NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    reporter_hash   VARCHAR(255)    NOT NULL,
    reason          VARCHAR(50)     NOT NULL,
    description     TEXT,
    status          VARCHAR(20)     DEFAULT 'pending',
    resolved_by     UUID,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT uq_flag_per_reporter UNIQUE (review_id, reporter_hash)
);
CREATE INDEX IF NOT EXISTS idx_flags_review ON review_flags(review_id);
CREATE INDEX IF NOT EXISTS idx_flags_status ON review_flags(status);

CREATE TABLE IF NOT EXISTS company_questions (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id      UUID            NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    question_text   TEXT            NOT NULL,
    student_hash    VARCHAR(64)     NOT NULL,
    answer_text     TEXT,
    answered_by     VARCHAR(100),
    answered_at     TIMESTAMP,
    is_answered     BOOLEAN         DEFAULT FALSE,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_questions_company ON company_questions(company_id);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID            REFERENCES admin_users(id) ON DELETE SET NULL,
    admin_username  VARCHAR(50),
    action          VARCHAR(50)     NOT NULL,
    target_type     VARCHAR(30)     NOT NULL,
    target_id       UUID,
    details         JSONB           DEFAULT '{}',
    ip_address      VARCHAR(45),
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_audit_admin ON admin_audit_logs(admin_id);
CREATE INDEX IF NOT EXISTS idx_audit_action ON admin_audit_logs(action);
CREATE INDEX IF NOT EXISTS idx_audit_created ON admin_audit_logs(created_at DESC);

CREATE TABLE IF NOT EXISTS admin_broadcasts (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    admin_id        UUID            REFERENCES admin_users(id) ON DELETE SET NULL,
    title           VARCHAR(200)    NOT NULL,
    body            TEXT,
    priority        VARCHAR(20)     DEFAULT 'info',
    is_active       BOOLEAN         DEFAULT TRUE,
    expires_at      TIMESTAMP,
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);
CREATE INDEX IF NOT EXISTS idx_broadcasts_active ON admin_broadcasts(is_active, created_at DESC);

CREATE TABLE IF NOT EXISTS platform_settings (
    key             VARCHAR(50)     PRIMARY KEY,
    value           TEXT            NOT NULL,
    label           VARCHAR(100),
    description     TEXT,
    setting_type    VARCHAR(20)     DEFAULT 'text',
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by      UUID            REFERENCES admin_users(id) ON DELETE SET NULL
);
`;

const SEED_SQL = `
INSERT INTO companies (id, name, city, industry) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'PT. Lain Group',            'Surabaya', 'Teknologi'),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'PT. Telkom Indonesia',      'Surabaya', 'Telekomunikasi'),
    ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'CV. Maju Jaya Teknik',      'Surabaya', 'Manufaktur'),
    ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'PT. Pelindo III',           'Surabaya', 'Logistik & Maritim'),
    ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'PT. Semen Indonesia',       'Surabaya', 'Konstruksi & Material'),
    ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'PT. PAL Indonesia',         'Surabaya', 'Perkapalan & Pertahanan'),
    ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'CV. Digital Nusantara',     'Surabaya', 'Teknologi'),
    ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'PT. Petrokimia Gresik',     'Gresik',   'Kimia & Industri')
ON CONFLICT (id) DO NOTHING;

INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Teknik Komputer Jaringan', 500000, 4, 5, 'Lingkungan kerja sangat mendukung untuk belajar. Mentor saya sangat sabar mengajarkan konfigurasi server dan jaringan. Uang saku cukup untuk transport dan makan siang. Sangat direkomendasikan untuk siswa TKJ!', 'hash_student_001_laingroup', 12),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Rekayasa Perangkat Lunak', 600000, 5, 4, 'Pengalaman magang yang luar biasa! Saya diberi kesempatan untuk ikut mengerjakan proyek nyata menggunakan React dan Node.js. Tim sangat ramah dan selalu siap membantu. Kantor modern dengan fasilitas lengkap.', 'hash_student_002_laingroup', 8),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Administrasi', 400000, 4, 3, 'Tugas utama mengelola dokumen dan data entry. Cukup repetitif tapi belajar banyak soal alur kerja kantoran. Mentor sibuk jadi kadang harus belajar sendiri. Overall lumayan untuk pengalaman pertama.', 'hash_student_003_laingroup', 5),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Teknik Komputer Jaringan', 750000, 5, 4, 'Magang di Telkom Surabaya adalah pengalaman terbaik saya. Fasilitas kantor sangat modern, ada ruang istirahat dan kantin. Belajar banyak tentang fiber optic dan infrastruktur jaringan skala besar.', 'hash_student_004_telkom', 15),
('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'Multimedia', 600000, 4, 4, 'Saya ditempatkan di divisi marketing digital. Belajar desain grafis, editing video, dan social media management. Tim sangat supportive dan sering kasih feedback konstruktif.', 'hash_student_005_telkom', 10),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Teknik Mesin', 350000, 3, 3, 'Belajar banyak tentang mesin CNC dan proses produksi. Tapi lingkungan kerja cukup panas dan bising. Keselamatan kerja sudah oke, disediakan APD lengkap. Uang saku standar.', 'hash_student_006_majujaya', 7),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Teknik Otomotif', 300000, 3, 2, 'Pengalaman kerja di bengkel produksi. Kadang disuruh kerja yang tidak sesuai dengan jurusan. Mentor kurang membimbing, lebih banyak belajar sendiri dari teman sesama magang.', 'hash_student_007_majujaya', 4),
('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'Administrasi', 800000, 5, 5, 'Luar biasa! Uang saku paling besar di antara teman-teman. Kantor sangat nyaman, mentor super friendly. Belajar tentang manajemen pelabuhan dan logistik. Ada program orientasi di awal yang sangat membantu.', 'hash_student_008_pelindo', 20),
('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'Teknik Kimia', 700000, 4, 4, 'Magang di lab quality control. Belajar pengujian material dan standar mutu. Lingkungan kerja bersih dan terorganisir. Mentor berpengalaman dan mengajarkan prosedur dengan detail.', 'hash_student_009_semen', 11),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Teknik Las', 550000, 4, 4, 'Pengalaman unik bisa lihat proses pembuatan kapal dari dekat. Pelatihan safety sangat ketat tapi itu bagus. Mentor sangat terampil dan sabar. Bangga bisa magang di BUMN seperti ini.', 'hash_student_010_pal', 9),
('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'Teknik Mesin', 500000, 3, 4, 'Belajar banyak tentang mesin kapal dan sistem propulsi. Area kerja cukup luas tapi panas. Harus jalan jauh antar workshop. Tim mentor sangat kompeten.', 'hash_student_011_pal', 6),
('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'Rekayasa Perangkat Lunak', 450000, 4, 5, 'Startup kecil tapi belajarnya banyak banget! Karena tim kecil, saya dikasih tanggung jawab besar. Belajar Flutter, Firebase, dan deploy ke Play Store. Mentor CEO-nya langsung yang ngajarin.', 'hash_student_012_digitalnusantara', 14)
ON CONFLICT (company_id, student_hash) DO NOTHING;

INSERT INTO admin_users (id, username, password_hash, role) VALUES
('00000000-0000-0000-0000-000000000001', 'admin', '$2b$10$oN6zEA6tIjT14f2HTnMwwOEVC2s43VSLM0Bl73SFQ8CGVoZO44SOS', 'admin')
ON CONFLICT (username) DO NOTHING;

INSERT INTO company_claims (id, company_id, contact_name, contact_email, contact_position, claim_password_hash, status, verified_at) VALUES
('11111111-1111-1111-1111-111111111111', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Budi Santoso', 'hrd@laingroup.id', 'Head of HR & Talent', '$2b$10$oN6zEA6tIjT14f2HTnMwwOEVC2s43VSLM0Bl73SFQ8CGVoZO44SOS', 'approved', CURRENT_TIMESTAMP)
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO company_replies (review_id, company_id, reply_text)
SELECT r.id, 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Terima kasih banyak atas ulasan dan masukan yang diberikan! PT. Lain Group sangat berkomitmen untuk terus membimbing adik-adik siswa SMK agar siap menghadapi dunia industri profesional teknologi.'
FROM reviews r
WHERE r.company_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
LIMIT 1
ON CONFLICT (review_id) DO NOTHING;

INSERT INTO notifications (recipient_hash, type, title, body, reference_id, is_read) VALUES
('hash_student_001_laingroup', 'reply_received', 'Perusahaan membalas ulasan Anda', 'PT. Lain Group telah memberikan tanggapan resmi atas ulasan yang Anda berikan.', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', FALSE),
('hash_student_001_laingroup', 'vote_received', 'Ulasan Anda dinilai bermanfaat', 'Seseorang baru saja menandai ulasan Anda sebagai bermanfaat (+1).', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', FALSE),
('hash_student_002_laingroup', 'vote_received', 'Ulasan Anda dinilai bermanfaat', '5 orang merasa ulasan Anda sangat membantu keputusan mereka.', 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO company_questions (company_id, question_text, student_hash, answer_text, answered_by, answered_at, is_answered) VALUES
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Apakah untuk siswa jurusan RPL wajib membawa laptop sendiri dari rumah?', 'hash_student_q1', 'Halo! PT. Lain Group menyediakan laptop inventaris kantor untuk seluruh siswa magang RPL. Namun jika ingin membawa laptop pribadi untuk kenyamanan development, diperbolehkan.', 'HRD PT. Lain Group', CURRENT_TIMESTAMP, TRUE),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Apakah ada uang makan harian selain uang saku bulanan?', 'hash_student_q2', 'Selain uang saku bulanan Rp 500.000, perusahaan menyediakan makan siang gratis (catering kantor) setiap hari kerja.', 'HRD PT. Lain Group', CURRENT_TIMESTAMP, TRUE),
('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'Apakah slot magang untuk periode Oktober - Desember masih dibuka?', 'hash_student_q3', NULL, NULL, NULL, FALSE),
('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'Untuk jurusan Teknik Mesin/Perkapalan di PT. PAL, apakah diberikan APD (Alat Pelindung Diri) lengkap?', 'hash_student_q4', 'Ya, seluruh siswa magang di area galangan kapal diwajibkan memakai APD standar (Helm Safety, Sepatu Safety, Vest) yang disediakan secara gratis oleh Tim K3 PT. PAL Indonesia.', 'Tim K3 & HRD PT. PAL', CURRENT_TIMESTAMP, TRUE)
ON CONFLICT DO NOTHING;

INSERT INTO platform_settings (key, value, label, description, setting_type) VALUES
('maintenance_mode', 'false', 'Mode Maintenance', 'Nonaktifkan portal siswa untuk maintenance sistem', 'boolean'),
('allow_student_reviews', 'true', 'Izin Pengiriman Ulasan Siswa', 'Bolehkan siswa SMK mengirim ulasan baru', 'boolean'),
('auto_approve_reviews', 'true', 'Auto-Publish Ulasan', 'Ulasan langsung tayang tanpa moderasi manual', 'boolean'),
('min_review_length', '30', 'Minimum Karakter Ulasan', 'Jumlah minimum karakter teks ulasan siswa', 'number'),
('max_flags_auto_hide', '3', 'Ambang Auto-Hide Laporan', 'Ulasan disembunyikan jika mencapai N laporan pending', 'number'),
('platform_contact_email', 'support@portalmagang.id', 'Email Kontak Dukungan', 'Email dukungan bantuan bagi siswa dan mitra', 'text'),
('max_compare_items', '3', 'Maksimal Item Perbandingan', 'Jumlah maksimal perusahaan yang bisa dibandingkan', 'number'),
('enable_anonymous_qa', 'true', 'Aktifkan Q&A Anonim', 'Izinkan siswa mengajukan pertanyaan anonim ke perusahaan', 'boolean'),
('site_name', 'Portal Magang SMK Surabaya', 'Nama Situs', 'Nama yang tampil di header portal', 'text'),
('max_reviews_per_student', '5', 'Maks Ulasan Per Siswa', 'Jumlah maksimal ulasan yang bisa ditulis satu siswa', 'number')
ON CONFLICT (key) DO NOTHING;
`;

async function ensureSchema(pool: Pool) {
  if (globalForDb.isInitialized) return;

  try {
    const check = await pool.query(
      "SELECT to_regclass('public.platform_settings') as tbl"
    );
    if (!check.rows[0]?.tbl) {
      console.log("[DB] Initializing schema and seed data...");
      await pool.query(SCHEMA_SQL);
      await pool.query(SEED_SQL);
      console.log("[DB] Schema & seed successfully initialized.");
    }
    globalForDb.isInitialized = true;
  } catch (err) {
    console.error("[DB] Error initializing schema:", err);
  }
}

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  const connStr = process.env.DATABASE_URL;
  if (!connStr) {
    throw new Error("DATABASE_URL is not set. Please configure your PostgreSQL connection string.");
  }

  if (!globalForDb.pgPool) {
    globalForDb.pgPool = new Pool({
      connectionString: connStr,
      ssl: { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 10000,
      connectionTimeoutMillis: 10000,
    });
    globalForDb.pgPool.on("error", (err) => {
      console.warn("[DB] Pool background error:", err.message);
    });
  }

  const client = await globalForDb.pgPool.connect();
  try {
    await ensureSchema(globalForDb.pgPool);
    const result = await client.query(text, params);
    return { rows: result.rows as T[], rowCount: result.rowCount };
  } finally {
    client.release();
  }
}

export default { query };
