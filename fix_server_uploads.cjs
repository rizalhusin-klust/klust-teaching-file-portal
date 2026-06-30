const fs = require('fs');
let content = fs.readFileSync('server/server.js', 'utf8');

// Replace express.static for uploads
content = content.replace(
  "app.use('/uploads', express.static(path.join(__dirname, 'uploads')));",
  "const UPLOAD_DIR = process.env.APP_DATA_PATH ? path.join(process.env.APP_DATA_PATH, 'uploads') : path.join(__dirname, 'uploads');\napp.use('/uploads', express.static(UPLOAD_DIR));"
);

fs.writeFileSync('server/server.js', content);
console.log("Fixed server.js uploads static path!");
