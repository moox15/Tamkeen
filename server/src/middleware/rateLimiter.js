import rateLimit from 'express-rate-limit';
import config from '../config/index.js';

// General API rate limiter
export const generalLimiter = rateLimit({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.max,
  message: { error: 'تم تجاوز الحد المسموح من الطلبات. يرجى المحاولة بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => config.env === 'development',
});

// Login rate limiter (stricter)
export const loginLimiter = rateLimit({
  windowMs: config.rateLimit.loginWindowMs,
  max: config.rateLimit.loginMax,
  message: { error: 'تم تجاوز عدد محاولات تسجيل الدخول. يرجى المحاولة بعد قليل.' },
  standardHeaders: true,
  legacyHeaders: false,
  keyGenerator: (req) => req.ip,
  skip: () => config.env === 'development',
});

