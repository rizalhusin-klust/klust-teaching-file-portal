const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const startIndex = c.indexOf('// Get LMS result PDF path from course portfolio');
const endIndex = c.indexOf("const serverUrl = API_BASE.replace('/api', '');") + 47;

const before = c.substring(0, startIndex);
const after = c.substring(endIndex);

fs.writeFileSync('client/src/App.tsx', before + after, 'utf8');
console.log('Removed parsing block');
