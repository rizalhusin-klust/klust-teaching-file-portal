import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = process.env.APP_DATA_PATH 
  ? path.join(process.env.APP_DATA_PATH, 'database.sqlite') 
  : path.resolve('database.sqlite');

console.log("Opening db at:", dbPath);
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error("Open error:", err);
    return;
  }
  const trackingTables = [
    'course_info', 'students', 'plos', 'clos', 'clo_plo_mappings',
    'optional_groups', 'assessments', 'marks', 'attendance',
    'weekly_reports', 'grade_thresholds', 'planned_assessments'
  ];

  trackingTables.forEach(tableName => {
    db.run(`DROP TRIGGER IF EXISTS update_${tableName}_time`, (err) => {
      if (err) {
        console.error(`Error dropping trigger for ${tableName}:`, err);
      } else {
        console.log(`Successfully dropped trigger for ${tableName}`);
      }
    });
  });
});
