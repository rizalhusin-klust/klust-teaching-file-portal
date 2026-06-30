const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

content = content.replace(
  'export type PLO = {\n  plo_no: string;\n  description: string;\n};',
  'export type PLO = {\n  plo_no: string;\n  description: string;\n  is_active?: number;\n};'
);

fs.writeFileSync('client/src/App.tsx', content);
console.log("Updated PLO type in App.tsx!");
