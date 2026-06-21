const fs = require('fs');
const path = require('path');

const portfolioPath = path.join(__dirname, 'client', 'src', 'components', 'CoursePortfolio.tsx');
let content = fs.readFileSync(portfolioPath, 'utf8');

// 1. Add printMode to props
if (!content.includes('printMode?:')) {
  content = content.replace(
    'type CoursePortfolioProps = {',
    `export type CoursePortfolioProps = {\n  printMode?: 'coursework' | 'exam' | 'misc' | 'all';\n  isPrintMode?: boolean;\n`
  );
  content = content.replace(
    'export default function CoursePortfolio({ courseInfo, onRefresh, API_BASE, activeCourseId, students }: CoursePortfolioProps) {',
    `export default function CoursePortfolio({ courseInfo, onRefresh, API_BASE, activeCourseId, students, printMode = 'all' }: CoursePortfolioProps) {`
  );
}

// 2. Filter SECTION_GROUPS
const oldSectionGroups = `  const SECTION_GROUPS = [
    {
      title: 'Institutional Documents',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'general')
    },
    {
      title: 'Coursework Student Samples – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_best')
    },
    {
      title: 'Coursework Student Samples – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_med')
    },
    {
      title: 'Coursework Student Samples – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_low')
    },
    {
      title: 'Examination Scripts – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_best')
    },
    {
      title: 'Examination Scripts – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_med')
    },
    {
      title: 'Examination Scripts – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_low')
    },
  ];`;

const newSectionGroups = `  let SECTION_GROUPS = [
    {
      id: 'misc',
      title: 'Institutional Documents',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'general')
    },
    {
      id: 'coursework',
      title: 'Coursework Student Samples – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_best')
    },
    {
      id: 'coursework',
      title: 'Coursework Student Samples – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_med')
    },
    {
      id: 'coursework',
      title: 'Coursework Student Samples – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_low')
    },
    {
      id: 'exam',
      title: 'Examination Scripts – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_best')
    },
    {
      id: 'exam',
      title: 'Examination Scripts – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_med')
    },
    {
      id: 'exam',
      title: 'Examination Scripts – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_low')
    },
  ];

  if (printMode && printMode !== 'all') {
    SECTION_GROUPS = SECTION_GROUPS.filter(g => g.id === printMode);
  }`;

content = content.replace(oldSectionGroups, newSectionGroups);

// 3. Update the subtitle dynamically in print mode
const subtitleRegex = /<div className="cover-subtitle".*?>\s*Course Portfolio\s*<\/div>/s;
const newSubtitle = `<div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.3rem', fontWeight: 300, color: '#1e3a8a', margin: '0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {printMode === 'exam' ? 'Examination Script Samples' : printMode === 'coursework' ? 'Coursework Student Samples' : 'Course Portfolio'}
          </div>`;
content = content.replace(subtitleRegex, newSubtitle);

fs.writeFileSync(portfolioPath, content, 'utf8');
console.log("Successfully patched CoursePortfolio.tsx cleanly.");
