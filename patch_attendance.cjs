const fs = require('fs');

// --- 1. Patch AttendanceRegistry.tsx ---
let attContent = fs.readFileSync('client/src/components/AttendanceRegistry.tsx', 'utf8');

attContent = attContent.replace(
  /onUpdateAttendance: \(matricId: string, date: string, status: 'Y' \| 'N' \| 'MC'\) => void;/g,
  "onUpdateAttendance: (matricId: string, date: string, status: 'Y' | 'N' | 'MC' | '') => void;"
);

attContent = attContent.replace(
  /const \[attendanceMap, setAttendanceMap\] = useState<\{ \[key: string\]: 'Y' \| 'N' \| 'MC' \}>\(\{\}\);/g,
  "const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: 'Y' | 'N' | 'MC' | '' }>({});"
);

attContent = attContent.replace(
  /const map: \{ \[key: string\]: 'Y' \| 'N' \| 'MC' \} = \{\};/g,
  "const map: { [key: string]: 'Y' | 'N' | 'MC' | '' } = {};"
);

const oldClick = `const current = attendanceMap[\`\${matricId}_\${date}\`] || 'Y';
    let next: 'Y' | 'N' | 'MC' = 'Y';
    
    if (current === 'Y') next = 'N';
    else if (current === 'N') next = 'MC';
    else if (current === 'MC') next = 'Y';`;

const newClick = `const current = attendanceMap[\`\${matricId}_\${date}\`] || '';
    let next: 'Y' | 'N' | 'MC' | '' = 'Y';
    
    if (current === '') next = 'Y';
    else if (current === 'Y') next = 'N';
    else if (current === 'N') next = 'MC';
    else if (current === 'MC') next = '';`;

attContent = attContent.replace(oldClick, newClick);

attContent = attContent.replace(
  /const status = attendanceMap\[\`\$\{student\.matric_id\}_\$\{date\}\`\] \|\| 'Y';/g,
  "const status = attendanceMap[`${student.matric_id}_${date}`] || '';"
);

fs.writeFileSync('client/src/components/AttendanceRegistry.tsx', attContent, 'utf8');


// --- 2. Patch App.tsx ---
let appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
appContent = appContent.replace(
  /const handleUpdateAttendance = async \(studentMatricId: string, date: string, status: 'Y' \| 'N' \| 'MC'\) => \{/g,
  "const handleUpdateAttendance = async (studentMatricId: string, date: string, status: 'Y' | 'N' | 'MC' | '') => {"
);
fs.writeFileSync('client/src/App.tsx', appContent, 'utf8');


// --- 3. Patch dbService.js ---
let dbContent = fs.readFileSync('server/dbService.js', 'utf8');
dbContent = dbContent.replace(/status: status \|\| 'Y',/g, "status: (status !== undefined && status !== null) ? status : 'Y',");
dbContent = dbContent.replace(/status \|\| 'Y'/g, "(status !== undefined && status !== null) ? status : 'Y'");
fs.writeFileSync('server/dbService.js', dbContent, 'utf8');

console.log('Attendance fully patched!');
