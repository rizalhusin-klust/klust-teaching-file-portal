const fs = require('fs');
let content = fs.readFileSync('client/src/components/TeachingPlan.tsx', 'utf8');

const pasteHandler = `  const handlePasteSyllabus = async (idx: number, e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const text = e.clipboardData.getData('Text');
    if (text.includes('\n')) {
      e.preventDefault();
      const lines = text.split(/\r?\n/);
      
      setLocalReports(prev => {
        const next = [...prev];
        let offset = 0;
        for (let i = 0; i < lines.length && (idx + offset) < next.length; i++) {
          const line = lines[i];
          if (i === lines.length - 1 && line.trim() === '') continue; // Skip empty trailing line
          next[idx + offset] = { ...next[idx + offset], syllabus_topic: line };
          offset++;
        }
        return next;
      });

      // Background save for all pasted rows
      setTimeout(async () => {
        let offset = 0;
        for (let i = 0; i < lines.length && (idx + offset) < localReports.length; i++) {
          const line = lines[i];
          if (i === lines.length - 1 && line.trim() === '') continue;
          
          const row = localReports[idx + offset];
          if (row && activeCourseId) {
             try {
                await fetch(\`\${API_BASE}/reports\`, {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({
                    ...row,
                    syllabus_topic: line,
                    topics: row.topics || '',
                    remarks: row.remarks || 'as planned',
                    course_id: activeCourseId,
                    original_week_no: row.week_no
                  })
                });
             } catch(err) {}
          }
          offset++;
        }
        onRefresh();
      }, 500);
    }
  };

  const getProgramName = () => {`;

content = content.replace("  const getProgramName = () => {", pasteHandler);

const textarea = `<textarea
                        value={w.syllabus_topic || ''}
                        onChange={e => handleInlineChange(idx, 'syllabus_topic', e.target.value)}
                        onBlur={() => handleInlineBlur(idx)}
                        onPaste={e => handlePasteSyllabus(idx, e)}
                        className="inline-textarea"
                        placeholder="Planned syllabus topic details... (You can paste multiple rows here)"
                      />`;

content = content.replace(/<textarea[\s\S]*?value=\{w\.syllabus_topic \|\| ''\}[\s\S]*?onChange=\{e => handleInlineChange\(idx, 'syllabus_topic', e\.target\.value\)\}[\s\S]*?onBlur=\{\(\) => handleInlineBlur\(idx\)\}[\s\S]*?className="inline-textarea"[\s\S]*?placeholder="Planned syllabus topic details\.\.\."\s*\/>/g, textarea);

fs.writeFileSync('client/src/components/TeachingPlan.tsx', content, 'utf8');
console.log('TeachingPlan patched!');
