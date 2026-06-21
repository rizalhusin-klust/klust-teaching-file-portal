const fs = require('fs');
const path = require('path');

const appPath = path.join(__dirname, 'client', 'src', 'App.tsx');
let content = fs.readFileSync(appPath, 'utf8');

// 1. Rename the class in PrintSeparator
content = content.replace(
  `const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\n  <div className="print-all-section"`,
  `const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (\n  <div className="print-separator-section"`
);

// 2. Add .print-separator-section to CSS
if (!content.includes('.print-separator-section {')) {
  content = content.replace(
    `.print-all-section {`,
    `.print-separator-section {\n              page-break-after: always;\n              break-after: page;\n              background: white !important;\n              color: black !important;\n            }\n            .print-all-section {`
  );
}

// 3. Replace the handleExportHtml logic (tabDefs and panels)
const exportHtmlRegex = /const tabDefs = \[[^\]]+\];[\s\S]+?(?=\/\/\s*Panel 0:)/;
const replacementExportVars = `
      const tabDefs = [
        { icon: 'dY"S', label: 'Cover Page' },
        { icon: 'dY"^', label: '1. Details of Students\\' Results' },
        { icon: 'dYZ_', label: '2. OBE Assessment' },
        { icon: 'dY"-', label: '3. Course Syllabus' },
        { icon: 'dY"<', label: '4. Teaching Plan' },
        { icon: 'dY-",?', label: '5. Time-Table of Lecturer' },
        { icon: 'dY".', label: '6. Student Monthly Attendance' },
        { icon: 'dY"?', label: '7. Report by Lecturer' },
        { icon: 'dY"-', label: '8. Teaching Materials' },
        { icon: 'dY",', label: '9. Moderated Final Exam' },
        { icon: 'dY",', label: '10. Final Exam Scripts' },
        { icon: 'dY"`', label: '11. Coursework & Marking' },
        { icon: 'dY"`', label: '12. Samples of Coursework' },
        { icon: 'dY",', label: '13. Miscellaneous Records' }
      ];

      const courseCode = courseInfo?.course_code || 'COURSE';
      const courseName = courseInfo?.course_name || '';
      const semester   = courseInfo?.semester || '';
      const lecturer   = courseInfo?.lecturer || '';

      // Build tab nav HTML
      const tabNavHtml = tabDefs.map((t, i) =>
        \`<button class="tab-btn\${i === 0 ? ' active' : ''}" onclick="showTab(\${i})" title="\${t.label}">
          <span class="tab-icon">\${t.icon}</span>
          <span class="tab-label">\${t.label}</span>
        </button>\`
      ).join('\\n');

      const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);
      const panels: string[] = [];

      `;

content = content.replace(exportHtmlRegex, replacementExportVars);

// Replace the panels.push logic
const panelsPushRegex = /\/\/\s*Panel 0: Cover Page \(sectionHtmls\[0\]\)[\s\S]+?(?=const htmlContent =)/;

const replacementPanels = `
      // Panel 0: Cover
      panels.push(\`<section id="panel-0" class="panel active"><div class="panel-inner">\${sectionHtmls[0]}</div></section>\`);

      // Panel 1: Details of Students' Results
      const lmsPanelContent = fullPdfUrl
        ? \`<iframe class="export-only" src="\${fullPdfUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Detail of Student Result (LMS)"></iframe>
           <div class="print-link-only" style="margin-top: 20px;">dY", <strong>Detail of Student Result (LMS):</strong> <a href="\${fullPdfUrl}" style="color: blue; text-decoration: underline;">\${fullPdfUrl}</a></div>\`
        : \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
            <div style="font-size:4rem;margin-bottom:16px;">dY",</div>
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
           <div class="print-link-only" style="margin-top: 20px;">dY", <strong>Syllabus Outline PDF:</strong> <a href="\${fullSyllabusPdfUrl}" style="color: blue; text-decoration: underline;">\${fullSyllabusPdfUrl}</a></div>\`
        : \`<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
            <div style="font-size:4rem;margin-bottom:16px;">dY",</div>
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

      // Panel 9: Moderated Final Exam with Marking Scheme
      panels.push(\`<section id="panel-9" class="panel"><div class="panel-inner">\${sectionHtmls[9] || ''}</div></section>\`);

      // Panel 10: Final Exam Scripts
      panels.push(\`<section id="panel-10" class="panel"><div class="panel-inner" style="padding:40px;text-align:center;"><h3>10. Final Exam Scripts</h3><p>Ensure these are uploaded inside Course Portfolio.</p></div></section>\`);

      // Panel 11: Coursework with Marking Schemes
      panels.push(\`<section id="panel-11" class="panel"><div class="panel-inner">\${sectionHtmls[10] || ''}</div></section>\`);

      // Panel 12: Samples of Student Coursework
      panels.push(\`<section id="panel-12" class="panel"><div class="panel-inner" style="padding:40px;text-align:center;"><h3>12. Samples of Student Coursework</h3><p>Ensure these are uploaded inside Course Portfolio.</p></div></section>\`);

      // Panel 13: Miscellaneous Records
      panels.push(\`<section id="panel-13" class="panel"><div class="panel-inner">\${sectionHtmls[11] || ''}</div></section>\`);

      `;

content = content.replace(panelsPushRegex, replacementPanels);

fs.writeFileSync(appPath, content, 'utf8');
console.log('App.tsx patched successfully for correct export HTML mapping!');
