// Global error handler - returns Arabic error messages, never exposes stack traces
export function errorHandler(err, req, res, next) {
  console.error(`[ERROR] ${err.message}`, {
    path: req.path,
    method: req.method,
    stack: err.stack,
  });

  // Don't expose internal details
  const statusCode = err.statusCode || 500;
  const message = statusCode === 500
    ? 'حدث خطأ في الخادم. يرجى المحاولة مرة أخرى لاحقاً.'
    : err.message;

  res.status(statusCode).json({
    error: message,
    ...(process.env.NODE_ENV === 'development' && { debug: err.message }),
  });
}

// 404 handler
export function notFoundHandler(req, res) {
  res.status(404).json({ error: 'الصفحة المطلوبة غير موجودة.' });
}
