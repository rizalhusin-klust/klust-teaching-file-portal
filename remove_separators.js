const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

c = c.replace(/\s*<PrintSeparator number=\{"2\.1"\} title=\{"CLO Analysis"\} \/>/, '');
c = c.replace(/\s*<PrintSeparator number=\{"2\.2"\} title=\{"PLO Analysis"\} \/>/, '');
c = c.replace(/\s*<PrintSeparator number=\{"2\.3"\} title=\{"Student CLO Breakdown"\} \/>/, '');
c = c.replace(/\s*<PrintSeparator number=\{"2\.4"\} title=\{"Student PLO Breakdown"\} \/>/, '');
c = c.replace(/\s*<PrintSeparator number=\{"2\.5"\} title=\{"CQI Report"\} \/>/, '');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Removed PrintSeparators for 2.1 - 2.5');
