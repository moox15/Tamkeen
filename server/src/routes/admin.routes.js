import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import config from '../config/index.js';
import { requireAdmin } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import {
  createStudentSchema, updateStudentSchema, createTeacherSchema, updateTeacherSchema,
  createLessonSchema, updateLessonSchema, updateLessonStatusSchema, updateAttendanceSchema,
  createHomeworkSchema, gradeSubmissionSchema,
  createSubscriptionSchema, updateSubscriptionSchema,
  createPackageSchema, updatePackageSchema,
  createPaymentSchema, createNoteSchema, createSubjectSchema,
} from '../validators/schemas.js';
import { logAudit, createNotification, sanitizeUser, getStudentProfileId } from '../utils/helpers.js';

const router = Router();

// All admin routes require admin role
router.use(requireAdmin);

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard', (req, res) => {
  const stats = {};
  
  stats.totalStudents = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ?').get('student').cnt;
  stats.activeStudents = db.prepare('SELECT COUNT(*) as cnt FROM users WHERE role = ? AND is_active = 1').get('student').cnt;
  stats.inactiveStudents = stats.totalStudents - stats.activeStudents;
  
  const today = new Date().toISOString().split('T')[0];
  stats.todayLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE date = ?').get(today).cnt;
  stats.upcomingLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE date > ? AND status = ?').get(today, 'scheduled').cnt;
  stats.completedLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE status = ?').get('completed').cnt;
  
  stats.presentCount = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE attendance = ?').get('present').cnt;
  stats.absentCount = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE attendance = ?').get('absent').cnt;
  stats.totalAttendance = stats.presentCount + stats.absentCount;
  stats.attendanceRate = stats.totalAttendance > 0 ? Math.round((stats.presentCount / stats.totalAttendance) * 100) : 0;
  
  stats.activeSubscriptions = db.prepare('SELECT COUNT(*) as cnt FROM subscriptions WHERE status = ?').get('active').cnt;
  stats.expiringSubscriptions = db.prepare(`
    SELECT COUNT(*) as cnt FROM subscriptions 
    WHERE status = 'active' AND (
      (total_lessons - completed_lessons) <= 2
      OR (expiry_date IS NOT NULL AND expiry_date <= date('now', '+7 days'))
    )
  `).get().cnt;
  
  stats.totalPayments = db.prepare('SELECT COALESCE(SUM(amount_paid), 0) as total FROM payments').get().total;
  stats.pendingPayments = db.prepare('SELECT COUNT(*) as cnt FROM payments WHERE status = ?').get('pending').cnt;
  stats.partialPayments = db.prepare('SELECT COUNT(*) as cnt FROM payments WHERE status = ?').get('partially_paid').cnt;
  
  stats.totalHomework = db.prepare('SELECT COUNT(*) as cnt FROM homework').get().cnt;
  stats.submittedHomework = db.prepare('SELECT COUNT(*) as cnt FROM homework_submissions WHERE status IN (?, ?)').get('submitted', 'graded').cnt;
  stats.gradedHomework = db.prepare('SELECT COUNT(*) as cnt FROM homework_submissions WHERE status = ?').get('graded').cnt;
  
  // Recent activity
  stats.recentLessons = db.prepare(`
    SELECT l.*, u.full_name as student_name, s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN student_profiles sp ON l.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    ORDER BY l.date DESC, l.start_time DESC LIMIT 10
  `).all();
  
  res.json(stats);
});

// ============================================================
// STUDENTS
// ============================================================
router.get('/students', (req, res) => {
  const { search, status, grade, academic_stage, page = 1, limit = 50 } = req.query;
  
  let query = `
    SELECT u.*, sp.grade, sp.academic_stage, sp.enrollment_date, sp.notes as student_notes, sp.id as profile_id
    FROM users u
    LEFT JOIN student_profiles sp ON u.id = sp.user_id
    WHERE u.role = 'student'
  `;
  const params = [];
  
  if (search) {
    query += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)';
    const s = `%${search}%`;
    params.push(s, s, s);
  }
  if (status === 'active') { query += ' AND u.is_active = 1'; }
  if (status === 'inactive') { query += ' AND u.is_active = 0'; }
  if (grade) { query += ' AND sp.grade = ?'; params.push(grade); }
  if (academic_stage) { query += ' AND sp.academic_stage = ?'; params.push(academic_stage); }
  
  query += ' ORDER BY u.created_at DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const students = db.prepare(query).all(...params).map(sanitizeUser);
  
  // Get count
  let countQuery = `SELECT COUNT(*) as cnt FROM users u LEFT JOIN student_profiles sp ON u.id = sp.user_id WHERE u.role = 'student'`;
  const countParams = [];
  if (search) { countQuery += ' AND (u.full_name LIKE ? OR u.email LIKE ? OR u.phone LIKE ?)'; const s = `%${search}%`; countParams.push(s, s, s); }
  if (status === 'active') countQuery += ' AND u.is_active = 1';
  if (status === 'inactive') countQuery += ' AND u.is_active = 0';
  if (grade) { countQuery += ' AND sp.grade = ?'; countParams.push(grade); }
  if (academic_stage) { countQuery += ' AND sp.academic_stage = ?'; countParams.push(academic_stage); }
  
  const total = db.prepare(countQuery).get(...countParams).cnt;
  
  res.json({ students, total, page: parseInt(page), limit: parseInt(limit) });
});

router.get('/students/:uuid', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  const profile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  if (!profile) return res.status(404).json({ error: 'ملف الطالب غير موجود.' });
  
  const subjects = db.prepare(`
    SELECT ss.*, s.name as subject_name, t.full_name as teacher_name
    FROM student_subjects ss
    LEFT JOIN subjects s ON ss.subject_id = s.id
    LEFT JOIN teachers t ON ss.teacher_id = t.id
    WHERE ss.student_profile_id = ?
  `).all(profile.id);
  
  const subscriptions = db.prepare(`
    SELECT sub.*, p.name as package_name
    FROM subscriptions sub
    LEFT JOIN packages p ON sub.package_id = p.id
    WHERE sub.student_profile_id = ?
    ORDER BY sub.created_at DESC
  `).all(profile.id);
  
  const payments = db.prepare(`
    SELECT pay.*, sub.uuid as subscription_uuid
    FROM payments pay
    LEFT JOIN subscriptions sub ON pay.subscription_id = sub.id
    WHERE pay.student_profile_id = ?
    ORDER BY pay.created_at DESC
  `).all(profile.id);
  
  const lessons = db.prepare(`
    SELECT l.*, s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    WHERE l.student_profile_id = ?
    ORDER BY l.date DESC, l.start_time DESC
  `).all(profile.id);
  
  const homework = db.prepare(`
    SELECT h.*, l.title as lesson_title, hs.status as submission_status, hs.total_score
    FROM homework h
    LEFT JOIN lessons l ON h.lesson_id = l.id
    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_profile_id = ?
    WHERE l.student_profile_id = ?
    ORDER BY h.created_at DESC
  `).all(profile.id, profile.id);
  
  const grades = db.prepare(`
    SELECT g.*, s.name as subject_name
    FROM grades g
    LEFT JOIN subjects s ON g.subject_id = s.id
    WHERE g.student_profile_id = ?
    ORDER BY g.created_at DESC
  `).all(profile.id);
  
  const notes = db.prepare(`
    SELECT n.*, u.full_name as admin_name
    FROM admin_notes n
    LEFT JOIN users u ON n.admin_user_id = u.id
    WHERE n.student_profile_id = ?
    ORDER BY n.created_at DESC
  `).all(profile.id);
  
  // Calculate stats
  const completedLessons = lessons.filter(l => l.status === 'completed').length;
  const presentLessons = lessons.filter(l => l.attendance === 'present').length;
  const attendedLessons = lessons.filter(l => ['present', 'absent'].includes(l.attendance)).length;
  const attendanceRate = attendedLessons > 0 ? Math.round((presentLessons / attendedLessons) * 100) : 0;
  
  const hwTotal = homework.length;
  const hwCompleted = homework.filter(h => h.submission_status === 'graded' || h.submission_status === 'submitted').length;
  const hwRate = hwTotal > 0 ? Math.round((hwCompleted / hwTotal) * 100) : 0;
  
  const avgGrade = grades.length > 0 
    ? Math.round(grades.reduce((sum, g) => sum + (g.grade_value / g.max_grade * 100), 0) / grades.length)
    : 0;
  
  const activeSub = subscriptions.find(s => s.status === 'active');
  
  res.json({
    user: sanitizeUser(user),
    profile,
    subjects,
    subscriptions,
    payments,
    lessons,
    homework,
    grades,
    notes,
    stats: {
      completedLessons,
      attendanceRate,
      hwRate,
      avgGrade,
      activeSub: activeSub ? {
        total_lessons: activeSub.total_lessons,
        completed_lessons: activeSub.completed_lessons,
        remaining_lessons: activeSub.total_lessons - activeSub.completed_lessons,
        status: activeSub.status,
      } : null,
    },
  });
});

router.post('/students', validate(createStudentSchema), (req, res) => {
  const { email, password, full_name, phone, grade, academic_stage, notes, subject_ids } = req.validatedBody;
  
  // Check email uniqueness
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً.' });
  }
  
  const uuid = uuidv4();
  const hash = bcrypt.hashSync(password, config.bcrypt.rounds);
  
  const createStudent = db.transaction(() => {
    const userResult = db.prepare(`
      INSERT INTO users (uuid, email, password_hash, role, full_name, phone)
      VALUES (?, ?, ?, 'student', ?, ?)
    `).run(uuid, email, hash, full_name, phone || '');
    
    db.prepare(`
      INSERT INTO student_profiles (user_id, grade, academic_stage, notes)
      VALUES (?, ?, ?, ?)
    `).run(userResult.lastInsertRowid, grade, academic_stage, notes || '');
    
    const profileId = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(userResult.lastInsertRowid).id;
    
    // Assign subjects
    if (subject_ids && subject_ids.length > 0) {
      const insertSubject = db.prepare('INSERT OR IGNORE INTO student_subjects (student_profile_id, subject_id) VALUES (?, ?)');
      for (const subjectId of subject_ids) {
        insertSubject.run(profileId, subjectId);
      }
    }
    
    return { userId: userResult.lastInsertRowid, uuid, profileId };
  });
  
  const result = createStudent();
  
  logAudit(req.session.userId, 'student_created', 'student', result.userId, { email, full_name }, req.ip);
  
  res.status(201).json({ message: 'تم إنشاء حساب الطالب بنجاح.', uuid: result.uuid });
});

router.put('/students/:uuid', validate(updateStudentSchema), (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  const { full_name, phone, grade, academic_stage, notes: profileNotes, email, subject_ids } = req.validatedBody;
  
  // Check email uniqueness if changed
  if (email && email !== user.email) {
    const existing = db.prepare('SELECT id FROM users WHERE email = ? AND id != ?').get(email, user.id);
    if (existing) return res.status(409).json({ error: 'البريد الإلكتروني مسجل مسبقاً.' });
  }
  
  const updateStudent = db.transaction(() => {
    if (full_name || phone !== undefined || email) {
      const updates = [];
      const params = [];
      if (full_name) { updates.push('full_name = ?'); params.push(full_name); }
      if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
      if (email) { updates.push('email = ?'); params.push(email); }
      updates.push("updated_at = datetime('now')");
      params.push(user.id);
      db.prepare(`UPDATE users SET ${updates.join(', ')} WHERE id = ?`).run(...params);
    }
    
    const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(user.id);
    if (profile && (grade || academic_stage || profileNotes !== undefined)) {
      const updates = [];
      const params = [];
      if (grade) { updates.push('grade = ?'); params.push(grade); }
      if (academic_stage) { updates.push('academic_stage = ?'); params.push(academic_stage); }
      if (profileNotes !== undefined) { updates.push('notes = ?'); params.push(profileNotes); }
      if (updates.length > 0) {
        params.push(profile.id);
        db.prepare(`UPDATE student_profiles SET ${updates.join(', ')} WHERE id = ?`).run(...params);
      }
    }
    
    // Update subjects
    if (subject_ids && profile) {
      db.prepare('DELETE FROM student_subjects WHERE student_profile_id = ?').run(profile.id);
      const insertSubject = db.prepare('INSERT INTO student_subjects (student_profile_id, subject_id) VALUES (?, ?)');
      for (const subjectId of subject_ids) {
        insertSubject.run(profile.id, subjectId);
      }
    }
  });
  
  updateStudent();
  logAudit(req.session.userId, 'student_updated', 'student', user.id, req.validatedBody, req.ip);
  
  res.json({ message: 'تم تحديث بيانات الطالب بنجاح.' });
});

router.put('/students/:uuid/status', (req, res) => {
  const { is_active } = req.body;
  const user = db.prepare('SELECT * FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  db.prepare("UPDATE users SET is_active = ?, updated_at = datetime('now') WHERE id = ?")
    .run(is_active ? 1 : 0, user.id);
  
  logAudit(req.session.userId, is_active ? 'student_activated' : 'student_deactivated', 'student', user.id, null, req.ip);
  
  res.json({ message: is_active ? 'تم تفعيل حساب الطالب.' : 'تم تعطيل حساب الطالب.' });
});

router.put('/students/:uuid/reset-password', (req, res) => {
  const { password } = req.body;
  if (!password || password.length < 8) {
    return res.status(400).json({ error: 'كلمة المرور يجب أن تكون 8 أحرف على الأقل.' });
  }
  
  const user = db.prepare('SELECT * FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  const hash = bcrypt.hashSync(password, config.bcrypt.rounds);
  db.prepare("UPDATE users SET password_hash = ?, updated_at = datetime('now') WHERE id = ?")
    .run(hash, user.id);
  
  logAudit(req.session.userId, 'student_password_reset', 'student', user.id, null, req.ip);
  
  res.json({ message: 'تم إعادة تعيين كلمة مرور الطالب.' });
});

router.delete('/students/:uuid', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });

  const deleteStudentTx = db.transaction(() => {
    const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(user.id);
    if (profile) {
      db.prepare('DELETE FROM homework_submissions WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM grades WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM payments WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM lessons WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM subscriptions WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM student_subjects WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM admin_notes WHERE student_profile_id = ?').run(profile.id);
      db.prepare('DELETE FROM student_profiles WHERE id = ?').run(profile.id);
    }
    db.prepare('DELETE FROM notifications WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);
  });

  deleteStudentTx();
  logAudit(req.session.userId, 'student_deleted', 'student', user.id, { full_name: user.full_name, email: user.email }, req.ip);
  res.json({ message: 'تم حذف حساب الطالب وكافة بياناته بنجاح.' });
});

// ============================================================
// TEACHERS
// ============================================================
router.get('/teachers', (req, res) => {
  const teachers = db.prepare('SELECT * FROM teachers WHERE is_active = 1 ORDER BY full_name').all();
  res.json(teachers);
});

router.post('/teachers', validate(createTeacherSchema), (req, res) => {
  const { full_name, phone, email, specialization, notes } = req.validatedBody;
  const uuid = uuidv4();
  
  db.prepare('INSERT INTO teachers (uuid, full_name, phone, email, specialization, notes) VALUES (?, ?, ?, ?, ?, ?)')
    .run(uuid, full_name, phone || '', email || '', specialization || '', notes || '');
  
  logAudit(req.session.userId, 'teacher_created', 'teacher', null, { full_name }, req.ip);
  res.status(201).json({ message: 'تم إضافة المعلم بنجاح.', uuid });
});

router.put('/teachers/:id', validate(updateTeacherSchema), (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(parseInt(req.params.id));
  if (!teacher) return res.status(404).json({ error: 'المعلم غير موجود.' });
  
  const { full_name, phone, email, specialization, notes } = req.validatedBody;
  const updates = [];
  const params = [];
  if (full_name) { updates.push('full_name = ?'); params.push(full_name); }
  if (phone !== undefined) { updates.push('phone = ?'); params.push(phone); }
  if (email !== undefined) { updates.push('email = ?'); params.push(email); }
  if (specialization !== undefined) { updates.push('specialization = ?'); params.push(specialization); }
  if (notes !== undefined) { updates.push('notes = ?'); params.push(notes); }
  
  if (updates.length > 0) {
    params.push(teacher.id);
    db.prepare(`UPDATE teachers SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  
  logAudit(req.session.userId, 'teacher_updated', 'teacher', teacher.id, req.validatedBody, req.ip);
  res.json({ message: 'تم تحديث بيانات المعلم.' });
});

router.delete('/teachers/:id', (req, res) => {
  const teacher = db.prepare('SELECT * FROM teachers WHERE id = ?').get(parseInt(req.params.id));
  if (!teacher) return res.status(404).json({ error: 'المعلم غير موجود.' });
  
  db.prepare('UPDATE teachers SET is_active = 0 WHERE id = ?').run(teacher.id);
  logAudit(req.session.userId, 'teacher_deactivated', 'teacher', teacher.id, null, req.ip);
  res.json({ message: 'تم تعطيل المعلم.' });
});

// ============================================================
// SUBJECTS
// ============================================================
router.get('/subjects', (req, res) => {
  const subjects = db.prepare('SELECT * FROM subjects ORDER BY name').all();
  res.json(subjects);
});

router.post('/subjects', validate(createSubjectSchema), (req, res) => {
  const { name, name_en } = req.validatedBody;
  db.prepare('INSERT INTO subjects (name, name_en) VALUES (?, ?)').run(name, name_en || '');
  res.status(201).json({ message: 'تم إضافة المادة بنجاح.' });
});

router.put('/subjects/:id', validate(createSubjectSchema), (req, res) => {
  const { name, name_en } = req.validatedBody;
  db.prepare('UPDATE subjects SET name = ?, name_en = ? WHERE id = ?').run(name, name_en || '', parseInt(req.params.id));
  res.json({ message: 'تم تحديث المادة.' });
});

router.delete('/subjects/:id', (req, res) => {
  const subjectId = parseInt(req.params.id);
  const subject = db.prepare('SELECT * FROM subjects WHERE id = ?').get(subjectId);
  if (!subject) return res.status(404).json({ error: 'المادة غير موجودة.' });
  
  db.prepare('DELETE FROM student_subjects WHERE subject_id = ?').run(subjectId);
  db.prepare('DELETE FROM subjects WHERE id = ?').run(subjectId);
  logAudit(req.session.userId, 'subject_deleted', 'subject', subjectId, { name: subject.name }, req.ip);
  res.json({ message: 'تم حذف المادة بنجاح.' });
});

// ============================================================
// LESSONS
// ============================================================
router.get('/lessons', (req, res) => {
  const { date, status, student_id, page = 1, limit = 50 } = req.query;
  
  let query = `
    SELECT l.*, u.full_name as student_name, u.uuid as student_uuid, 
           s.name as subject_name, t.full_name as teacher_name,
           h.id as homework_id, h.title as homework_title
    FROM lessons l
    LEFT JOIN student_profiles sp ON l.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    LEFT JOIN homework h ON h.lesson_id = l.id
    WHERE 1=1
  `;
  const params = [];
  
  if (date) { query += ' AND l.date = ?'; params.push(date); }
  if (status) { query += ' AND l.status = ?'; params.push(status); }
  if (student_id) { query += ' AND l.student_profile_id = ?'; params.push(parseInt(student_id)); }
  
  query += ' ORDER BY l.date DESC, l.start_time DESC LIMIT ? OFFSET ?';
  params.push(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  const lessons = db.prepare(query).all(...params);
  res.json(lessons);
});

router.get('/lessons/:uuid', (req, res) => {
  const lesson = db.prepare(`
    SELECT l.*, u.full_name as student_name, u.uuid as student_uuid,
           s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN student_profiles sp ON l.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    WHERE l.uuid = ?
  `).get(req.params.uuid);
  
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  const materials = db.prepare('SELECT * FROM lesson_materials WHERE lesson_id = ?').all(lesson.id);
  const homework = db.prepare('SELECT * FROM homework WHERE lesson_id = ?').get(lesson.id);
  
  let questions = [];
  if (homework) {
    questions = db.prepare('SELECT * FROM homework_questions WHERE homework_id = ? ORDER BY order_index').all(homework.id);
  }
  
  res.json({ lesson, materials, homework, questions });
});

router.post('/lessons', validate(createLessonSchema), (req, res) => {
  const data = req.validatedBody;
  const uuid = uuidv4();
  
  // Calculate duration
  const [startH, startM] = data.start_time.split(':').map(Number);
  const [endH, endM] = data.end_time.split(':').map(Number);
  const duration = (endH * 60 + endM) - (startH * 60 + startM);
  
  // Check for scheduling conflicts
  const conflict = db.prepare(`
    SELECT id FROM lessons 
    WHERE student_profile_id = ? AND date = ? AND status IN ('scheduled', 'rescheduled')
    AND ((start_time <= ? AND end_time > ?) OR (start_time < ? AND end_time >= ?))
  `).get(data.student_profile_id, data.date, data.start_time, data.start_time, data.end_time, data.end_time);
  
  if (conflict) {
    return res.status(409).json({ error: 'يوجد تعارض في الجدول. الطالب لديه حصة أخرى في نفس الوقت.' });
  }
  
  // Auto-link active subscription if not explicitly provided
  let subId = data.subscription_id || null;
  if (!subId) {
    const activeSub = db.prepare("SELECT id FROM subscriptions WHERE student_profile_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(data.student_profile_id);
    if (activeSub) subId = activeSub.id;
  }

  db.prepare(`
    INSERT INTO lessons (uuid, student_profile_id, subject_id, teacher_id, subscription_id, title, date, start_time, end_time, duration_minutes, meeting_link, notes, admin_notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuid, data.student_profile_id, data.subject_id, data.teacher_id || null, subId,
    data.title || '', data.date, data.start_time, data.end_time, duration, data.meeting_link || '', data.notes || '', data.admin_notes || '');
  
  // Notify student
  const profile = db.prepare('SELECT user_id FROM student_profiles WHERE id = ?').get(data.student_profile_id);
  if (profile) {
    createNotification(profile.user_id, 'حصة جديدة', `تم جدولة حصة جديدة بتاريخ ${data.date}`, 'lesson');
  }
  
  logAudit(req.session.userId, 'lesson_created', 'lesson', null, { student_profile_id: data.student_profile_id, date: data.date }, req.ip);
  
  res.status(201).json({ message: 'تم إنشاء الحصة بنجاح.', uuid });
});

router.put('/lessons/:uuid', validate(updateLessonSchema), (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE uuid = ?').get(req.params.uuid);
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  const data = req.validatedBody;
  const updates = [];
  const params = [];
  
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) {
      updates.push(`${key} = ?`);
      params.push(val);
    }
  }
  
  if (data.start_time && data.end_time) {
    const [startH, startM] = data.start_time.split(':').map(Number);
    const [endH, endM] = data.end_time.split(':').map(Number);
    updates.push('duration_minutes = ?');
    params.push((endH * 60 + endM) - (startH * 60 + startM));
  }
  
  updates.push("updated_at = datetime('now')");
  params.push(lesson.id);
  
  db.prepare(`UPDATE lessons SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  logAudit(req.session.userId, 'lesson_updated', 'lesson', lesson.id, data, req.ip);
  
  res.json({ message: 'تم تحديث الحصة بنجاح.' });
});

router.put('/lessons/:uuid/status', validate(updateLessonStatusSchema), (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE uuid = ?').get(req.params.uuid);
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  const { status } = req.validatedBody;
  const prevStatus = lesson.status;
  
  const updateStatus = db.transaction(() => {
    db.prepare("UPDATE lessons SET status = ?, updated_at = datetime('now') WHERE id = ?")
      .run(status, lesson.id);
    
    // Handle lesson balance
    let subId = lesson.subscription_id;
    if (!subId) {
      const activeSub = db.prepare("SELECT id FROM subscriptions WHERE student_profile_id = ? AND status = 'active' ORDER BY created_at DESC LIMIT 1").get(lesson.student_profile_id);
      if (activeSub) {
        subId = activeSub.id;
        db.prepare('UPDATE lessons SET subscription_id = ? WHERE id = ?').run(subId, lesson.id);
      }
    }

    if (status === 'completed' && prevStatus !== 'completed' && subId) {
      // Deduct one lesson
      db.prepare(`
        UPDATE subscriptions SET completed_lessons = completed_lessons + 1, updated_at = datetime('now')
        WHERE id = ?
      `).run(subId);
      
      // Mark attendance as present if still pending
      if (lesson.attendance === 'pending') {
        db.prepare("UPDATE lessons SET attendance = 'present' WHERE id = ?").run(lesson.id);
      }
      
      // Check if subscription is completed
      const sub = db.prepare('SELECT * FROM subscriptions WHERE id = ?').get(lesson.subscription_id);
      if (sub && sub.completed_lessons >= sub.total_lessons) {
        db.prepare("UPDATE subscriptions SET status = 'completed', updated_at = datetime('now') WHERE id = ?")
          .run(lesson.subscription_id);
      }
      
      // Low balance notification
      if (sub && (sub.total_lessons - sub.completed_lessons - 1) <= 2) {
        const profile = db.prepare('SELECT user_id FROM student_profiles WHERE id = ?').get(lesson.student_profile_id);
        if (profile) {
          createNotification(profile.user_id, 'رصيد الحصص منخفض', `متبقي ${sub.total_lessons - sub.completed_lessons - 1} حصص فقط.`, 'subscription');
        }
        // Notify admins
        const admins = db.prepare("SELECT id FROM users WHERE role = 'admin'").all();
        for (const admin of admins) {
          createNotification(admin.id, 'رصيد حصص منخفض', `الطالب لديه رصيد منخفض من الحصص.`, 'subscription');
        }
      }
    }
    
    // If reverting from completed, restore balance
    if (prevStatus === 'completed' && status !== 'completed' && lesson.subscription_id) {
      db.prepare(`
        UPDATE subscriptions SET completed_lessons = MAX(0, completed_lessons - 1), updated_at = datetime('now')
        WHERE id = ?
      `).run(lesson.subscription_id);
    }
  });
  
  updateStatus();
  logAudit(req.session.userId, 'lesson_status_changed', 'lesson', lesson.id, { from: prevStatus, to: status }, req.ip);
  
  const statusMessages = {
    completed: 'تم تسجيل الحصة كمكتملة.',
    cancelled: 'تم إلغاء الحصة.',
    rescheduled: 'تم تأجيل الحصة.',
    scheduled: 'تم إعادة جدولة الحصة.',
  };
  
  res.json({ message: statusMessages[status] || 'تم تحديث حالة الحصة.' });
});

router.put('/lessons/:uuid/attendance', validate(updateAttendanceSchema), (req, res) => {
  const lesson = db.prepare('SELECT * FROM lessons WHERE uuid = ?').get(req.params.uuid);
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  db.prepare("UPDATE lessons SET attendance = ?, updated_at = datetime('now') WHERE id = ?")
    .run(req.validatedBody.attendance, lesson.id);
  
  logAudit(req.session.userId, 'attendance_changed', 'lesson', lesson.id, { attendance: req.validatedBody.attendance }, req.ip);
  
  res.json({ message: 'تم تسجيل الحضور بنجاح.' });
});

// ============================================================
// HOMEWORK
// ============================================================
router.post('/homework', validate(createHomeworkSchema), (req, res) => {
  const { lesson_id, title, description, due_date, max_grade, questions } = req.validatedBody;
  
  const lesson = db.prepare('SELECT id FROM lessons WHERE id = ?').get(lesson_id);
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  const uuid = uuidv4();
  
  const createHw = db.transaction(() => {
    const result = db.prepare(`
      INSERT INTO homework (uuid, lesson_id, title, description, due_date, max_grade)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(uuid, lesson_id, title, description || '', due_date || null, max_grade);
    
    const hwId = result.lastInsertRowid;
    const insertQ = db.prepare(`
      INSERT INTO homework_questions (homework_id, question_text, question_type, options, correct_answer, points, order_index)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    for (let i = 0; i < questions.length; i++) {
      const q = questions[i];
      insertQ.run(hwId, q.question_text, q.question_type, q.options || null, q.correct_answer || null, q.points || 1, q.order_index || i);
    }
    
    return hwId;
  });
  
  createHw();
  
  // Notify student
  const lessonData = db.prepare('SELECT student_profile_id FROM lessons WHERE id = ?').get(lesson_id);
  if (lessonData) {
    const profile = db.prepare('SELECT user_id FROM student_profiles WHERE id = ?').get(lessonData.student_profile_id);
    if (profile) {
      createNotification(profile.user_id, 'واجب جديد', `تم إضافة واجب: ${title}`, 'homework');
    }
  }
  
  logAudit(req.session.userId, 'homework_created', 'homework', null, { title, lesson_id }, req.ip);
  res.status(201).json({ message: 'تم إنشاء الواجب بنجاح.', uuid });
});

router.put('/homework/:uuid', (req, res) => {
  const hw = db.prepare('SELECT * FROM homework WHERE uuid = ?').get(req.params.uuid);
  if (!hw) return res.status(404).json({ error: 'الواجب غير موجود.' });
  
  const { title, description, due_date, max_grade, is_published } = req.body;
  const updates = [];
  const params = [];
  if (title) { updates.push('title = ?'); params.push(title); }
  if (description !== undefined) { updates.push('description = ?'); params.push(description); }
  if (due_date !== undefined) { updates.push('due_date = ?'); params.push(due_date); }
  if (max_grade !== undefined) { updates.push('max_grade = ?'); params.push(max_grade); }
  if (is_published !== undefined) { updates.push('is_published = ?'); params.push(is_published ? 1 : 0); }
  
  if (updates.length > 0) {
    params.push(hw.id);
    db.prepare(`UPDATE homework SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  
  res.json({ message: 'تم تحديث الواجب.' });
});

router.get('/homework', (req, res) => {
  const { student_id, subject_id, status } = req.query;
  let query = `
    SELECT h.*, l.date as lesson_date, l.title as lesson_title,
           s.name as subject_name, s.id as subject_id,
           u.full_name as student_name, u.uuid as student_uuid,
           sp.id as student_profile_id,
           hs.id as submission_id, hs.status as submission_status,
           hs.total_score, hs.manual_score, hs.auto_score, hs.feedback,
           hs.submitted_at
    FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN student_profiles sp ON l.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN homework_submissions hs ON hs.homework_id = h.id AND hs.student_profile_id = sp.id
    WHERE 1=1
  `;
  const params = [];
  if (student_id) { query += ' AND sp.id = ?'; params.push(parseInt(student_id)); }
  if (subject_id) { query += ' AND s.id = ?'; params.push(parseInt(subject_id)); }
  if (status) {
    if (status === 'pending') query += " AND (hs.status IS NULL OR hs.status = 'pending')";
    else { query += ' AND hs.status = ?'; params.push(status); }
  }
  query += ' ORDER BY h.created_at DESC';
  const list = db.prepare(query).all(...params);
  
  for (const item of list) {
    item.questions_count = db.prepare('SELECT COUNT(*) as cnt FROM homework_questions WHERE homework_id = ?').get(item.id).cnt;
  }
  res.json(list);
});

router.get('/homework/submissions/all', (req, res) => {
  const submissions = db.prepare(`
    SELECT hs.*, h.uuid as homework_uuid, h.title as homework_title, h.max_grade, h.due_date,
           u.full_name as student_name, u.uuid as student_uuid,
           s.name as subject_name, l.date as lesson_date
    FROM homework_submissions hs
    JOIN homework h ON hs.homework_id = h.id
    JOIN lessons l ON h.lesson_id = l.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN student_profiles sp ON hs.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    ORDER BY hs.submitted_at DESC
  `).all();
  
  for (const sub of submissions) {
    sub.answers = db.prepare(`
      SELECT ha.*, hq.question_text, hq.question_type, hq.correct_answer, hq.points, hq.options
      FROM homework_answers ha
      LEFT JOIN homework_questions hq ON ha.question_id = hq.id
      WHERE ha.submission_id = ?
    `).all(sub.id);
  }
  res.json(submissions);
});

router.delete('/homework/:uuid', (req, res) => {
  const hw = db.prepare('SELECT * FROM homework WHERE uuid = ?').get(req.params.uuid);
  if (!hw) return res.status(404).json({ error: 'الواجب غير موجود.' });
  
  db.prepare('DELETE FROM homework WHERE id = ?').run(hw.id);
  logAudit(req.session.userId, 'homework_deleted', 'homework', hw.id, { title: hw.title }, req.ip);
  res.json({ message: 'تم حذف الواجب بنجاح.' });
});

router.put('/homework/submissions/:id/grade', validate(gradeSubmissionSchema), (req, res) => {
  const sub = db.prepare('SELECT * FROM homework_submissions WHERE id = ?').get(parseInt(req.params.id));
  if (!sub) return res.status(404).json({ error: 'التسليم غير موجود.' });
  
  const hw = db.prepare('SELECT * FROM homework WHERE id = ?').get(sub.homework_id);
  const lesson = hw ? db.prepare('SELECT * FROM lessons WHERE id = ?').get(hw.lesson_id) : null;
  
  const { manual_score, total_score, feedback, question_grades } = req.validatedBody;
  
  const updateGradeTx = db.transaction(() => {
    if (question_grades && question_grades.length > 0) {
      const updateAns = db.prepare(`
        UPDATE homework_answers
        SET points_earned = ?, is_correct = ?
        WHERE submission_id = ? AND question_id = ?
      `);
      for (const qg of question_grades) {
        updateAns.run(qg.points_earned, qg.is_correct !== undefined ? qg.is_correct : (qg.points_earned > 0 ? 1 : 0), sub.id, qg.question_id);
      }
    }
    
    let finalScore = 0;
    if (total_score !== undefined) {
      finalScore = total_score;
    } else if (question_grades && question_grades.length > 0) {
      finalScore = question_grades.reduce((sum, q) => sum + (q.points_earned || 0), 0);
    } else {
      finalScore = (sub.auto_score || 0) + (manual_score || 0);
    }
    
    db.prepare(`
      UPDATE homework_submissions 
      SET manual_score = ?, feedback = ?, total_score = ?, status = 'graded'
      WHERE id = ?
    `).run(manual_score !== undefined ? manual_score : finalScore, feedback || '', finalScore, sub.id);
    
    if (lesson) {
      const existingGrade = db.prepare('SELECT id FROM grades WHERE student_profile_id = ? AND lesson_id = ?').get(sub.student_profile_id, lesson.id);
      if (existingGrade) {
        db.prepare('UPDATE grades SET grade_value = ?, max_grade = ?, notes = ? WHERE id = ?')
          .run(finalScore, hw ? hw.max_grade : 100, `تقييم واجب: ${hw ? hw.title : ''}`, existingGrade.id);
      } else {
        db.prepare('INSERT INTO grades (student_profile_id, subject_id, lesson_id, grade_value, max_grade, notes) VALUES (?, ?, ?, ?, ?, ?)')
          .run(sub.student_profile_id, lesson.subject_id, lesson.id, finalScore, hw ? hw.max_grade : 100, `تقييم واجب: ${hw ? hw.title : ''}`);
      }
    }
    
    return finalScore;
  });
  
  const finalScore = updateGradeTx();
  
  const profile = db.prepare('SELECT user_id FROM student_profiles WHERE id = ?').get(sub.student_profile_id);
  if (profile) {
    createNotification(
      profile.user_id,
      'تم تصحيح الواجب 📝',
      `تم تصحيح واجبك (${hw ? hw.title : ''}) بنجاح. الدرجة: ${finalScore} من ${hw ? hw.max_grade : 100}`,
      'homework'
    );
  }
  
  logAudit(req.session.userId, 'homework_graded', 'homework_submission', sub.id, { total_score: finalScore, feedback }, req.ip);
  
  res.json({ message: 'تم حفظ وتصحيح الواجب بنجاح وإرسال النتيجة للطالب.', total_score: finalScore });
});

// ============================================================
// PACKAGES
// ============================================================
router.get('/packages', (req, res) => {
  const packages = db.prepare('SELECT * FROM packages ORDER BY lesson_count').all();
  res.json(packages);
});

router.post('/packages', validate(createPackageSchema), (req, res) => {
  const { name, lesson_count, price, currency, description } = req.validatedBody;
  db.prepare('INSERT INTO packages (name, lesson_count, price, currency, description) VALUES (?, ?, ?, ?, ?)')
    .run(name, lesson_count, price, currency || 'SAR', description || '');
  res.status(201).json({ message: 'تم إنشاء الباقة بنجاح.' });
});

router.put('/packages/:id', validate(updatePackageSchema), (req, res) => {
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(parseInt(req.params.id));
  if (!pkg) return res.status(404).json({ error: 'الباقة غير موجودة.' });
  
  const data = req.validatedBody;
  const updates = [];
  const params = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined) { updates.push(`${key} = ?`); params.push(val); }
  }
  if (updates.length > 0) {
    params.push(pkg.id);
    db.prepare(`UPDATE packages SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  }
  res.json({ message: 'تم تحديث الباقة.' });
});

router.delete('/packages/:id', (req, res) => {
  const packageId = parseInt(req.params.id);
  const pkg = db.prepare('SELECT * FROM packages WHERE id = ?').get(packageId);
  if (!pkg) return res.status(404).json({ error: 'الباقة غير موجودة.' });
  
  db.prepare('DELETE FROM packages WHERE id = ?').run(packageId);
  logAudit(req.session.userId, 'package_deleted', 'package', packageId, { name: pkg.name }, req.ip);
  res.json({ message: 'تم حذف الباقة بنجاح.' });
});

// ============================================================
// SUBSCRIPTIONS
// ============================================================
router.get('/subscriptions', (req, res) => {
  const { status, student_id } = req.query;
  let query = `
    SELECT sub.*, u.full_name as student_name, u.uuid as student_uuid, p.name as package_name
    FROM subscriptions sub
    LEFT JOIN student_profiles sp ON sub.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN packages p ON sub.package_id = p.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND sub.status = ?'; params.push(status); }
  if (student_id) { query += ' AND sub.student_profile_id = ?'; params.push(parseInt(student_id)); }
  query += ' ORDER BY sub.created_at DESC';
  
  const subscriptions = db.prepare(query).all(...params);
  res.json(subscriptions);
});

router.post('/subscriptions', validate(createSubscriptionSchema), (req, res) => {
  const data = req.validatedBody;
  const uuid = uuidv4();
  
  db.prepare(`
    INSERT INTO subscriptions (uuid, student_profile_id, package_id, total_lessons, start_date, expiry_date, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuid, data.student_profile_id, data.package_id || null, data.total_lessons, data.start_date, data.expiry_date || null, data.status || 'active', data.notes || '');
  
  logAudit(req.session.userId, 'subscription_created', 'subscription', null, data, req.ip);
  
  // Notify student
  const profile = db.prepare('SELECT user_id FROM student_profiles WHERE id = ?').get(data.student_profile_id);
  if (profile) {
    createNotification(profile.user_id, 'اشتراك جديد', `تم تفعيل اشتراك جديد بعدد ${data.total_lessons} حصة.`, 'subscription');
  }
  
  res.status(201).json({ message: 'تم إنشاء الاشتراك بنجاح.', uuid });
});

router.put('/subscriptions/:uuid', validate(updateSubscriptionSchema), (req, res) => {
  const sub = db.prepare('SELECT * FROM subscriptions WHERE uuid = ?').get(req.params.uuid);
  if (!sub) return res.status(404).json({ error: 'الاشتراك غير موجود.' });
  
  const data = req.validatedBody;
  const updates = [];
  const params = [];
  for (const [key, val] of Object.entries(data)) {
    if (val !== undefined && key !== 'student_profile_id') { updates.push(`${key} = ?`); params.push(val); }
  }
  updates.push("updated_at = datetime('now')");
  params.push(sub.id);
  
  db.prepare(`UPDATE subscriptions SET ${updates.join(', ')} WHERE id = ?`).run(...params);
  logAudit(req.session.userId, 'subscription_updated', 'subscription', sub.id, data, req.ip);
  
  res.json({ message: 'تم تحديث الاشتراك.' });
});

// ============================================================
// PAYMENTS
// ============================================================
router.get('/payments', (req, res) => {
  const { status, student_id } = req.query;
  let query = `
    SELECT p.*, u.full_name as student_name, u.uuid as student_uuid, sub.uuid as subscription_uuid
    FROM payments p
    LEFT JOIN student_profiles sp ON p.student_profile_id = sp.id
    LEFT JOIN users u ON sp.user_id = u.id
    LEFT JOIN subscriptions sub ON p.subscription_id = sub.id
    WHERE 1=1
  `;
  const params = [];
  if (status) { query += ' AND p.status = ?'; params.push(status); }
  if (student_id) { query += ' AND p.student_profile_id = ?'; params.push(parseInt(student_id)); }
  query += ' ORDER BY p.created_at DESC';
  
  const payments = db.prepare(query).all(...params);
  res.json(payments);
});

router.post('/payments', validate(createPaymentSchema), (req, res) => {
  const data = req.validatedBody;
  const uuid = uuidv4();
  
  // Auto-determine status based on amounts
  let status = data.status;
  if (data.amount_paid >= data.amount_due) status = 'paid';
  else if (data.amount_paid > 0) status = 'partially_paid';
  else status = 'pending';
  
  db.prepare(`
    INSERT INTO payments (uuid, subscription_id, student_profile_id, amount_due, amount_paid, payment_date, payment_method, status, notes)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(uuid, data.subscription_id || null, data.student_profile_id, data.amount_due, data.amount_paid, data.payment_date || null, data.payment_method || null, status, data.notes || '');
  
  logAudit(req.session.userId, 'payment_recorded', 'payment', null, { ...data, status }, req.ip);
  
  res.status(201).json({ message: 'تم تسجيل الدفعة بنجاح.', uuid });
});

// ============================================================
// NOTES
// ============================================================
router.get('/students/:uuid/notes', (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(user.id);
  if (!profile) return res.status(404).json({ error: 'ملف الطالب غير موجود.' });
  
  const notes = db.prepare(`
    SELECT n.*, u.full_name as admin_name 
    FROM admin_notes n LEFT JOIN users u ON n.admin_user_id = u.id 
    WHERE n.student_profile_id = ? ORDER BY n.created_at DESC
  `).all(profile.id);
  
  res.json(notes);
});

router.post('/students/:uuid/notes', validate(createNoteSchema), (req, res) => {
  const user = db.prepare('SELECT id FROM users WHERE uuid = ? AND role = ?').get(req.params.uuid, 'student');
  if (!user) return res.status(404).json({ error: 'الطالب غير موجود.' });
  
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(user.id);
  if (!profile) return res.status(404).json({ error: 'ملف الطالب غير موجود.' });
  
  db.prepare('INSERT INTO admin_notes (student_profile_id, admin_user_id, content) VALUES (?, ?, ?)')
    .run(profile.id, req.session.userId, req.validatedBody.content);
  
  res.status(201).json({ message: 'تم إضافة الملاحظة.' });
});

// ============================================================
// AUDIT LOGS
// ============================================================
router.get('/audit-logs', (req, res) => {
  const { page = 1, limit = 50 } = req.query;
  const logs = db.prepare(`
    SELECT al.*, u.full_name as admin_name
    FROM audit_logs al
    LEFT JOIN users u ON al.admin_user_id = u.id
    ORDER BY al.created_at DESC
    LIMIT ? OFFSET ?
  `).all(parseInt(limit), (parseInt(page) - 1) * parseInt(limit));
  
  res.json(logs);
});

// ============================================================
// NOTIFICATIONS
// ============================================================
router.get('/notifications', (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 50
  `).all(req.session.userId);
  res.json(notifications);
});

router.put('/notifications/:id/read', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(parseInt(req.params.id), req.session.userId);
  res.json({ message: 'تم.' });
});

export default router;
