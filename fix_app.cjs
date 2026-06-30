const fs = require('fs');
let appContent = fs.readFileSync('client/src/App.tsx', 'utf8');
appContent = appContent.replace(/status: 'Y' \| 'N' \| 'MC'\)/g, "status: 'Y' | 'N' | 'MC' | '')");
fs.writeFileSync('client/src/App.tsx', appContent, 'utf8');
console.log('Fixed App.tsx signature');
