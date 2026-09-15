-- ============================================================
-- Portal Reputasi & Kompensasi Magang SMK
-- Database Schema (PostgreSQL 17)
-- ============================================================

-- Using built-in PostgreSQL gen_random_uuid() for UUID generation

-- ============================================================
-- Table: companies
-- Stores information about internship host companies
-- ============================================================
CREATE TABLE IF NOT EXISTS companies (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    name        VARCHAR(100)    NOT NULL,
    city        VARCHAR(50)     DEFAULT 'Surabaya',
    industry    VARCHAR(50),
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- Index for city-based filtering (common query pattern)
CREATE INDEX IF NOT EXISTS idx_companies_city ON companies(city);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON companies(industry);

-- ============================================================
-- Table: reviews
-- Anonymous internship reviews submitted by students
-- ============================================================
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

    -- Prevent duplicate reviews: one student can only review a company once
    CONSTRAINT uq_review_per_student UNIQUE (company_id, student_hash)
);

ALTER TABLE reviews ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'published';
ALTER TABLE reviews ADD COLUMN IF NOT EXISTS flagged_count INTEGER DEFAULT 0;

-- Indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_reviews_company ON reviews(company_id);
CREATE INDEX IF NOT EXISTS idx_reviews_created ON reviews(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_reviews_student_hash ON reviews(student_hash);
CREATE INDEX IF NOT EXISTS idx_reviews_status ON reviews(status);

-- ============================================================
-- Table: review_votes
-- Anonymous helpfulness votes on reviews (one vote per voter per review)
-- ============================================================
CREATE TABLE IF NOT EXISTS review_votes (
    id          UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    review_id   UUID            NOT NULL REFERENCES reviews(id) ON DELETE CASCADE,
    voter_hash  VARCHAR(255)    NOT NULL,
    created_at  TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,

    -- Prevent duplicate votes: one person can only vote once per review
    CONSTRAINT uq_vote_per_voter UNIQUE (review_id, voter_hash)
);

CREATE INDEX IF NOT EXISTS idx_review_votes_review ON review_votes(review_id);

-- ============================================================
-- Table: admin_users
-- Platform administrators and moderators
-- ============================================================
CREATE TABLE IF NOT EXISTS admin_users (
    id              UUID            PRIMARY KEY DEFAULT gen_random_uuid(),
    username        VARCHAR(50)     UNIQUE NOT NULL,
    password_hash   VARCHAR(255)    NOT NULL,
    role            VARCHAR(20)     DEFAULT 'moderator',
    created_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================
-- Table: company_claims
-- Companies can claim their page for official responses
-- ============================================================
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

-- ============================================================
-- Table: company_replies
-- Official company responses to reviews (after claim is approved)
-- ============================================================
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

-- ============================================================
-- Table: notifications
-- In-app notifications for students and company representatives
-- ============================================================
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

-- ============================================================
-- Table: review_flags
-- User-reported problematic reviews for admin moderation
-- ============================================================
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

-- ============================================================
-- Table: company_questions
-- Anonymous student Q&A forum for companies
-- ============================================================
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

-- ============================================================
-- Table: admin_audit_logs
-- Records all admin actions for accountability & transparency
-- ============================================================
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

-- ============================================================
-- Table: admin_broadcasts
-- Platform-wide announcements from admin to all portal users
-- ============================================================
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

-- ============================================================
-- Table: platform_settings
-- Key-value configuration store for platform behavior
-- ============================================================
CREATE TABLE IF NOT EXISTS platform_settings (
    key             VARCHAR(50)     PRIMARY KEY,
    value           TEXT            NOT NULL,
    label           VARCHAR(100),
    description     TEXT,
    setting_type    VARCHAR(20)     DEFAULT 'text',
    updated_at      TIMESTAMP       DEFAULT CURRENT_TIMESTAMP,
    updated_by      UUID            REFERENCES admin_users(id) ON DELETE SET NULL
);
