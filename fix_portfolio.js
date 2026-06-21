const fs = require('fs');
let c = fs.readFileSync('client/src/components/CoursePortfolio.tsx', 'utf8');

const regex = /\{SECTION_GROUPS\.map\(grp => \(/g;
const replacement = `{SECTION_GROUPS.filter(grp => {
          if (printMode === 'all') return true;
          if (printMode === 'exam' && grp.keys[0]?.group.startsWith('exam')) return true;
          if (printMode === 'coursework' && grp.keys[0]?.group.startsWith('cw')) return true;
          if (printMode === 'misc' && grp.keys[0]?.group === 'general') return true;
          return false;
        }).map(grp => (`;

c = c.replace(regex, replacement);

fs.writeFileSync('client/src/components/CoursePortfolio.tsx', c, 'utf8');
console.log('Fixed CoursePortfolio SECTION_GROUPS filtering');
