-- ============================================================
-- Portal Reputasi & Kompensasi Magang SMK
-- Seed Data for Development & Testing
-- ============================================================

-- ============================================================
-- COMPANIES — Local Surabaya businesses
-- ============================================================
INSERT INTO companies (id, name, city, industry) VALUES
    ('a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d', 'PT. Lain Group',            'Surabaya', 'Teknologi'),
    ('b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e', 'PT. Telkom Indonesia',      'Surabaya', 'Telekomunikasi'),
    ('c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f', 'CV. Maju Jaya Teknik',      'Surabaya', 'Manufaktur'),
    ('d4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a', 'PT. Pelindo III',           'Surabaya', 'Logistik & Maritim'),
    ('e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b', 'PT. Semen Indonesia',       'Surabaya', 'Konstruksi & Material'),
    ('f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c', 'PT. PAL Indonesia',         'Surabaya', 'Perkapalan & Pertahanan'),
    ('a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d', 'CV. Digital Nusantara',     'Surabaya', 'Teknologi'),
    ('b8c9d0e1-f2a3-4b4c-5d6e-7f8a9b0c1d2e', 'PT. Petrokimia Gresik',     'Gresik',   'Kimia & Industri');

-- ============================================================
-- REVIEWS — Sample anonymous reviews
-- student_hash values are pre-computed SHA-256 for testing only
-- ============================================================

-- Reviews for PT. Lain Group (Teknologi)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Teknik Komputer Jaringan',
    500000,
    4, 5,
    'Lingkungan kerja sangat mendukung untuk belajar. Mentor saya sangat sabar mengajarkan konfigurasi server dan jaringan. Uang saku cukup untuk transport dan makan siang. Sangat direkomendasikan untuk siswa TKJ!',
    'hash_student_001_laingroup',
    12
),
(
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Rekayasa Perangkat Lunak',
    600000,
    5, 4,
    'Pengalaman magang yang luar biasa! Saya diberi kesempatan untuk ikut mengerjakan proyek nyata menggunakan React dan Node.js. Tim sangat ramah dan selalu siap membantu. Kantor modern dengan fasilitas lengkap.',
    'hash_student_002_laingroup',
    8
),
(
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Administrasi',
    400000,
    4, 3,
    'Tugas utama mengelola dokumen dan data entry. Cukup repetitif tapi belajar banyak soal alur kerja kantoran. Mentor sibuk jadi kadang harus belajar sendiri. Overall lumayan untuk pengalaman pertama.',
    'hash_student_003_laingroup',
    5
);

-- Reviews for PT. Telkom Indonesia (Telekomunikasi)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'Teknik Komputer Jaringan',
    750000,
    5, 4,
    'Magang di Telkom Surabaya adalah pengalaman terbaik saya. Fasilitas kantor sangat modern, ada ruang istirahat dan kantin. Belajar banyak tentang fiber optic dan infrastruktur jaringan skala besar.',
    'hash_student_004_telkom',
    15
),
(
    'b2c3d4e5-f6a7-4b8c-9d0e-1f2a3b4c5d6e',
    'Multimedia',
    600000,
    4, 4,
    'Saya ditempatkan di divisi marketing digital. Belajar desain grafis, editing video, dan social media management. Tim sangat supportive dan sering kasih feedback konstruktif.',
    'hash_student_005_telkom',
    10
);

-- Reviews for CV. Maju Jaya Teknik (Manufaktur)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'Teknik Mesin',
    350000,
    3, 3,
    'Belajar banyak tentang mesin CNC dan proses produksi. Tapi lingkungan kerja cukup panas dan bising. Keselamatan kerja sudah oke, disediakan APD lengkap. Uang saku standar.',
    'hash_student_006_majujaya',
    7
),
(
    'c3d4e5f6-a7b8-4c9d-0e1f-2a3b4c5d6e7f',
    'Teknik Otomotif',
    300000,
    3, 2,
    'Pengalaman kerja di bengkel produksi. Kadang disuruh kerja yang tidak sesuai dengan jurusan. Mentor kurang membimbing, lebih banyak belajar sendiri dari teman sesama magang.',
    'hash_student_007_majujaya',
    4
);

-- Reviews for PT. Pelindo III (Logistik & Maritim)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'd4e5f6a7-b8c9-4d0e-1f2a-3b4c5d6e7f8a',
    'Administrasi',
    800000,
    5, 5,
    'Luar biasa! Uang saku paling besar di antara teman-teman. Kantor sangat nyaman, mentor super friendly. Belajar tentang manajemen pelabuhan dan logistik. Ada program orientasi di awal yang sangat membantu.',
    'hash_student_008_pelindo',
    20
);

-- Reviews for PT. Semen Indonesia (Konstruksi & Material)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'e5f6a7b8-c9d0-4e1f-2a3b-4c5d6e7f8a9b',
    'Teknik Kimia',
    700000,
    4, 4,
    'Magang di lab quality control. Belajar pengujian material dan standar mutu. Lingkungan kerja bersih dan terorganisir. Mentor berpengalaman dan mengajarkan prosedur dengan detail.',
    'hash_student_009_semen',
    11
);

-- Reviews for PT. PAL Indonesia (Perkapalan & Pertahanan)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'Teknik Las',
    550000,
    4, 4,
    'Pengalaman unik bisa lihat proses pembuatan kapal dari dekat. Pelatihan safety sangat ketat tapi itu bagus. Mentor sangat terampil dan sabar. Bangga bisa magang di BUMN seperti ini.',
    'hash_student_010_pal',
    9
),
(
    'f6a7b8c9-d0e1-4f2a-3b4c-5d6e7f8a9b0c',
    'Teknik Mesin',
    500000,
    3, 4,
    'Belajar banyak tentang mesin kapal dan sistem propulsi. Area kerja cukup luas tapi panas. Harus jalan jauh antar workshop. Tim mentor sangat kompeten.',
    'hash_student_011_pal',
    6
);

-- Reviews for CV. Digital Nusantara (Teknologi)
INSERT INTO reviews (company_id, position, stipend_amount, environment_score, mentorship_score, review_text, student_hash, helpful_count) VALUES
(
    'a7b8c9d0-e1f2-4a3b-4c5d-6e7f8a9b0c1d',
    'Rekayasa Perangkat Lunak',
    450000,
    4, 5,
    'Startup kecil tapi belajarnya banyak banget! Karena tim kecil, saya dikasih tanggung jawab besar. Belajar Flutter, Firebase, dan deploy ke Play Store. Mentor CEO-nya langsung yang ngajarin.',
    'hash_student_012_digitalnusantara',
    14
);

-- ============================================================
-- ADMIN USERS
-- Default admin: admin / admin123 (bcrypt hash)
-- ============================================================
INSERT INTO admin_users (id, username, password_hash, role) VALUES
(
    '00000000-0000-0000-0000-000000000001',
    'admin',
    '$2b$10$oN6zEA6tIjT14f2HTnMwwOEVC2s43VSLM0Bl73SFQ8CGVoZO44SOS',
    'admin'
) ON CONFLICT (username) DO NOTHING;

-- ============================================================
-- COMPANY CLAIMS
-- PT. Lain Group claimed & verified
-- ============================================================
INSERT INTO company_claims (id, company_id, contact_name, contact_email, contact_position, claim_password_hash, status, verified_at) VALUES
(
    '11111111-1111-1111-1111-111111111111',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Budi Santoso',
    'hrd@laingroup.id',
    'Head of HR & Talent',
    '$2b$10$oN6zEA6tIjT14f2HTnMwwOEVC2s43VSLM0Bl73SFQ8CGVoZO44SOS',
    'approved',
    CURRENT_TIMESTAMP
) ON CONFLICT (company_id) DO NOTHING;

-- ============================================================
-- COMPANY REPLIES
-- Official reply to PT. Lain Group review
-- ============================================================
INSERT INTO company_replies (review_id, company_id, reply_text)
SELECT 
    r.id,
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    'Terima kasih banyak atas ulasan dan masukan yang diberikan! PT. Lain Group sangat berkomitmen untuk terus membimbing adik-adik siswa SMK agar siap menghadapi dunia industri profesional teknologi.'
FROM reviews r
WHERE r.company_id = 'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d'
LIMIT 1
ON CONFLICT (review_id) DO NOTHING;

-- ============================================================
-- NOTIFICATIONS
-- Sample notifications for student and users
-- ============================================================
INSERT INTO notifications (recipient_hash, type, title, body, reference_id, is_read) VALUES
(
    'hash_student_001_laingroup',
    'reply_received',
    'Perusahaan membalas ulasan Anda',
    'PT. Lain Group telah memberikan tanggapan resmi atas ulasan yang Anda berikan.',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    FALSE
),
(
    'hash_student_001_laingroup',
    'vote_received',
    'Ulasan Anda dinilai bermanfaat',
    'Seseorang baru saja menandai ulasan Anda sebagai bermanfaat (+1).',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    FALSE
),
(
    'hash_student_002_laingroup',
    'vote_received',
    'Ulasan Anda dinilai bermanfaat',
    '5 orang merasa ulasan Anda sangat membantu keputusan mereka.',
    'a1b2c3d4-e5f6-4a7b-8c9d-0e1f2a3b4c5d',
    TRUE
);

-- ============================================================
-- COMPANY QUESTIONS & ANSWERS
-- Sample Q&A for PT. Lain Group & PT. PAL Indonesia
-- ============================================================
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

