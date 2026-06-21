const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Rename PrintSeparator class
content = content.replace(
  'const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\n  <div className="print-all-section"',
  'const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\n  <div className="print-separator-section"'
);
content = content.replace(
  'const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\r\n  <div className="print-all-section"',
  'const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\r\n  <div className="print-separator-section"'
);

// 2. Add .print-separator-section CSS
if (!content.includes('.print-separator-section {')) {
  content = content.replace(
    '.print-all-section {',
    '.print-separator-section { page-break-after: always; break-after: page; background: white !important; color: black !important; padding: 0.5in 0.5in 0.3in 0.5in; }\n            .print-all-section {'
  );
}

// 3. Replace tabDefs
const oldTabDefsStart = "const tabDefs = [";
const oldTabDefsEnd = "];\r\n\r\n    const courseCode"; // Note: CRLF
const oldTabDefsEnd2 = "];\n\n    const courseCode";

const newTabDefs = `const tabDefs = [
      { icon: '📄', label: 'Cover Page' },
      { icon: '📄', label: '1. Details of Students\\' Results' },
      { icon: '📄', label: '2. OBE Assessment' },
      { icon: '📄', label: '3. Course Syllabus' },
      { icon: '📄', label: '4. Teaching Plan' },
      { icon: '📄', label: '5. Time-Table of Lecturer' },
      { icon: '📄', label: '6. Student Monthly Attendance' },
      { icon: '📄', label: '7. Report by Lecturer' },
      { icon: '📄', label: '8. Teaching Materials' },
      { icon: '📄', label: '9. Moderated Final Exam' },
      { icon: '📄', label: '10. Final Exam Scripts' },
      { icon: '📄', label: '11. Coursework & Marking' },
      { icon: '📄', label: '12. Samples of Coursework' },
      { icon: '📄', label: '13. Miscellaneous Records' }
    ];

    const courseCode`;

const startIdx = content.indexOf(oldTabDefsStart);
let endIdx = content.indexOf(oldTabDefsEnd);
if (endIdx === -1) endIdx = content.indexOf(oldTabDefsEnd2);

if (startIdx !== -1 && endIdx !== -1) {
  content = content.substring(0, startIdx) + newTabDefs + content.substring(endIdx + oldTabDefsEnd.length);
}

// 4. Replace panels.push logic
const startPanelsStr = "// Panel 0: Cover Page (sectionHtmls[0])";
const endPanelsStr = "const htmlContent = `";

const newPanels = `// Panel 0: Cover Page
    panels.push(\`<section id="panel-0" class="panel active"><div class="panel-inner">\${sectionHtmls[0] || ''}</div></section>\`);

    // Panel 1: Details of Students' Results
    const lmsPanelContent = fullPdfUrl
      ? \`<iframe class="export-only" src="\${fullPdfUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Detail of Student Result (LMS)"></iframe>
         <div class="print-link-only" style="margin-top: 20px;">📄 <strong>Detail of Student Result (LMS):</strong> <a href="\${fullPdfUrl}" style="color: blue; text-decoration: underline;">\${fullPdfUrl}</a></div>\`
      : \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
          <div style="font-size:4rem;margin-bottom:16px;">📄</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Result PDF Uploaded</h2>
          <p style="font-size:0.95rem;color:#64748b;max-width:400px;line-height:1.5;">The LMS Student Result Detail PDF has not been uploaded yet.</p>
        </div>\`;
    panels.push(\`<section id="panel-1" class="panel">
      <div class="panel-inner" style="padding:16px;box-sizing:border-box;background:#f8fafc !important;">
        \${lmsPanelContent}
        <div style="margin-top:20px;">\${sectionHtmls[1] || ''}</div>
      </div>
    </section>\`);

    // Panel 2: OBE Assessment
    panels.push(\`<section id="panel-2" class="panel"><div class="panel-inner">\${sectionHtmls[2] || ''}</div></section>\`);

    // Panel 3: Course Syllabus
    const fullSyllabusPdfUrl = courseInfo?.table4_path ? \`\${serverUrl}\${courseInfo.table4_path}\` : '';
    const syllabusPanelContent = fullSyllabusPdfUrl
      ? \`<iframe class="export-only" src="\${fullSyllabusPdfUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Table 4 (Syllabus Outline PDF Document)"></iframe>
         <div class="print-link-only" style="margin-top: 20px;">📄 <strong>Syllabus Outline PDF:</strong> <a href="\${fullSyllabusPdfUrl}" style="color: blue; text-decoration: underline;">\${fullSyllabusPdfUrl}</a></div>\`
      : \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
          <div style="font-size:4rem;margin-bottom:16px;">📄</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Syllabus Outline PDF Uploaded</h2>
        </div>\`;
    panels.push(\`<section id="panel-3" class="panel"><div class="panel-inner" style="padding:16px;height:100%;box-sizing:border-box;background:#f8fafc !important;">\${syllabusPanelContent}</div></section>\`);

    // Panel 4: Teaching Plan
    panels.push(\`<section id="panel-4" class="panel"><div class="panel-inner">\${sectionHtmls[4] || ''}</div></section>\`);

    // Panel 5: Time-Table of Lecturer
    const timetablePanelContent = fullTimetableUrl
      ? \`<iframe class="export-only" src="\${fullTimetableUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Timetable of Lecturer"></iframe>\`
      : \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;"><h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Timetable Uploaded</h2></div>\`;
    panels.push(\`<section id="panel-5" class="panel"><div class="panel-inner" style="padding:16px;height:100%;box-sizing:border-box;background:#f8fafc !important;">\${timetablePanelContent}</div></section>\`);

    // Panel 6: Student Monthly Attendance
    panels.push(\`<section id="panel-6" class="panel"><div class="panel-inner">\${sectionHtmls[6] || ''}</div></section>\`);

    // Panel 7: Report by Lecturer
    panels.push(\`<section id="panel-7" class="panel"><div class="panel-inner">\${sectionHtmls[7] || ''}</div></section>\`);

    // Panel 8: Teaching Materials
    panels.push(\`<section id="panel-8" class="panel"><div class="panel-inner">\${sectionHtmls[8] || ''}</div></section>\`);

    // Panel 9: Moderated Final Exam
    panels.push(\`<section id="panel-9" class="panel"><div class="panel-inner">\${sectionHtmls[9] || ''}</div></section>\`);

    // Panel 10: Final Exam Scripts
    panels.push(\`<section id="panel-10" class="panel"><div class="panel-inner" style="padding:40px;text-align:center;"><h3>10. Final Exam Scripts</h3><p>Ensure these are uploaded inside Course Portfolio.</p></div></section>\`);

    // Panel 11: Coursework with Marking Schemes
    panels.push(\`<section id="panel-11" class="panel"><div class="panel-inner">\${sectionHtmls[10] || ''}</div></section>\`);

    // Panel 12: Samples of Student Coursework
    panels.push(\`<section id="panel-12" class="panel"><div class="panel-inner" style="padding:40px;text-align:center;"><h3>12. Samples of Student Coursework</h3><p>Ensure these are uploaded inside Course Portfolio.</p></div></section>\`);

    // Panel 13: Miscellaneous Records
    panels.push(\`<section id="panel-13" class="panel"><div class="panel-inner">\${sectionHtmls[11] || ''}</div></section>\`);

    const htmlContent = \`\`;

const startIdxPanels = content.indexOf(startPanelsStr);
const endIdxPanels = content.indexOf(endPanelsStr);

if (startIdxPanels !== -1 && endIdxPanels !== -1) {
  content = content.substring(0, startIdxPanels) + newPanels + content.substring(endIdxPanels + endPanelsStr.length);
}

fs.writeFileSync(appPath, content, 'utf8');
console.log('Successfully patched App.tsx!');
