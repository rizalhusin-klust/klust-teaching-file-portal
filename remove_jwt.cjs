const fs = require('fs');
let content = fs.readFileSync('server/server.js', 'utf8');

// The middleware block to remove:
// app.use('/api', (req, res, next) => { ... });
const regex = /app\.use\('\/api', \(req, res, next\) => \{[\s\S]*?\}\);\s*\r?\n/g;
content = content.replace(regex, '');

fs.writeFileSync('server/server.js', content);
console.log("Removed JWT middleware!");
