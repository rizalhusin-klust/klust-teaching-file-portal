const fs = require('fs');
let content = fs.readFileSync('server/database.js', 'utf8');

// Add is_active to plos
content = content.replace(
  'db.run("ALTER TABLE course_info ADD COLUMN pass_mark REAL DEFAULT 50.0", (err) => {});',
  'db.run("ALTER TABLE course_info ADD COLUMN pass_mark REAL DEFAULT 50.0", (err) => {});\n      db.run("ALTER TABLE plos ADD COLUMN is_active INTEGER DEFAULT 1", (err) => {});'
);

content = content.replace(
  '      plo_no TEXT,\n      description TEXT,\n      course_id INTEGER,',
  '      plo_no TEXT,\n      description TEXT,\n      is_active INTEGER DEFAULT 1,\n      course_id INTEGER,'
);

fs.writeFileSync('server/database.js', content);
console.log("Updated database.js plos table!");
