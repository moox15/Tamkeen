import { Router } from 'express';
import bcrypt from 'bcryptjs';
import crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import db from '../config/database.js';
import config from '../config/index.js';
import { requireAuth } from '../middleware/auth.js';
import { loginLimiter } from '../middleware/rateLimiter.js';
import { validate } from '../middleware/validate.js';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema } from '../validators/schemas.js';
import { sanitizeUser, logAudit } from '../utils/helpers.js';
import { getCsrfToken } from '../middleware/csrf.js';

const router = Router();

// GET /api/auth/csrf-token
router.get('/csrf-token', getCsrfToken);

// POST /api/auth/login
router.post('/login', loginLimiter, validate(loginSchema), (req, res) => {
  const { email, password } = req.validatedBody;
  
  const user = db.prepare('SELECT * FROM users WHERE email = ?').get(email);
  
  if (!user) {
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }
  
  // Check if account is locked
  if (user.locked_until && new Date(user.locked_until) > new Date()) {
    return res.status(423).json({ error: 'تم قفل الحساب مؤقتاً بسبب محاولات تسجيل دخول متعددة. يرجى المحاولة لاحقاً.' });
  }
  
  // Check if account is active
  if (!user.is_active) {
    return res.status(403).json({ error: 'الحساب معطّل. تواصل مع الإدارة.' });
  }
  
  // Verify password
  const valid = bcrypt.compareSync(password, user.password_hash);
  
  if (!valid) {
    // Increment failed attempts
    const attempts = user.failed_login_attempts + 1;
    if (attempts >= config.lockout.maxAttempts) {
      const lockUntil = new Date(Date.now() + config.lockout.durationMs).toISOString();
      db.prepare('UPDATE users SET failed_login_attempts = ?, locked_until = ? WHERE id = ?')
        .run(attempts, lockUntil, user.id);
    } else {
      db.prepare('UPDATE users SET failed_login_attempts = ? WHERE id = ?')
        .run(attempts, user.id);
    }
    return res.status(401).json({ error: 'البريد الإلكتروني أو كلمة المرور غير صحيحة.' });
  }
  
  // Reset failed attempts and update last login
  db.prepare('UPDATE users SET failed_login_attempts = 0, locked_until = NULL, last_login = datetime(\'now\') WHERE id = ?')
    .run(user.id);
  
  // Create session
  req.session.userId = user.id;
  req.session.role = user.role;
  req.session.uuid = user.uuid;
  
  // Generate CSRF token
  req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  
  res.json({
    user: sanitizeUser(user),
    csrfToken: req.session.csrfToken,
  });
});

// POST /api/auth/logout
router.post('/logout', requireAuth, (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      return res.status(500).json({ error: 'حدث خطأ أثناء تسجيل الخروج.' });
    }
    res.clearCookie('tamkeen.sid');
    res.json({ message: 'تم تسجيل الخروج بنجاح.' });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, (req, res) => {
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: 'الجلسة غير صالحة.' });
  }
  
  let studentProfile = null;
  if (user.role === 'student') {
    studentProfile = db.prepare('SELECT * FROM student_profiles WHERE user_id = ?').get(user.id);
  }
  
  res.json({
    user: sanitizeUser(user),
    studentProfile,
    csrfToken: req.session.csrfToken,
  });
});

// PUT /api/auth/change-password
router.put('/change-password', requireAuth, validate(changePasswordSchema), (req, res) => {
  const { currentPassword, newPassword } = req.validatedBody;
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.session.userId);
  
  if (!user) {
    return res.status(401).json({ error: 'المستخدم غير موجود.' });
  }
  
  const valid = bcrypt.compareSync(currentPassword, user.password_hash);
  if (!valid) {
    return res.status(400).json({ error: 'كلمة المرور الحالية غير صحيحة.' });
  }
  
  const hash = bcrypt.hashSync(newPassword, config.bcrypt.rounds);
  db.prepare('UPDATE users SET password_hash = ?, updated_at = datetime(\'now\') WHERE id = ?')
    .run(hash, user.id);
  
  res.json({ message: 'تم تغيير كلمة المرور بنجاح.' });
});

// POST /api/auth/forgot-password
router.post('/forgot-password', loginLimiter, validate(forgotPasswordSchema), (req, res) => {
  const { email } = req.validatedBody;
  const user = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  
  // Always return success to prevent email enumeration
  if (user) {
    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour
    db.prepare('UPDATE users SET password_reset_token = ?, password_reset_expires = ? WHERE id = ?')
      .run(token, expires, user.id);
    
    // In V1, log the token. In production, send email
    console.log(`[Password Reset] Token for ${email}: ${token}`);
  }
  
  res.json({ message: 'إذا كان البريد الإلكتروني مسجلاً، ستصلك رسالة لإعادة تعيين كلمة المرور.' });
});

// POST /api/auth/reset-password
router.post('/reset-password', validate(resetPasswordSchema), (req, res) => {
  const { token, password } = req.validatedBody;
  
  const user = db.prepare('SELECT * FROM users WHERE password_reset_token = ? AND password_reset_expires > datetime(\'now\')').get(token);
  
  if (!user) {
    return res.status(400).json({ error: 'رمز إعادة التعيين غير صالح أو منتهي الصلاحية.' });
  }
  
  const hash = bcrypt.hashSync(password, config.bcrypt.rounds);
  db.prepare('UPDATE users SET password_hash = ?, password_reset_token = NULL, password_reset_expires = NULL, updated_at = datetime(\'now\') WHERE id = ?')
    .run(hash, user.id);
  
  res.json({ message: 'تم إعادة تعيين كلمة المرور بنجاح. يمكنك تسجيل الدخول الآن.' });
});

export default router;
