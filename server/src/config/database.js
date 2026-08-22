import initSqlJs from 'sql.js';
import fs from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';
import config from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const dbPath = join(__dirname, '../..', config.db.path);
fs.mkdirSync(dirname(dbPath), { recursive: true });

// Initialize sql.js WebAssembly engine
const SQL = await initSqlJs();

let sqliteDb;
if (fs.existsSync(dbPath)) {
  const fileBuffer = fs.readFileSync(dbPath);
  sqliteDb = new SQL.Database(fileBuffer);
} else {
  sqliteDb = new SQL.Database();
}

let inTransaction = false;

function persistToDisk() {
  if (inTransaction) return;
  try {
    const data = sqliteDb.export();
    const buffer = Buffer.from(data);
    fs.writeFileSync(dbPath, buffer);
  } catch (err) {
    console.error('Error saving SQLite DB to disk:', err);
  }
}

// Database Wrapper providing standard SQLite API
const db = {
  exec(sql) {
    sqliteDb.exec(sql);
    persistToDisk();
  },

  pragma(pragmaSql) {
    try {
      return sqliteDb.exec(`PRAGMA ${pragmaSql}`);
    } catch (e) {
      // Ignored
    }
  },

  prepare(sql) {
    return {
      all(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = sqliteDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          const results = [];
          while (stmt.step()) {
            results.push(stmt.getAsObject());
          }
          return results;
        } finally {
          stmt.free();
        }
      },

      get(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = sqliteDb.prepare(sql);
        try {
          if (flatParams.length > 0) {
            stmt.bind(flatParams);
          }
          if (stmt.step()) {
            return stmt.getAsObject();
          }
          return null;
        } finally {
          stmt.free();
        }
      },

      run(...params) {
        const flatParams = params.length === 1 && Array.isArray(params[0]) ? params[0] : params;
        const stmt = sqliteDb.prepare(sql);
        try {
          stmt.run(flatParams);
          
          // In SQLite / sql.js, get last insert rowid immediately before any other statement
          const lastIdStmt = sqliteDb.prepare('SELECT last_insert_rowid()');
          let lastInsertRowid = 0;
          if (lastIdStmt.step()) {
            const row = lastIdStmt.get();
            lastInsertRowid = Number(row[0]) || 0;
          }
          lastIdStmt.free();
          
          persistToDisk();
          
          return { lastInsertRowid };
        } finally {
          stmt.free();
        }
      },
    };
  },

  transaction(fn) {
    return (...args) => {
      if (inTransaction) {
        return fn(...args);
      }
      
      inTransaction = true;
      sqliteDb.exec('BEGIN TRANSACTION');
      try {
        const res = fn(...args);
        sqliteDb.exec('COMMIT');
        inTransaction = false;
        persistToDisk();
        return res;
      } catch (err) {
        try {
          sqliteDb.exec('ROLLBACK');
        } catch (rbErr) {
          // Transaction already rolled back
        }
        inTransaction = false;
        throw err;
      }
    };
  },
};

export default db;
