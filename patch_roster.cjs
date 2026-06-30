const fs = require('fs');
let content = fs.readFileSync('client/src/components/Roster.tsx', 'utf8');

// remove headers
content = content.replace(/<th style={{ width: '18%' }}>Email<\/th>\r?\n\s*<th className="no-print" style={{ width: '14%' }}>HP No<\/th>/g, "");

// remove cells
content = content.replace(/<td>\{student\.email \|\| <span[^>]*>no email<\/span>\}<\/td>\r?\n\s*<td className="no-print">\{student\.hp_no \|\| <span[^>]*>no number<\/span>\}<\/td>/g, "");

fs.writeFileSync('client/src/components/Roster.tsx', content, 'utf8');
console.log('Roster.tsx patched');
