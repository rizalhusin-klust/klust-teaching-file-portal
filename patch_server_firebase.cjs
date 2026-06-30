const fs = require('fs');
const path = require('path');

// 1. Patch server.js
let serverFile = path.join(__dirname, 'server/server.js');
let serverContent = fs.readFileSync(serverFile, 'utf8');

serverContent = serverContent.replace(/import \{ onRequest \} from 'firebase-functions\/v2\/https';\r?\n/g, '');
serverContent = serverContent.replace(/\/\/ Export for Firebase Cloud Functions v2\r?\n\r?\n\/\/ Catch-all to serve index\.html for React SPA\r?\napp\.get\('\*', \(req, res\) => \{\r?\n\s+res\.sendFile\(path\.join\(__dirname, '\.\.\/client\/dist\/index\.html'\)\);\r?\n\}\);\r?\n\r?\nexport const api = onRequest\(\{ cors: true, maxInstances: 10 \}, app\);\r?\n\r?\n\/\/ Start server locally if run directly\r?\nif \(process\.env\.NODE_ENV !== 'production' && !process\.env\.FIREBASE_CONFIG && !process\.env\.FUNCTIONS_EMULATOR\) \{\r?\n\s+app\.listen\(port, \(\) => \{\r?\n\s+console\.log\(`Server running at http:\/\/localhost:\$\{port\}`\);\r?\n\s+\}\);\r?\n\}/g, `// Serve React SPA\napp.get('*', (req, res) => {\n  res.sendFile(path.join(__dirname, '../client/dist/index.html'));\n});\n\n// Prevent automatic binding so main.js can control the port\nif (!process.versions.hasOwnProperty('electron')) {\n  app.listen(port, () => {\n    console.log(\`Standalone server running at http://localhost:\${port}\`);\n  });\n}\n\nexport default app;`);

fs.writeFileSync(serverFile, serverContent);

// 2. Patch dbService.js
let dbFile = path.join(__dirname, 'server/dbService.js');
let dbContent = fs.readFileSync(dbFile, 'utf8');

dbContent = dbContent.replace(/import admin from 'firebase-admin';\r?\n/g, '');
dbContent = dbContent.replace(/\/\/ Determine if we should use Firestore or local SQLite\r?\nlet dbType = process\.env\.DB_TYPE \|\| 'sqlite';\r?\nif \(process\.env\.NODE_ENV === 'production'\) \{\r?\n\s+dbType = 'firestore';\r?\n\}\r?\n\r?\nif \(dbType === 'firestore' && admin\.apps\.length === 0\) \{\r?\n\s+admin\.initializeApp\(\);\r?\n\}\r?\n\r?\nconst firestore = dbType === 'firestore' \? admin\.firestore\(\) : null;/g, `let dbType = 'sqlite'; // Forced local database mode for Electron\nconst firestore = null;`);

fs.writeFileSync(dbFile, dbContent);

// 3. Patch storageService.js
let storageFile = path.join(__dirname, 'server/storageService.js');
let storageContent = fs.readFileSync(storageFile, 'utf8');

storageContent = storageContent.replace(/import admin from 'firebase-admin';\r?\n/g, '');
storageContent = storageContent.replace(/let storageType = process\.env\.STORAGE_TYPE \|\| 'local';\r?\nif \(process\.env\.NODE_ENV === 'production'\) \{\r?\n\s+storageType = 'firebase';\r?\n\}\r?\n\r?\nif \(storageType === 'firebase' && admin\.apps\.length === 0\) \{\r?\n\s+admin\.initializeApp\(\);\r?\n\}\r?\n\r?\nconst bucket = storageType === 'firebase' \? admin\.storage\(\)\.bucket\(\) : null;/g, `let storageType = 'local'; // Forced local storage mode for Electron\nconst bucket = null;`);

fs.writeFileSync(storageFile, storageContent);

console.log("Server patched to remove firebase-admin!");
