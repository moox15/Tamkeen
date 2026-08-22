import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '../../.env') });

const config = {
  env: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),
  db: {
    path: process.env.DB_PATH || './data/tamkeen.db',
  },
  session: {
    secret: process.env.SESSION_SECRET || 'dev-secret-change-in-production',
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
  },
  bcrypt: {
    rounds: parseInt(process.env.BCRYPT_ROUNDS || '12', 10),
  },
  upload: {
    dir: process.env.UPLOAD_DIR || './uploads',
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: [
      'image/jpeg', 'image/png', 'image/gif', 'image/webp',
      'application/pdf',
      'video/mp4', 'video/webm',
      'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation',
    ],
    allowedExtensions: ['.jpg', '.jpeg', '.png', '.gif', '.webp', '.pdf', '.mp4', '.webm', '.doc', '.docx', '.xls', '.xlsx', '.ppt', '.pptx'],
  },
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@tamkeen.sa',
    password: process.env.ADMIN_PASSWORD || 'Admin@123456',
  },
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: parseInt(process.env.RATE_LIMIT_MAX || '10000', 10),
    loginMax: parseInt(process.env.RATE_LIMIT_LOGIN_MAX || '100', 10),
    loginWindowMs: 15 * 60 * 1000,
  },
  lockout: {
    maxAttempts: 5,
    durationMs: 30 * 60 * 1000, // 30 minutes
  },
};

export default config;
