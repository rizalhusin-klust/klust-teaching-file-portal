const fs = require('fs');
let content = fs.readFileSync('client/src/components/MainTables.tsx', 'utf8');

content = content.replace(
  'const [courseName, setCourseName] = useState(\'\');',
  'const [courseName, setCourseName] = useState(\'\');\n  const [programName, setProgramName] = useState(\'\');\n  const [programAbb, setProgramAbb] = useState(\'\');'
);

content = content.replace(
  'setCourseName(courseInfo.course_name || \'\');',
  'setCourseName(courseInfo.course_name || \'\');\n        setProgramName(courseInfo.program_name || \'\');\n        setProgramAbb(courseInfo.program_abb || \'\');'
);

content = content.replace(
  'course_code: courseCode,\n            course_name: courseName,\n            credit_hours: creditHours,',
  'course_code: courseCode,\n            course_name: courseName,\n            program_name: programName,\n            program_abb: programAbb,\n            credit_hours: creditHours,'
);

// Add inputs to the form
content = content.replace(
  '<div className="form-group">\n                    <label>Course Name *</label>\n                    <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required />\n                  </div>',
  '<div className="form-group">\n                    <label>Course Name *</label>\n                    <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required />\n                  </div>\n                  <div className="form-group">\n                    <label>Program Name</label>\n                    <input type="text" value={programName} onChange={e => setProgramName(e.target.value)} placeholder="e.g. Bachelor of Architecture" />\n                  </div>\n                  <div className="form-group">\n                    <label>Program Abbreviation</label>\n                    <input type="text" value={programAbb} onChange={e => setProgramAbb(e.target.value)} placeholder="e.g. B.Arch" />\n                  </div>'
);

// Also reset form
content = content.replace(
  'setCourseName(\'\');',
  'setCourseName(\'\');\n      setProgramName(\'\');\n      setProgramAbb(\'\');'
);

fs.writeFileSync('client/src/components/MainTables.tsx', content);
console.log("Updated MainTables.tsx state!");
