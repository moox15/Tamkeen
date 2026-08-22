import db from '../config/database.js';

// Log an admin action to the audit trail
export function logAudit(adminUserId, action, targetType, targetId, metadata = null, ipAddress = null) {
  db.prepare(`
    INSERT INTO audit_logs (admin_user_id, action, target_type, target_id, metadata, ip_address)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(
    adminUserId,
    action,
    targetType,
    targetId,
    metadata ? JSON.stringify(metadata) : null,
    ipAddress
  );
}

// Create a notification for a user
export function createNotification(userId, title, message, type = 'system', metadata = null) {
  db.prepare(`
    INSERT INTO notifications (user_id, title, message, type, metadata)
    VALUES (?, ?, ?, ?, ?)
  `).run(userId, title, message, type, metadata ? JSON.stringify(metadata) : null);
}

// Calculate remaining lessons from a subscription
export function getRemainingLessons(subscriptionId) {
  const sub = db.prepare(`
    SELECT total_lessons, completed_lessons FROM subscriptions WHERE id = ?
  `).get(subscriptionId);
  
  if (!sub) return 0;
  return sub.total_lessons - sub.completed_lessons;
}

// Get student profile ID from user ID
export function getStudentProfileId(userId) {
  const profile = db.prepare('SELECT id FROM student_profiles WHERE user_id = ?').get(userId);
  return profile ? profile.id : null;
}

// Sanitize output - remove sensitive fields
export function sanitizeUser(user) {
  if (!user) return null;
  const { password_hash, password_reset_token, password_reset_expires, failed_login_attempts, locked_until, ...safe } = user;
  return safe;
}
