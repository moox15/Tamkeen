import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import { requireStudent } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { submitHomeworkSchema } from '../validators/schemas.js';
import { getStudentProfileId, sanitizeUser } from '../utils/helpers.js';

const router = Router();

// All student routes require student role
router.use(requireStudent);

// Middleware to attach student profile
router.use((req, res, next) => {
  const profileId = getStudentProfileId(req.session.userId);
  if (!profileId) {
    return res.status(403).json({ error: 'ملف الطالب غير موجود.' });
  }
  req.studentProfileId = profileId;
  next();
});

// ============================================================
// DASHBOARD
// ============================================================
router.get('/dashboard', (req, res) => {
  const profile = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(req.studentProfileId);
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  
  // Active subscription
  const activeSub = db.prepare(`
    SELECT sub.*, p.name as package_name
    FROM subscriptions sub
    LEFT JOIN packages p ON sub.package_id = p.id
    WHERE sub.student_profile_id = ? AND sub.status = 'active'
    ORDER BY sub.created_at DESC LIMIT 1
  `).get(req.studentProfileId);
  
  // Lessons stats
  const totalLessons = db.prepare('SELECT COUNT(*) as cnt FROM lessons WHERE student_profile_id = ?').get(req.studentProfileId).cnt;
  const completedLessons = db.prepare("SELECT COUNT(*) as cnt FROM lessons WHERE student_profile_id = ? AND status = 'completed'").get(req.studentProfileId).cnt;
  
  // Attendance
  const presentCount = db.prepare("SELECT COUNT(*) as cnt FROM lessons WHERE student_profile_id = ? AND attendance = 'present'").get(req.studentProfileId).cnt;
  const attendedCount = db.prepare("SELECT COUNT(*) as cnt FROM lessons WHERE student_profile_id = ? AND attendance IN ('present','absent')").get(req.studentProfileId).cnt;
  const attendanceRate = attendedCount > 0 ? Math.round((presentCount / attendedCount) * 100) : 0;
  
  // Homework stats
  const totalHomework = db.prepare(`
    SELECT COUNT(*) as cnt FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    WHERE l.student_profile_id = ? AND h.is_published = 1
  `).get(req.studentProfileId).cnt;
  
  const completedHomework = db.prepare(`
    SELECT COUNT(*) as cnt FROM homework_submissions hs
    WHERE hs.student_profile_id = ? AND hs.status IN ('submitted', 'graded')
  `).get(req.studentProfileId).cnt;
  
  const hwRate = totalHomework > 0 ? Math.round((completedHomework / totalHomework) * 100) : 0;
  
  // Average grade
  const avgResult = db.prepare(`
    SELECT AVG(CASE WHEN total_score IS NOT NULL AND h.max_grade > 0 THEN (total_score / h.max_grade * 100) ELSE NULL END) as avg_grade
    FROM homework_submissions hs
    JOIN homework h ON hs.homework_id = h.id
    WHERE hs.student_profile_id = ? AND hs.status = 'graded'
  `).get(req.studentProfileId);
  
  const avgGrade = avgResult?.avg_grade ? Math.round(avgResult.avg_grade) : 0;
  
  // Subjects
  const subjects = db.prepare(`
    SELECT s.name, t.full_name as teacher_name
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.id
    LEFT JOIN teachers t ON ss.teacher_id = t.id
    WHERE ss.student_profile_id = ?
  `).all(req.studentProfileId);
  
  // Upcoming lessons
  const today = new Date().toISOString().split('T')[0];
  const upcomingLessons = db.prepare(`
    SELECT l.*, s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    WHERE l.student_profile_id = ? AND l.date >= ? AND l.status IN ('scheduled', 'rescheduled')
    ORDER BY l.date, l.start_time LIMIT 5
  `).all(req.studentProfileId, today);
  
  // Unread notifications count
  const unreadNotifications = db.prepare("SELECT COUNT(*) as cnt FROM notifications WHERE user_id = ? AND is_read = 0").get(req.session.userId).cnt;
  
  res.json({
    user: sanitizeUser(user),
    profile,
    subjects,
    stats: {
      totalLessons,
      completedLessons,
      remainingLessons: activeSub ? (activeSub.total_lessons - activeSub.completed_lessons) : 0,
      attendanceRate,
      hwRate,
      avgGrade,
      totalHomework,
      completedHomework,
    },
    activeSub: activeSub ? {
      package_name: activeSub.package_name,
      total_lessons: activeSub.total_lessons,
      completed_lessons: activeSub.completed_lessons,
      remaining_lessons: activeSub.total_lessons - activeSub.completed_lessons,
      status: activeSub.status,
      start_date: activeSub.start_date,
      expiry_date: activeSub.expiry_date,
    } : null,
    upcomingLessons,
    unreadNotifications,
  });
});

// ============================================================
// PROFILE
// ============================================================
router.get('/profile', (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  const profile = db.prepare('SELECT * FROM student_profiles WHERE id = ?').get(req.studentProfileId);
  
  const subjects = db.prepare(`
    SELECT s.name, t.full_name as teacher_name
    FROM student_subjects ss
    JOIN subjects s ON ss.subject_id = s.id
    LEFT JOIN teachers t ON ss.teacher_id = t.id
    WHERE ss.student_profile_id = ?
  `).all(req.studentProfileId);
  
  res.json({ user: sanitizeUser(user), profile, subjects });
});

router.put('/profile', (req, res) => {
  const { phone } = req.body;
  // Students can only update their phone
  if (phone !== undefined) {
    db.prepare("UPDATE users SET phone = ?, updated_at = datetime('now') WHERE id = ?")
      .run(phone, req.session.userId);
  }
  res.json({ message: 'تم تحديث الملف الشخصي.' });
});

// ============================================================
// SCHEDULE
// ============================================================
router.get('/schedule', (req, res) => {
  const { start_date, end_date } = req.query;
  
  let query = `
    SELECT l.*, s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    WHERE l.student_profile_id = ?
  `;
  const params = [req.studentProfileId];
  
  if (start_date) { query += ' AND l.date >= ?'; params.push(start_date); }
  if (end_date) { query += ' AND l.date <= ?'; params.push(end_date); }
  
  query += ' ORDER BY l.date, l.start_time';
  
  const lessons = db.prepare(query).all(...params);
  res.json(lessons);
});

// ============================================================
// LESSONS
// ============================================================
router.get('/lessons', (req, res) => {
  const lessons = db.prepare(`
    SELECT l.*, s.name as subject_name, t.full_name as teacher_name,
           h.id as homework_id, h.title as homework_title
    FROM lessons l
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    LEFT JOIN homework h ON h.lesson_id = l.id
    WHERE l.student_profile_id = ?
    ORDER BY l.date DESC, l.start_time DESC
  `).all(req.studentProfileId);
  
  res.json(lessons);
});

router.get('/lessons/:uuid', (req, res) => {
  const lesson = db.prepare(`
    SELECT l.*, s.name as subject_name, t.full_name as teacher_name
    FROM lessons l
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN teachers t ON l.teacher_id = t.id
    WHERE l.uuid = ? AND l.student_profile_id = ?
  `).get(req.params.uuid, req.studentProfileId);
  
  if (!lesson) return res.status(404).json({ error: 'الحصة غير موجودة.' });
  
  // Get materials (IDOR: only if lesson belongs to student)
  const materials = db.prepare('SELECT id, title, description, file_type, external_url, created_at FROM lesson_materials WHERE lesson_id = ?').all(lesson.id);
  
  res.json({ lesson, materials });
});

// ============================================================
// HOMEWORK
// ============================================================
router.get('/homework', (req, res) => {
  const homework = db.prepare(`
    SELECT h.*, l.title as lesson_title, l.date as lesson_date, s.name as subject_name,
           hs.status as submission_status, hs.total_score, hs.feedback, hs.uuid as submission_uuid
    FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    LEFT JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_profile_id = ?
    WHERE l.student_profile_id = ? AND h.is_published = 1
    ORDER BY h.created_at DESC
  `).all(req.studentProfileId, req.studentProfileId);
  
  res.json(homework);
});

router.get('/homework/:uuid', (req, res) => {
  const hw = db.prepare(`
    SELECT h.*, l.title as lesson_title, l.student_profile_id
    FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    WHERE h.uuid = ?
  `).get(req.params.uuid);
  
  if (!hw || hw.student_profile_id !== req.studentProfileId) {
    return res.status(404).json({ error: 'الواجب غير موجود.' });
  }
  
  // Get questions (hide correct answers)
  const questions = db.prepare(`
    SELECT id, homework_id, question_text, question_type, options, points, order_index
    FROM homework_questions WHERE homework_id = ? ORDER BY order_index
  `).all(hw.id);
  
  // Get existing submission
  const submission = db.prepare(`
    SELECT * FROM homework_submissions WHERE homework_id = ? AND student_profile_id = ?
  `).get(hw.id, req.studentProfileId);
  
  let answers = [];
  if (submission) {
    answers = db.prepare(`
      SELECT ha.*, hq.question_text, hq.correct_answer, hq.points
      FROM homework_answers ha
      JOIN homework_questions hq ON ha.question_id = hq.id
      WHERE ha.submission_id = ?
    `).all(submission.id);
    
    // Only show correct answers if graded
    if (submission.status !== 'graded') {
      answers = answers.map(a => ({ ...a, correct_answer: undefined }));
    }
  }
  
  res.json({ homework: hw, questions, submission, answers });
});

router.post('/homework/:uuid/submit', validate(submitHomeworkSchema), (req, res) => {
  const hw = db.prepare(`
    SELECT h.*, l.student_profile_id
    FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    WHERE h.uuid = ?
  `).get(req.params.uuid);
  
  if (!hw || hw.student_profile_id !== req.studentProfileId) {
    return res.status(404).json({ error: 'الواجب غير موجود.' });
  }
  
  // Check if already submitted
  const existing = db.prepare('SELECT id FROM homework_submissions WHERE homework_id = ? AND student_profile_id = ?')
    .get(hw.id, req.studentProfileId);
  if (existing) {
    return res.status(409).json({ error: 'تم تسليم هذا الواجب مسبقاً.' });
  }
  
  const { answers } = req.validatedBody;
  
  const submitHw = db.transaction(() => {
    const subUuid = uuidv4();
    let autoScore = 0;
    
    const subResult = db.prepare(`
      INSERT INTO homework_submissions (uuid, homework_id, student_profile_id, submitted_at, status)
      VALUES (?, ?, ?, datetime('now'), 'submitted')
    `).run(subUuid, hw.id, req.studentProfileId);
    
    const subId = subResult.lastInsertRowid;
    
    const insertAnswer = db.prepare(`
      INSERT INTO homework_answers (submission_id, question_id, answer_text, is_correct, points_earned)
      VALUES (?, ?, ?, ?, ?)
    `);
    
    for (const ans of answers) {
      const question = db.prepare('SELECT * FROM homework_questions WHERE id = ? AND homework_id = ?').get(ans.question_id, hw.id);
      if (!question) continue;
      
      let isCorrect = null;
      let pointsEarned = 0;
      
      // Auto-grade objective questions
      if (['multiple_choice', 'true_false'].includes(question.question_type) && question.correct_answer) {
        isCorrect = (ans.answer_text || '').trim().toLowerCase() === question.correct_answer.trim().toLowerCase() ? 1 : 0;
        pointsEarned = isCorrect ? question.points : 0;
        autoScore += pointsEarned;
      }
      
      insertAnswer.run(subId, ans.question_id, ans.answer_text || '', isCorrect, pointsEarned);
    }
    
    // Update auto score
    db.prepare('UPDATE homework_submissions SET auto_score = ?, total_score = ? WHERE id = ?')
      .run(autoScore, autoScore, subId);
    
    return { subUuid, autoScore };
  });
  
  const result = submitHw();
  
  res.status(201).json({
    message: 'تم تسليم الواجب بنجاح.',
    uuid: result.subUuid,
    autoScore: result.autoScore,
  });
});

// ============================================================
// PROGRESS
// ============================================================
router.get('/progress', (req, res) => {
  // Subject performance
  const subjectPerformance = db.prepare(`
    SELECT s.name as subject_name, s.id as subject_id,
           COUNT(l.id) as total_lessons,
           SUM(CASE WHEN l.status = 'completed' THEN 1 ELSE 0 END) as completed_lessons,
           SUM(CASE WHEN l.attendance = 'present' THEN 1 ELSE 0 END) as present_count
    FROM lessons l
    JOIN subjects s ON l.subject_id = s.id
    WHERE l.student_profile_id = ?
    GROUP BY s.id
  `).all(req.studentProfileId);
  
  // Homework scores by subject
  const hwBySubject = db.prepare(`
    SELECT s.name as subject_name,
           AVG(CASE WHEN hs.total_score IS NOT NULL AND h.max_grade > 0 THEN (hs.total_score / h.max_grade * 100) ELSE NULL END) as avg_score,
           COUNT(hs.id) as hw_count
    FROM homework h
    JOIN lessons l ON h.lesson_id = l.id
    JOIN subjects s ON l.subject_id = s.id
    LEFT JOIN homework_submissions hs ON h.id = hs.homework_id AND hs.student_profile_id = ?
    WHERE l.student_profile_id = ? AND hs.status = 'graded'
    GROUP BY s.id
  `).all(req.studentProfileId, req.studentProfileId);
  
  // Monthly progress (lessons completed per month)
  const monthlyProgress = db.prepare(`
    SELECT strftime('%Y-%m', date) as month,
           COUNT(*) as total,
           SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed
    FROM lessons
    WHERE student_profile_id = ?
    GROUP BY strftime('%Y-%m', date)
    ORDER BY month DESC LIMIT 12
  `).all(req.studentProfileId);
  
  // Grades
  const grades = db.prepare(`
    SELECT g.*, s.name as subject_name
    FROM grades g
    LEFT JOIN subjects s ON g.subject_id = s.id
    WHERE g.student_profile_id = ?
    ORDER BY g.created_at DESC
  `).all(req.studentProfileId);
  
  res.json({ subjectPerformance, hwBySubject, monthlyProgress, grades });
});

// ============================================================
// SUBSCRIPTION
// ============================================================
router.get('/subscription', (req, res) => {
  const subscriptions = db.prepare(`
    SELECT sub.uuid, sub.total_lessons, sub.completed_lessons,
           (sub.total_lessons - sub.completed_lessons) as remaining_lessons,
           sub.status, sub.start_date, sub.expiry_date,
           p.name as package_name, p.lesson_count
    FROM subscriptions sub
    LEFT JOIN packages p ON sub.package_id = p.id
    WHERE sub.student_profile_id = ?
    ORDER BY sub.created_at DESC
  `).all(req.studentProfileId);
  
  res.json(subscriptions);
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
  // Only mark own notifications
  db.prepare('UPDATE notifications SET is_read = 1 WHERE id = ? AND user_id = ?')
    .run(parseInt(req.params.id), req.session.userId);
  res.json({ message: 'تم.' });
});

router.put('/notifications/read-all', (req, res) => {
  db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.session.userId);
  res.json({ message: 'تم قراءة جميع الإشعارات.' });
});

export default router;
