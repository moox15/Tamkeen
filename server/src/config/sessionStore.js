import session from 'express-session';
import db from './database.js';

// Ensure sessions table exists
db.exec(`
  CREATE TABLE IF NOT EXISTS sessions (
    sid TEXT PRIMARY KEY,
    sess TEXT NOT NULL,
    expired INTEGER NOT NULL
  );
  CREATE INDEX IF NOT EXISTS idx_sessions_expired ON sessions(expired);
`);

class SqliteSessionStore extends session.Store {
  constructor() {
    super();
    // Periodically clean up expired sessions
    setInterval(() => {
      try {
        db.prepare('DELETE FROM sessions WHERE expired < ?').run(Date.now());
      } catch (e) {}
    }, 15 * 60 * 1000);
  }

  get(sid, cb) {
    try {
      const row = db.prepare('SELECT sess, expired FROM sessions WHERE sid = ?').get(sid);
      if (!row) return cb(null, null);

      if (row.expired < Date.now()) {
        this.destroy(sid, () => {});
        return cb(null, null);
      }

      const sess = JSON.parse(row.sess);
      cb(null, sess);
    } catch (err) {
      cb(err);
    }
  }

  set(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      const sessStr = JSON.stringify(sess);

      db.prepare(`
        INSERT INTO sessions (sid, sess, expired)
        VALUES (?, ?, ?)
        ON CONFLICT(sid) DO UPDATE SET
          sess = excluded.sess,
          expired = excluded.expired
      `).run(sid, sessStr, expired);

      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  destroy(sid, cb) {
    try {
      db.prepare('DELETE FROM sessions WHERE sid = ?').run(sid);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }

  touch(sid, sess, cb) {
    try {
      const maxAge = sess.cookie?.maxAge || 24 * 60 * 60 * 1000;
      const expired = Date.now() + maxAge;
      db.prepare('UPDATE sessions SET expired = ? WHERE sid = ?').run(expired, sid);
      if (cb) cb(null);
    } catch (err) {
      if (cb) cb(err);
    }
  }
}

export default new SqliteSessionStore();
