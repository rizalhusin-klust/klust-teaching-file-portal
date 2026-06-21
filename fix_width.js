const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const regex = /\.sidebar\s*\{\s*width:\s*230px;\s*min-width:\s*230px;/;
c = c.replace(regex, '.sidebar {\n        width: 28%;\n        min-width: 28%;');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Fixed width');
