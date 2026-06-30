const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// The zip download filename
content = content.replace(
  'a.download = `${courseCode}_portfolio.zip`;',
  'const programAbb = courseInfo?.program_abb || \'PROG\';\n      const semesterClean = semester.replace(/\\//g, \'-\');\n      a.download = `${programAbb} ${courseCode} ${courseName} ${semesterClean}.zip`;'
);

fs.writeFileSync('client/src/App.tsx', content);
console.log("Updated App.tsx zip export filename!");
