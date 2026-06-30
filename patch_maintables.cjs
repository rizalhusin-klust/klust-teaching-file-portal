const fs = require('fs');

let content = fs.readFileSync('client/src/components/MainTables.tsx', 'utf8');

// 1. Add state variables
content = content.replace(
  "const [courseName, setCourseName] = useState('');",
  "const [courseName, setCourseName] = useState('');\n  const [programName, setProgramName] = useState('');\n  const [programAbb, setProgramAbb] = useState('');"
);

// 2. Set state when course changes
content = content.replace(
  "setCourseName(courseInfo.course_name || '');",
  "setCourseName(courseInfo.course_name || '');\n        setProgramName(courseInfo.program_name || '');\n        setProgramAbb(courseInfo.program_abb || '');"
);

// 3. Reset state
content = content.replace(
  "setCourseName('');\n      setCreditHours(2.0);",
  "setCourseName('');\n      setProgramName('');\n      setProgramAbb('');\n      setCreditHours(2.0);"
);

// 4. Update fetch payload
content = content.replace(
  "course_name: courseName,\n          credit_hours: creditHours,",
  "course_name: courseName,\n          program_name: programName,\n          program_abb: programAbb,\n          credit_hours: creditHours,"
);

// 5. Add to JSX form
const oldForm = `<div className="form-group">
                      <label>Course Name *</label>
                      <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required placeholder="e.g. COMPUTER ANIMATION" />
                    </div>
                    <div className="form-group">
                      <label>Credit Hours *</label>`;

const newForm = `<div className="form-group">
                      <label>Course Name *</label>
                      <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required placeholder="e.g. COMPUTER ANIMATION" />
                    </div>
                    <div className="form-group">
                      <label>Program Name</label>
                      <input type="text" value={programName} onChange={e => setProgramName(e.target.value)} placeholder="e.g. Bachelor of Architecture" />
                    </div>
                    <div className="form-group">
                      <label>Program Abbreviation</label>
                      <input type="text" value={programAbb} onChange={e => setProgramAbb(e.target.value)} placeholder="e.g. B.Arch" />
                    </div>
                    <div className="form-group">
                      <label>Credit Hours *</label>`;

content = content.replace(oldForm, newForm);

fs.writeFileSync('client/src/components/MainTables.tsx', content);
console.log('MainTables.tsx patched successfully.');
