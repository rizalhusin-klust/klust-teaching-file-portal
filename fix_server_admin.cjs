const fs = require('fs');
const path = require('path');
let file = path.join(__dirname, 'server/server.js');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/import admin from 'firebase-admin';\r?\n/g, '');

fs.writeFileSync(file, content);
console.log("Removed firebase-admin from server.js");
