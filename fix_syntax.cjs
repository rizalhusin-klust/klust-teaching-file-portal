const fs = require('fs');
let content = fs.readFileSync('server/server.js', 'utf8');

// The lingering code is from "  }\n  const token" to "});\n"
content = content.replace(/  }\r?\n  const token = authHeader\.split\(' '\)\[1\];\r?\n  try \{\r?\n    jwt\.verify\(token, JWT_SECRET\);\r?\n    next\(\);\r?\n  \} catch \(err\) \{\r?\n    return res\.status\(403\)\.json\(\{ error: 'Forbidden: Invalid or expired token' \}\);\r?\n  \}\r?\n\}\);\r?\n/g, '');

fs.writeFileSync('server/server.js', content);
console.log("Fixed dangling code!");
