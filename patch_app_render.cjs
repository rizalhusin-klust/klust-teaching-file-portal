const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

const returnRegex = /return \(\r?\n\s+<>\r?\n\s+<div className="app-container">/g;
content = content.replace(returnRegex, `if (!token) {\n    return <Login />;\n  }\n\n  return (\n      <>\n        <div className="app-container">`);

fs.writeFileSync(file, content);
console.log("Patched App.tsx render block");
