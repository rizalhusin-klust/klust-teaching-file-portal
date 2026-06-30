const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

const oldOption = `{c.course_code} - {c.course_name}`;
const newOption = `{c.course_code} - {c.course_name} {c.semester ? \`(\${c.semester})\` : ''}`;

if (content.includes(oldOption)) {
  content = content.replace(oldOption, newOption);
  fs.writeFileSync('client/src/App.tsx', content, 'utf8');
  console.log('Successfully patched dropdown in App.tsx');
} else {
  console.log('Could not find oldOption in App.tsx');
}
