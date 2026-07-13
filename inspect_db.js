import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.APP_DATA_PATH 
  ? path.join(process.env.APP_DATA_PATH, 'database.sqlite') 
  : path.resolve('server/database.sqlite');

console.log("Opening db at:", dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Open error:", err);
    return;
  }
  db.all("SELECT name FROM sqlite_master WHERE type='table'", (err, tables) => {
    if (err) {
      console.error("Tables error:", err);
      return;
    }
    console.log("Tables:", tables.map(t => t.name));
    tables.forEach(t => {
      db.all(`PRAGMA table_info(${t.name})`, (err, cols) => {
        if (err) {
          console.error(`Cols error for ${t.name}:`, err);
          return;
        }
        const hasUpdatedAt = cols.some(c => c.name === 'updated_at');
        const hasDeleted = cols.some(c => c.name === 'deleted');
        console.log(`Table: ${t.name} -> has updated_at: ${hasUpdatedAt}, has deleted: ${hasDeleted}`);
        if (!hasUpdatedAt || !hasDeleted) {
          console.log("Columns:", cols.map(c => c.name));
        }
      });
    });
  });
});
