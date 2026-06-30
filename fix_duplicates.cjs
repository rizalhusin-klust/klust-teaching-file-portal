const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// Remove original JWT Login import
content = content.replace(/import Login from '\.\/components\/Login';\r?\n/, '');

// Remove original JWT token state
content = content.replace(/const \[token, setToken\] = useState<string \| null>\(localStorage\.getItem\('token'\)\);\r?\n/, '');

// Remove original handleLogout function
content = content.replace(/const handleLogout = \(\) => \{\r?\n\s+localStorage\.removeItem\('token'\);\r?\n\s+setToken\(null\);\r?\n\s+\};\r?\n/, '');

// Remove the original JWT Login render block
content = content.replace(/if \(!token\) \{\r?\n\s+return <Login onLogin=\{\(t\) => \{\r?\n\s+localStorage\.setItem\('token', t\);\r?\n\s+setToken\(t\);\r?\n\s+\}\} API_BASE=\{API_BASE\} \/>;\r?\n\s+\}\r?\n/, '');

fs.writeFileSync(file, content);
console.log("App.tsx cleaned up duplicates");
