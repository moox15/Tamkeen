import express from 'express';
import session from 'express-session';
import cors from 'cors';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: join(__dirname, '.env') });

import config from './src/config/index.js';
import { securityHeaders } from './src/middleware/securityHeaders.js';
import { generalLimiter } from './src/middleware/rateLimiter.js';
import { generateCsrfToken, validateCsrf } from './src/middleware/csrf.js';
import { errorHandler, notFoundHandler } from './src/middleware/errorHandler.js';

import authRoutes from './src/routes/auth.routes.js';
import adminRoutes from './src/routes/admin.routes.js';
import studentRoutes from './src/routes/student.routes.js';
import fileRoutes from './src/routes/file.routes.js';

const app = express();

// ============================================================
// SECURITY
// ============================================================
if (config.env === 'production') {
  app.use(securityHeaders());
}

app.use(cors({
  origin: config.cors.origin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'X-CSRF-Token'],
}));

app.use(generalLimiter);

// ============================================================
// BODY PARSING
// ============================================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ============================================================
// SESSION
// ============================================================
import sessionStore from './src/config/sessionStore.js';

app.use(session({
  store: sessionStore,
  name: 'tamkeen.sid',
  secret: config.session.secret,
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: config.env === 'production',
    sameSite: 'lax',
    maxAge: config.session.maxAge,
  },
}));

// CSRF token generation
app.use(generateCsrfToken);

// ============================================================
// ROUTES
// ============================================================
// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Auth routes (no CSRF for login)
app.use('/api/auth', authRoutes);

// Protected routes with CSRF validation
app.use('/api/admin', validateCsrf, adminRoutes);
app.use('/api/student', validateCsrf, studentRoutes);
app.use('/api/files', fileRoutes);

// Serve client frontend in production
const clientDist = join(__dirname, '../client/dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(join(clientDist, 'index.html'));
  });
}

// ============================================================
// ERROR HANDLING
// ============================================================
app.use('/api/*', notFoundHandler);
app.use(errorHandler);

// ============================================================
// START
// ============================================================
app.listen(config.port, () => {
  console.log(`\n🚀 تمكّن Server running at http://localhost:${config.port}`);
  console.log(`   Environment: ${config.env}`);
  console.log(`   CORS: ${config.cors.origin}\n`);
});

export default app;
