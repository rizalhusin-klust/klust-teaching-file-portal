const fs = require('fs');

// 1. AttendanceRegistry.tsx
let attContent = fs.readFileSync('client/src/components/AttendanceRegistry.tsx', 'utf8');
attContent = attContent.replace(/onUpdateAttendance: \(matricId: string, date: string, status: 'Y' \| 'N' \| 'MC'\) => void;/g, "onUpdateAttendance: (matricId: string, date: string, status: 'Y' | 'N' | 'MC' | '') => void;");
fs.writeFileSync('client/src/components/AttendanceRegistry.tsx', attContent, 'utf8');

// 2. MainTables.tsx
let mainTablesContent = fs.readFileSync('client/src/components/MainTables.tsx', 'utf8');
mainTablesContent = mainTablesContent.replace(/console\.log\(programName\);/g, "");
mainTablesContent = mainTablesContent.replace(/console\.log\(programAbb\);/g, "");
mainTablesContent = mainTablesContent.replace(/const \[programName, setProgramName\] = useState/g, "const [_programName, setProgramName] = useState");
mainTablesContent = mainTablesContent.replace(/const \[programAbb, setProgramAbb\] = useState/g, "const [_programAbb, setProgramAbb] = useState");
fs.writeFileSync('client/src/components/MainTables.tsx', mainTablesContent, 'utf8');

// 3. ObeDashboard.tsx
let obeContent = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
obeContent = obeContent.replace(/<Fragment/g, "<>").replace(/<\/Fragment>/g, "</>");
obeContent = obeContent.replace(/, Fragment/g, "");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', obeContent, 'utf8');

// 4. App.tsx (fix the type definition just in case)
let appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
appContent = appContent.replace(/status: 'Y' \| 'N' \| 'MC'\) => Promise<void>/g, "status: 'Y' | 'N' | 'MC' | '') => Promise<void>");
fs.writeFileSync('client/src/App.tsx', appContent, 'utf8');

console.log('Fixed TS errors step 3');
