const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');
c = c.replace(/icon: 'dY",'/g, "icon: '??'");
fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log("Fixed icons");
