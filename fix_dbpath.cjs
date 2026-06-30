const fs = require('fs');
let content = fs.readFileSync('server/database.js', 'utf8');

// Replace dbPath logic
content = content.replace(
  "const dbPath = path.resolve(__dirname, 'database.sqlite');",
  "const dbPath = process.env.APP_DATA_PATH ? path.join(process.env.APP_DATA_PATH, 'database.sqlite') : path.resolve(__dirname, 'database.sqlite');"
);

fs.writeFileSync('server/database.js', content);
console.log("Fixed dbPath in database.js!");
