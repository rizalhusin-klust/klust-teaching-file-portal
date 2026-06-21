const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

const regex = /\/\/ Build section panels HTML[\s\S]*?const panelsHtml = panels\.join\('\\n'\);/;
const replacement = \// Build section panels HTML
      const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);
      const panels: string[] = [];

      for (let i = 0; i < tabDefs.length; i++) {
        const html = sectionHtmls[i] || '<div style="padding: 20px;">Section not found.</div>';
        panels.push(
          \\<section id="panel-\\\" class="panel\\\">
            <div class="panel-inner">\\\</div>
          </section>\\
        );
      }
      
      const panelsHtml = panels.join('\\n');\;

c = c.replace(regex, replacement);
fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log("Fixed handleExportHtml panels");
