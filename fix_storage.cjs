const fs = require('fs');
let content = fs.readFileSync('server/storageService.js', 'utf8');

content = content.replace(
  "const UPLOAD_DIR = path.resolve(__dirname, 'uploads');",
  "const UPLOAD_DIR = process.env.APP_DATA_PATH ? path.join(process.env.APP_DATA_PATH, 'uploads') : path.resolve(__dirname, 'uploads');"
);

fs.writeFileSync('server/storageService.js', content);
console.log("Fixed storage path!");
