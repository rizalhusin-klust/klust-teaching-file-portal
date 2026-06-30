const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

content = content.replace(
  '  references_list?: string;\n};',
  '  references_list?: string;\n  program_name?: string;\n  program_abb?: string;\n};'
);

fs.writeFileSync('client/src/App.tsx', content);
console.log("Updated App.tsx!");
