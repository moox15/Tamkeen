import db from '../config/database.js';
import config from '../config/index.js';
import bcrypt from 'bcryptjs';
import { v4 as uuidv4 } from 'uuid';

// Run migration first
import '../config/migrate.js';

console.log('🌱 Seeding database...');

// ============================================================
// SEED ADMIN USER
// ============================================================
const existingAdmin = db.prepare('SELECT id FROM users WHERE role = ?').get('admin');

if (!existingAdmin) {
  const hash = bcrypt.hashSync(config.admin.password, config.bcrypt.rounds);
  db.prepare(`
    INSERT INTO users (uuid, email, password_hash, role, full_name, phone)
    VALUES (?, ?, ?, 'admin', ?, ?)
  `).run(uuidv4(), config.admin.email, hash, 'مدير النظام', '');
  console.log(`✅ Admin user created: ${config.admin.email}`);
} else {
  console.log('ℹ️  Admin user already exists, skipping.');
}

console.log('🎉 Seeding complete (Clean state ready for admin input)!');

