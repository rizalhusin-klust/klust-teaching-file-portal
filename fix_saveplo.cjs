const fs = require('fs');
let content = fs.readFileSync('server/dbService.js', 'utf8');

content = content.replace(
  '        await sqliteRun("INSERT OR REPLACE INTO plos (plo_no, description, course_id) VALUES (?, ?, ?)", [ploNo, \nplo.description, plo.course_id]);',
  '        await sqliteRun("INSERT OR REPLACE INTO plos (plo_no, description, is_active, course_id) VALUES (?, ?, ?, ?)", [ploNo, plo.description, plo.is_active !== undefined ? (plo.is_active ? 1 : 0) : 1, plo.course_id]);'
);

fs.writeFileSync('server/dbService.js', content);
console.log("Updated dbService.js savePLO!");
