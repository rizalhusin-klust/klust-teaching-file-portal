const fs = require('fs');
const lines = fs.readFileSync('client/src/App.tsx', 'utf8').split('\n');
let start = -1;
let end = -1;
for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);') && start === -1) {
    start = i + 1;
  }
  if (lines[i].includes('const panelsHtml = panels.join(\'\\n\');') && end === -1) {
    end = i + 1;
  }
}
console.log('Start: ' + start + ', End: ' + end);
