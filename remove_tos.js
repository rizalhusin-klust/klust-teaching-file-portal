const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Remove Table of Specification from tabDefs
c = c.replace(/\s*\{\s*id:\s*'assessments',\s*icon:\s*'.*?',\s*label:\s*'2\.1 Table of Specification'\s*\},\n/, '\n');

// 2. Remove AssessmentSetup from print-all-overlay
c = c.replace(/\s*\{\/\* 2\.1 Table of Specification \*\/\}\s*<PrintSeparator number=\{"2\.1"\} title=\{"Table of Specification"\} \/>\s*<div className="print-all-section">\s*<PrintHeader title="Table of Specification" courseInfo=\{courseInfo\} programName=\{programName\} \/>\s*<AssessmentSetup[\s\S]*?clos=\{clos\}\s*\/>\s*<\/div>/, '');

// 3. Rename the remaining OBE tabs to 2.1, 2.2, 2.3, 2.4, 2.5
c = c.replace(/label: '2\.2 CLO Analysis'/g, "label: '2.1 CLO Analysis'");
c = c.replace(/label: '2\.3 PLO Analysis'/g, "label: '2.2 PLO Analysis'");
c = c.replace(/label: '2\.4 Student CLO'/g, "label: '2.3 Student CLO Breakdown'");
c = c.replace(/label: '2\.5 Student PLO'/g, "label: '2.4 Student PLO Breakdown'");
c = c.replace(/label: '2\.6 CQI Report'/g, "label: '2.5 CQI Report'");

c = c.replace(/number=\{"2\.2"\}/g, 'number={"2.1"}');
c = c.replace(/number=\{"2\.3"\}/g, 'number={"2.2"}');
c = c.replace(/number=\{"2\.4"\}/g, 'number={"2.3"}');
c = c.replace(/number=\{"2\.5"\}/g, 'number={"2.4"}');
c = c.replace(/number=\{"2\.6"\}/g, 'number={"2.5"}');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log("Removed TOS and shifted numbering");
