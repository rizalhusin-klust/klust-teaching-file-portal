const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');
content = content.replace(/\(>=50%\)/g, "(&gt;=50%)");
fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('Fixed TSX greater-than');
