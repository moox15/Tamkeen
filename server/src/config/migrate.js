import db from './database.js';

// ============================================================
// تمكّن — Database Migration
// Creates all tables with proper constraints, indexes, and foreign keys
// ============================================================

console.log('🔧 Running database migrations...');

db.exec(`
  -- ============================================================
  -- USERS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    email TEXT NOT NULL UNIQUE COLLATE NOCASE,
    password_hash TEXT NOT NULL,
    role TEXT NOT NULL CHECK(role IN ('admin', 'student')),
    full_name TEXT NOT NULL,
    phone TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    last_login TEXT,
    failed_login_attempts INTEGER NOT NULL DEFAULT 0,
    locked_until TEXT,
    password_reset_token TEXT,
    password_reset_expires TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
  CREATE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
  CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

  -- ============================================================
  -- STUDENT PROFILES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS student_profiles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL UNIQUE,
    grade TEXT NOT NULL,
    academic_stage TEXT NOT NULL CHECK(academic_stage IN ('primary', 'middle', 'high')),
    enrollment_date TEXT NOT NULL DEFAULT (date('now')),
    notes TEXT,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_student_profiles_user_id ON student_profiles(user_id);

  -- ============================================================
  -- SUBJECTS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    name_en TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ============================================================
  -- TEACHERS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS teachers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    full_name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    specialization TEXT,
    is_active INTEGER NOT NULL DEFAULT 1,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  CREATE INDEX IF NOT EXISTS idx_teachers_uuid ON teachers(uuid);

  -- ============================================================
  -- STUDENT SUBJECTS (Many-to-Many with teacher)
  -- ============================================================
  CREATE TABLE IF NOT EXISTS student_subjects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_profile_id INTEGER NOT NULL,
    subject_id INTEGER NOT NULL,
    teacher_id INTEGER,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    UNIQUE(student_profile_id, subject_id)
  );

  -- ============================================================
  -- PACKAGES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS packages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    lesson_count INTEGER NOT NULL,
    price REAL NOT NULL,
    currency TEXT NOT NULL DEFAULT 'SAR',
    is_active INTEGER NOT NULL DEFAULT 1,
    description TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  );

  -- ============================================================
  -- SUBSCRIPTIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS subscriptions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    student_profile_id INTEGER NOT NULL,
    package_id INTEGER,
    total_lessons INTEGER NOT NULL,
    completed_lessons INTEGER NOT NULL DEFAULT 0,
    start_date TEXT NOT NULL,
    expiry_date TEXT,
    status TEXT NOT NULL DEFAULT 'active' CHECK(status IN ('active', 'expired', 'cancelled', 'completed', 'pending_payment')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (package_id) REFERENCES packages(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_subscriptions_student ON subscriptions(student_profile_id);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_status ON subscriptions(status);
  CREATE INDEX IF NOT EXISTS idx_subscriptions_uuid ON subscriptions(uuid);

  -- ============================================================
  -- PAYMENTS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS payments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    subscription_id INTEGER,
    student_profile_id INTEGER NOT NULL,
    amount_due REAL NOT NULL,
    amount_paid REAL NOT NULL DEFAULT 0,
    payment_date TEXT,
    payment_method TEXT CHECK(payment_method IN ('bank_transfer', 'cash', 'online', 'other')),
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('paid', 'partially_paid', 'pending', 'refunded', 'cancelled')),
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_payments_student ON payments(student_profile_id);
  CREATE INDEX IF NOT EXISTS idx_payments_status ON payments(status);
  CREATE INDEX IF NOT EXISTS idx_payments_uuid ON payments(uuid);

  -- ============================================================
  -- LESSONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS lessons (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    student_profile_id INTEGER NOT NULL,
    subject_id INTEGER,
    teacher_id INTEGER,
    subscription_id INTEGER,
    title TEXT,
    date TEXT NOT NULL,
    start_time TEXT NOT NULL,
    end_time TEXT NOT NULL,
    duration_minutes INTEGER,
    meeting_link TEXT,
    status TEXT NOT NULL DEFAULT 'scheduled' CHECK(status IN ('scheduled', 'completed', 'cancelled', 'rescheduled')),
    attendance TEXT NOT NULL DEFAULT 'pending' CHECK(attendance IN ('present', 'absent', 'excused', 'pending')),
    notes TEXT,
    admin_notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (teacher_id) REFERENCES teachers(id) ON DELETE SET NULL,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_lessons_student ON lessons(student_profile_id);
  CREATE INDEX IF NOT EXISTS idx_lessons_date ON lessons(date);
  CREATE INDEX IF NOT EXISTS idx_lessons_status ON lessons(status);
  CREATE INDEX IF NOT EXISTS idx_lessons_uuid ON lessons(uuid);

  -- ============================================================
  -- LESSON MATERIALS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS lesson_materials (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    lesson_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    file_type TEXT CHECK(file_type IN ('pdf', 'image', 'video', 'link', 'other')),
    file_path TEXT,
    external_url TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  -- ============================================================
  -- HOMEWORK
  -- ============================================================
  CREATE TABLE IF NOT EXISTS homework (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    lesson_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    description TEXT,
    due_date TEXT,
    max_grade REAL NOT NULL DEFAULT 100,
    is_published INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_homework_uuid ON homework(uuid);
  CREATE INDEX IF NOT EXISTS idx_homework_lesson ON homework(lesson_id);

  -- ============================================================
  -- HOMEWORK QUESTIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS homework_questions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    homework_id INTEGER NOT NULL,
    question_text TEXT NOT NULL,
    question_type TEXT NOT NULL CHECK(question_type IN ('multiple_choice', 'true_false', 'short_answer', 'file_upload')),
    options TEXT,
    correct_answer TEXT,
    points REAL NOT NULL DEFAULT 1,
    order_index INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE
  );

  -- ============================================================
  -- HOMEWORK SUBMISSIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS homework_submissions (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    uuid TEXT NOT NULL UNIQUE,
    homework_id INTEGER NOT NULL,
    student_profile_id INTEGER NOT NULL,
    submitted_at TEXT,
    auto_score REAL,
    manual_score REAL,
    total_score REAL,
    feedback TEXT,
    status TEXT NOT NULL DEFAULT 'pending' CHECK(status IN ('pending', 'submitted', 'graded')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (homework_id) REFERENCES homework(id) ON DELETE CASCADE,
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    UNIQUE(homework_id, student_profile_id)
  );

  CREATE INDEX IF NOT EXISTS idx_hw_submissions_uuid ON homework_submissions(uuid);

  -- ============================================================
  -- HOMEWORK ANSWERS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS homework_answers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    submission_id INTEGER NOT NULL,
    question_id INTEGER NOT NULL,
    answer_text TEXT,
    file_path TEXT,
    is_correct INTEGER,
    points_earned REAL DEFAULT 0,
    FOREIGN KEY (submission_id) REFERENCES homework_submissions(id) ON DELETE CASCADE,
    FOREIGN KEY (question_id) REFERENCES homework_questions(id) ON DELETE CASCADE
  );

  -- ============================================================
  -- GRADES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS grades (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_profile_id INTEGER NOT NULL,
    subject_id INTEGER,
    lesson_id INTEGER,
    grade_value REAL,
    max_grade REAL DEFAULT 100,
    notes TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE SET NULL,
    FOREIGN KEY (lesson_id) REFERENCES lessons(id) ON DELETE SET NULL
  );

  -- ============================================================
  -- NOTIFICATIONS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS notifications (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT DEFAULT 'system' CHECK(type IN ('lesson', 'homework', 'payment', 'subscription', 'system')),
    is_read INTEGER NOT NULL DEFAULT 0,
    metadata TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  CREATE INDEX IF NOT EXISTS idx_notifications_user ON notifications(user_id);
  CREATE INDEX IF NOT EXISTS idx_notifications_read ON notifications(user_id, is_read);

  -- ============================================================
  -- ADMIN NOTES
  -- ============================================================
  CREATE TABLE IF NOT EXISTS admin_notes (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    student_profile_id INTEGER NOT NULL,
    admin_user_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (student_profile_id) REFERENCES student_profiles(id) ON DELETE CASCADE,
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE CASCADE
  );

  -- ============================================================
  -- AUDIT LOGS
  -- ============================================================
  CREATE TABLE IF NOT EXISTS audit_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    admin_user_id INTEGER,
    action TEXT NOT NULL,
    target_type TEXT,
    target_id INTEGER,
    metadata TEXT,
    ip_address TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (admin_user_id) REFERENCES users(id) ON DELETE SET NULL
  );

  CREATE INDEX IF NOT EXISTS idx_audit_logs_created ON audit_logs(created_at);
  CREATE INDEX IF NOT EXISTS idx_audit_logs_action ON audit_logs(action);
`);

console.log('✅ All database tables created successfully!');
