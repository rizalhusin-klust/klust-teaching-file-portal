const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const lines = c.split('\n');
const newLines = [];
let skip = false;

for (let i = 0; i < lines.length; i++) {
  const line = lines[i];
  if (line.includes('const fullPdfUrl =')) continue;
  if (line.includes('const fullTimetableUrl =')) continue;
  if (line.includes('const fullAttendancePdfUrls =')) continue;
  
  if (line.includes('const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);')) {
    skip = true;
    newLines.push(`      const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);
      const panels: string[] = [];

      for (let i = 0; i < tabDefs.length; i++) {
        const html = sectionHtmls[i] || '<div style="padding: 20px;">Section not found.</div>';
        panels.push(
          \`<section id="panel-\${i}" class="panel\${i === 0 ? ' active' : ''}">
            <div class="panel-inner">\${html}</div>
          </section>\`
        );
      }

      const panelsHtml = panels.join('\\n');`);
    continue;
  }
  
  if (skip) {
    if (line.includes("const panelsHtml = panels.join('\\n');")) {
      skip = false;
    }
    continue;
  }
  
  newLines.push(line);
}

fs.writeFileSync('client/src/App.tsx', newLines.join('\n'), 'utf8');
console.log('Fixed export html completely!');
