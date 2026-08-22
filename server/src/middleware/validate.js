// Zod validation middleware
export function validate(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const errors = result.error.issues.map(issue => ({
          field: issue.path.join('.'),
          message: issue.message,
        }));
        return res.status(400).json({
          error: 'بيانات غير صالحة. يرجى التحقق من المدخلات.',
          details: errors,
        });
      }
      req.validatedBody = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'بيانات غير صالحة.' });
    }
  };
}

// Query params validation
export function validateQuery(schema) {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);
      if (!result.success) {
        return res.status(400).json({ error: 'معاملات البحث غير صالحة.' });
      }
      req.validatedQuery = result.data;
      next();
    } catch (err) {
      return res.status(400).json({ error: 'معاملات غير صالحة.' });
    }
  };
}
