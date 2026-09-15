import { Pool } from "pg";
import fs from "fs";
import path from "path";

/**
 * PostgreSQL Database Provider
 *
 * 1. Standard PostgreSQL connection pool (when live PostgreSQL is running).
 * 2. Embedded PostgreSQL engine (PGlite) stored on globalThis so it persists
 *    across Next.js hot-reloads without file-locking crashes.
 * 3. Automatically seeds companies (PT. Lain Group, etc.) and reviews on startup.
 */

const globalForDb = globalThis as unknown as {
  pgPool: Pool | undefined;
  pgliteInstance: any | undefined;
  isInitialized: boolean | undefined;
  postgresUnavailable: boolean | undefined;
};

async function getPGLite() {
  if (globalForDb.pgliteInstance) {
    return globalForDb.pgliteInstance;
  }

  const { PGlite } = await import("@electric-sql/pglite");
  globalForDb.pgliteInstance = new PGlite();
  return globalForDb.pgliteInstance;
}

async function ensureSchema(db: any) {
  try {
    const runSql = async (sql: string) => {
      if (typeof db.exec === "function") {
        await db.exec(sql);
      } else {
        await db.query(sql);
      }
    };

    const check = await db.query(
      "SELECT to_regclass('public.platform_settings') as tbl"
    );
    if (!check.rows[0]?.tbl) {
      console.log("[DB] Initializing/updating PostgreSQL schema and seed data...");
      const schemaSql = fs.readFileSync(
        path.join(process.cwd(), "db", "schema.sql"),
        "utf8"
      );
      const seedSql = fs.readFileSync(
        path.join(process.cwd(), "db", "seed.sql"),
        "utf8"
      );

      await runSql(schemaSql);
      await runSql(seedSql);
      console.log("[DB] Schema & seed successfully initialized.");
    }

    // Ensure company_questions table and seeds
    await runSql(`
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
    `);

    const qCount = await db.query("SELECT COUNT(*) as count FROM company_questions");
    if (Number(qCount.rows[0]?.count) === 0) {
      await runSql(`
        INSERT INTO company_questions (company_id, question_text, student_hash, answer_text, answered_by, answered_at, is_answered) VALUES
        (
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'Apakah untuk siswa jurusan RPL wajib membawa laptop sendiri dari rumah?',
            'hash_student_q1',
            'Halo! PT. Lain Group menyediakan laptop inventaris kantor untuk seluruh siswa magang RPL. Namun jika ingin membawa laptop pribadi untuk kenyamanan development, diperbolehkan.',
            'HRD PT. Lain Group',
            CURRENT_TIMESTAMP,
            TRUE
        ),
        (
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'Apakah ada uang makan harian selain uang saku bulanan?',
            'hash_student_q2',
            'Selain uang saku bulanan Rp 500.000, perusahaan menyediakan makan siang gratis (catering kantor) setiap hari kerja.',
            'HRD PT. Lain Group',
            CURRENT_TIMESTAMP,
            TRUE
        ),
        (
            'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
            'Apakah slot magang untuk periode Oktober - Desember masih dibuka?',
            'hash_student_q3',
            NULL,
            NULL,
            NULL,
            FALSE
        ),
        (
            'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
            'Untuk jurusan Teknik Mesin/Perkapalan di PT. PAL, apakah diberikan APD (Alat Pelindung Diri) lengkap?',
            'hash_student_q4',
            'Ya, seluruh siswa magang di area galangan kapal diwajibkan memakai APD standar (Helm Safety, Sepatu Safety, Vest) yang disediakan secara gratis oleh Tim K3 PT. PAL Indonesia.',
            'Tim K3 & HRD PT. PAL',
            CURRENT_TIMESTAMP,
            TRUE
        );
      `);
    }

    // Ensure new admin tables exist
    await runSql(`
      CREATE TABLE IF NOT EXISTS admin_audit_logs (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID, admin_username VARCHAR(50),
        action VARCHAR(50) NOT NULL, target_type VARCHAR(30) NOT NULL,
        target_id UUID, details JSONB DEFAULT '{}',
        ip_address VARCHAR(45), created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS admin_broadcasts (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        admin_id UUID, title VARCHAR(200) NOT NULL, body TEXT,
        priority VARCHAR(20) DEFAULT 'info', is_active BOOLEAN DEFAULT TRUE,
        expires_at TIMESTAMP, created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      );
      CREATE TABLE IF NOT EXISTS platform_settings (
        key VARCHAR(50) PRIMARY KEY, value TEXT NOT NULL,
        label VARCHAR(100), description TEXT,
        setting_type VARCHAR(20) DEFAULT 'text',
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP, updated_by UUID
      );
    `);

    // Ensure complete default platform settings exist (safely insert any missing key)
    await runSql(`
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
    `);

    globalForDb.isInitialized = true;
  } catch (err) {
    console.error("[DB] Error initializing schema:", err);
  }
}

export async function query<T = any>(
  text: string,
  params?: unknown[]
): Promise<{ rows: T[]; rowCount: number | null }> {
  // 1. Try standard PostgreSQL Pool if DATABASE_URL is set and not forced to PGlite
  const connStr = process.env.DATABASE_URL;
  if (connStr && !process.env.FORCE_PGLITE && !globalForDb.postgresUnavailable) {
    if (!globalForDb.pgPool) {
      globalForDb.pgPool = new Pool({
        connectionString: connStr,
        connectionTimeoutMillis: 1500,
      });
      globalForDb.pgPool.on("error", (err) => {
        // Prevent unhandled error event from crashing Node.js
        console.warn("[DB] Pool background error:", err.message);
      });
    }

    try {
      const client = await globalForDb.pgPool.connect();
      try {
        await ensureSchema(client);
        const result = await client.query(text, params);
        return { rows: result.rows as T[], rowCount: result.rowCount };
      } finally {
        client.release();
      }
    } catch {
      // Gracefully switch to embedded PGlite engine and remember unavailable status
      if (globalForDb.pgPool) {
        globalForDb.pgPool.end().catch(() => {});
      }
      globalForDb.pgPool = undefined;
      globalForDb.postgresUnavailable = true;
    }
  }

  // 2. Embedded PostgreSQL engine (PGlite)
  const pglite = await getPGLite();
  await ensureSchema(pglite);
  const result = await pglite.query(text, params);
  return { rows: result.rows as T[], rowCount: result.rows.length };
}

export default { query };
