const fs = require('fs');
let content = fs.readFileSync('server/database.js', 'utf8');

// Add to migrations
content = content.replace(
  'db.run("ALTER TABLE course_info ADD COLUMN table4_path TEXT", (err) => {});',
  'db.run("ALTER TABLE course_info ADD COLUMN table4_path TEXT", (err) => {});\n      db.run("ALTER TABLE course_info ADD COLUMN program_name TEXT", (err) => {});\n      db.run("ALTER TABLE course_info ADD COLUMN program_abb TEXT", (err) => {});'
);

// Add to CREATE TABLE
content = content.replace(
  'table4_path TEXT,',
  'table4_path TEXT,\n      program_name TEXT,\n      program_abb TEXT,'
);

// Add to seed
content = content.replace(
  'INSERT INTO course_info (id, course_code, course_name, credit_hours, lecturer, email, room_no, telephone, hp_no, consultation_hours, semester, start_date, end_date, session1_day, session1_start, session1_end, session2_day, session2_start, session2_end, synopsis, references_list)',
  'INSERT INTO course_info (id, course_code, course_name, credit_hours, lecturer, email, room_no, telephone, hp_no, consultation_hours, semester, start_date, end_date, session1_day, session1_start, session1_end, session2_day, session2_start, session2_end, synopsis, references_list, program_name, program_abb)'
);

content = content.replace(
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)',
  'VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)'
);

content = content.replace(
  "'1. Parent, R.",
  "'Bachelor of Architecture', 'B.Arch', '1. Parent, R."
);

fs.writeFileSync('server/database.js', content);
console.log("Updated database.js!");
