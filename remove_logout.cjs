const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// remove duplicate handleLogout
content = content.replace(/const handleLogout = \(\) => \{\s*localStorage\.removeItem\('token'\);\s*setToken\(null\);(?:\s*setActiveCourseId\(null\);)?\s*\};/g, "");

// remove duplicate Login import
let parts = content.split("import Login from './components/Login';");
if (parts.length > 2) {
   content = parts.slice(0, 2).join("import Login from './components/Login';") + parts.slice(2).join("");
}

fs.writeFileSync('client/src/App.tsx', content, 'utf8');
