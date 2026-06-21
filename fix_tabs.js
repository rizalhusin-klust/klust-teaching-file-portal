const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Insert 2.0 Table of Specification back into tabDefs
const insertPoint = c.indexOf("{ id: 'clo', icon: 'dY\",', label: '2.1 CLO Analysis' },");
if (insertPoint !== -1) {
    const before = c.substring(0, insertPoint);
    const after = c.substring(insertPoint);
    c = before + "{ id: 'assessments', icon: 'dY\",', label: '2.0 Table of Specification' },\n        " + after;
} else {
    // maybe it has the 📄 icon
    const insertPoint2 = c.indexOf("{ id: 'clo', icon: '📄', label: '2.1 CLO Analysis' },");
    if (insertPoint2 !== -1) {
        const before = c.substring(0, insertPoint2);
        const after = c.substring(insertPoint2);
        c = before + "{ id: 'assessments', icon: '📄', label: '2.0 Table of Specification' },\n        " + after;
    }
}

// 2. Fix the PrintSeparator number in print-all-overlay for Table of Specification
c = c.replace(/\{\/\* 2\.1 Table of Specification \*\/\}\s*<PrintSeparator number=\{"2\.1"\} title=\{"Table of Specification"\} \/>/, '{/* 2.0 Table of Specification */}\n        <PrintSeparator number={"2.0"} title={"Table of Specification"} />');

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log("Fixed tabDefs and PrintSeparator for TOS");
