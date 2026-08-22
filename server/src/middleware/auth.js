// Authentication middleware
export function requireAuth(req, res, next) {
  if (!req.session || !req.session.userId) {
    return res.status(401).json({ error: 'يجب تسجيل الدخول للوصول إلى هذه الصفحة.' });
  }
  next();
}

// Role-based access control
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.session || !req.session.userId) {
      return res.status(401).json({ error: 'يجب تسجيل الدخول.' });
    }
    if (!roles.includes(req.session.role)) {
      return res.status(403).json({ error: 'ليس لديك صلاحية للوصول إلى هذه الصفحة.' });
    }
    next();
  };
}

// Admin-only shortcut
export const requireAdmin = requireRole('admin');

// Student-only shortcut
export const requireStudent = requireRole('student');
