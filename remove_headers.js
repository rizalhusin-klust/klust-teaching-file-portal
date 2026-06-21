const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

c = c.replace(/<PrintHeader title="Teaching Plan" courseInfo=\{courseInfo\} programName=\{programName\} \/>/, '');
c = c.replace(/<PrintHeader title="Examination Script Samples Portfolio" courseInfo=\{courseInfo\} programName=\{programName\} \/>/, '');
c = c.replace(/<PrintHeader title="Coursework Student Samples Portfolio" courseInfo=\{courseInfo\} programName=\{programName\} \/>/, '');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Removed double headers');
