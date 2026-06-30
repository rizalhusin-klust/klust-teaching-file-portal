const fs = require('fs');
let content = fs.readFileSync('client/src/components/FinalResultDocs.tsx', 'utf8');

content = content.replace(/const timetableKey = 'lecturer_timetable';/g, "const resultKey = 'final_result_lms';");
content = content.replace(/const timetableItem = portfolio\[timetableKey\];/g, "const resultItem = portfolio[resultKey];");
content = content.replace(/item: timetableItem/g, "item: resultItem");
content = content.replace(/label: 'Lecturer Timetable Schedule',/g, "label: 'Detail of Result (LMS)',");
content = content.replace(/\{renderSlotCard\('lecturer_timetable', 'Lecturer Timetable Schedule'\)\}/g, "{renderSlotCard('final_result_lms', 'Detail of Result (LMS)')}");

fs.writeFileSync('client/src/components/FinalResultDocs.tsx', content, 'utf8');
console.log('FinalResultDocs patched');
