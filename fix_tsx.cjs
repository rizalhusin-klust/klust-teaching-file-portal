const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
content = content.replace(/Is the targeted Average \(=>50%\) achieved\?/g, "Is the targeted Average (>=50%) achieved?");
content = content.replace(/Is the targeted Density \(=>50%\) achieved\?/g, "Is the targeted Density (>=50%) achieved?");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('Fixed TSX syntax');
