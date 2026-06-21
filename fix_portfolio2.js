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
    `export default function CoursePortfolio({ courseInfo, onRefresh, API_BASE, activeCourseId, students, printMode = 'all', isPrintMode = false }: CoursePortfolioProps) {`
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

// 3. Conditionally render sections in screen mode
const screenRegex = /\{\/\* General Documents Section \*\/\}.*?Low Examination Scripts \(3 items\)'\)\}\n\s*<\/div>/s;
const newScreenLayout = `{/* General Documents Section */}
        {(printMode === 'all' || printMode === 'misc') && (
          <div style={{ display: isPrintMode ? 'none' : 'block' }}>
            {renderGroupSection('general', 'Institutional Documents')}
          </div>
        )}

        {/* Coursework Samples Section */}
        {(printMode === 'all' || printMode === 'coursework') && (
          <div className="view-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Coursework Student Samples Portfolio</h2>
            {!isPrintMode && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Provide folders or scripts containing 3 Best, 3 Medium, and 3 Low student coursework outcomes.
              </p>
            )}
            {renderGroupSection('cw_best', 'Best CW Samples (3 items)')}
            {renderGroupSection('cw_med', 'Medium CW Samples (3 items)')}
            {renderGroupSection('cw_low', 'Low CW Samples (3 items)')}
          </div>
        )}

        {/* Exam Script Samples Section */}
        {(printMode === 'all' || printMode === 'exam') && (
          <div className="view-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Examination Script Samples Portfolio</h2>
            {!isPrintMode && (
              <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                Provide folders or scripts containing 3 Best, 3 Medium, and 3 Low student examination sheets.
              </p>
            )}
            {renderGroupSection('exam_best', 'Best Examination Scripts (3 items)')}
            {renderGroupSection('exam_med', 'Medium Examination Scripts (3 items)')}
            {renderGroupSection('exam_low', 'Low Examination Scripts (3 items)')}
          </div>
        )}`;

content = content.replace(screenRegex, newScreenLayout);

// 4. Update the subtitle dynamically in print mode
const subtitleRegex = /<div className="cover-subtitle".*?>\s*Course Portfolio\s*<\/div>/s;
const newSubtitle = `<div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.3rem', fontWeight: 300, color: '#1e3a8a', margin: '0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {printMode === 'exam' ? 'Examination Script Samples' : printMode === 'coursework' ? 'Coursework Student Samples' : 'Course Portfolio'}
          </div>`;
content = content.replace(subtitleRegex, newSubtitle);

fs.writeFileSync(portfolioPath, content, 'utf8');
console.log("Successfully patched CoursePortfolio.tsx");
