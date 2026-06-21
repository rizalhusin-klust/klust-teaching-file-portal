const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const startIndex = c.indexOf('const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);');
const endIndex = c.indexOf("const panelsHtml = panels.join('\\n');") + 38;

const before = c.substring(0, startIndex);
const after = c.substring(endIndex);

const newCode = `const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);
      const panels: string[] = [];

      for (let i = 0; i < tabDefs.length; i++) {
        const html = sectionHtmls[i] || '<div style="padding: 20px;">Section not found.</div>';
        panels.push(
          \`<section id="panel-\${i}" class="panel\${i === 0 ? ' active' : ''}">
            <div class="panel-inner">\${html}</div>
          </section>\`
        );
      }

      const panelsHtml = panels.join('\\n');`;

fs.writeFileSync('client/src/App.tsx', before + newCode + after, 'utf8');
console.log('Replaced successfully');
