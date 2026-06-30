const fs = require('fs');
let content = fs.readFileSync('client/src/components/TeachingPlan.tsx', 'utf8');
content = content.replace(/if \(text\.includes\('[\r\n]+'\)\)/g, "if (text.includes('\\n'))");
content = content.replace(/const lines = text\.split\(\/[\r\n]+\?[\r\n]+\/\);/g, "const lines = text.split(/\\r?\\n/);");
fs.writeFileSync('client/src/components/TeachingPlan.tsx', content, 'utf8');
console.log("Fixed newlines");
