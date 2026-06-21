const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const regex1 = /    const fullPdfUrl = lmsResultPdfUrl \? \`\$\{serverUrl\}\$\{lmsResultPdfUrl\}\` : '';\n/;
const regex2 = /    const fullTimetableUrl = timetablePdfUrl \? \`\$\{serverUrl\}\$\{timetablePdfUrl\}\` : '';\n/;
const regex3 = /    const fullAttendancePdfUrls = attendancePdfUrls\.map\(url => \`\$\{serverUrl\}\$\{url\}\`\);\n/;

c = c.replace(regex1, '');
c = c.replace(regex2, '');
c = c.replace(regex3, '');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Removed unused');
