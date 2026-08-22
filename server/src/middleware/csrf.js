import crypto from 'crypto';

// CSRF protection using double-submit cookie pattern
// Generate a CSRF token and store it in the session
export function generateCsrfToken(req, res, next) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  next();
}

// Endpoint to get CSRF token
export function getCsrfToken(req, res) {
  if (!req.session.csrfToken) {
    req.session.csrfToken = crypto.randomBytes(32).toString('hex');
  }
  res.json({ csrfToken: req.session.csrfToken });
}

// Validate CSRF token on state-changing requests
export function validateCsrf(req, res, next) {
  // Skip for GET, HEAD, OPTIONS
  if (['GET', 'HEAD', 'OPTIONS'].includes(req.method)) {
    return next();
  }

  const token = req.headers['x-csrf-token'] || req.body?._csrf;
  
  if (!token || token !== req.session?.csrfToken) {
    return res.status(403).json({ error: 'خطأ في التحقق من الأمان. يرجى تحديث الصفحة والمحاولة مرة أخرى.' });
  }
  
  next();
}
