const fs = require('fs');
let appTsx = fs.readFileSync('client/src/App.tsx', 'utf8');

let printOverlayMatch = appTsx.match(/className="print-all-overlay"[\s\S]*?(?=<\/div>\s*<\/React.Fragment>|<\/div>\s*<\/>)/);
if (!printOverlayMatch) {
  console.log("Could not find print-all-overlay");
  process.exit(1);
}

let overlayContent = printOverlayMatch[0];
let sectionMatches = overlayContent.match(/className="print-all-section"/g);
console.log("Total print-all-section divs in overlay:", sectionMatches ? sectionMatches.length : 0);

let tabDefsMatch = appTsx.match(/const tabDefs = \[\s*\{[\s\S]*?\}\s*\];/);
if (!tabDefsMatch) {
  console.log("Could not find tabDefs");
  process.exit(1);
}
let tabDefsStr = tabDefsMatch[0];
let tabCount = (tabDefsStr.match(/\{ id:/g) || []).length;
console.log("Total tabs in tabDefs:", tabCount);

let tabLabels = [];
let labelRegex = /label:\s*'([^']+)'/g;
let match;
while ((match = labelRegex.exec(tabDefsStr)) !== null) {
  tabLabels.push(match[1]);
}

console.log("Tab Labels:");
tabLabels.forEach((l, i) => console.log(i + ": " + l));

// Extract what is inside each print-all-section roughly
let sectionContents = overlayContent.split(/<div className="print-all-section">/);
sectionContents.shift(); // remove everything before the first section
console.log("\nSections mapped:");
sectionContents.forEach((sec, i) => {
  let firstTag = sec.trim().split('\n')[0].trim();
  console.log(i + ": " + tabLabels[i] + " -> " + firstTag);
});
