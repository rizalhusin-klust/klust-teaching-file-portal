const fs = require('fs');
const file = 'package.json';
let pkg = JSON.parse(fs.readFileSync(file, 'utf8'));

pkg.main = "main.js";
pkg.type = "module";
pkg.scripts = {
    ...pkg.scripts,
    "start": "electron .",
    "dev": "concurrently \"npm run server\" \"npm run client\"",
    "build:client": "cd client && npm run build",
    "build": "npm run build:client && electron-builder"
};

pkg.build = {
    "appId": "com.coursemanager.app",
    "productName": "Course Manager",
    "directories": {
      "output": "dist"
    },
    "files": [
      "main.js",
      "server/**/*",
      "client/dist/**/*",
      "package.json"
    ],
    "win": {
      "target": "nsis"
    }
};

fs.writeFileSync(file, JSON.stringify(pkg, null, 2));
console.log("Updated package.json");
