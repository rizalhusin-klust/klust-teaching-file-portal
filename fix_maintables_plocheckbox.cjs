const fs = require('fs');
let content = fs.readFileSync('client/src/components/MainTables.tsx', 'utf8');

// The handleSavePlo function
content = content.replace(
  'const handleSavePlo = async (e: React.FormEvent, ploNo?: string, ploDesc?: string) => {',
  'const handleSavePlo = async (e: React.FormEvent, ploNo?: string, ploDesc?: string, isActive?: boolean) => {'
);

content = content.replace(
  'body: JSON.stringify({ plo_no: targetNo.trim(), description: targetDesc.trim(), course_id: activeCourseId })',
  'body: JSON.stringify({ plo_no: targetNo.trim(), description: targetDesc.trim(), is_active: isActive !== undefined ? isActive : true, course_id: activeCourseId })'
);

// Add checkbox column header
content = content.replace(
  '<th style={{ width: \'120px\' }}>PLO Code</th>',
  '<th style={{ width: \'60px\', textAlign: \'center\' }}>Active</th>\n                      <th style={{ width: \'120px\' }}>PLO Code</th>'
);

// Add checkbox cell
content = content.replace(
  '<td style={{ fontWeight: \'bold\' }}>{p.plo_no}</td>',
  '<td style={{ textAlign: \'center\' }}>\n                          <input type="checkbox" checked={p.is_active !== 0} onChange={e => handleSavePlo(e as any, p.plo_no, p.description, e.target.checked)} style={{ cursor: \'pointer\' }} />\n                        </td>\n                        <td style={{ fontWeight: \'bold\' }}>{p.plo_no}</td>'
);

content = content.replace(
  '<td colSpan={3} style={{ textAlign: \'center\', color: \'var(--text-muted)\' }}>No PLOs configured yet.</td>',
  '<td colSpan={4} style={{ textAlign: \'center\', color: \'var(--text-muted)\' }}>No PLOs configured yet.</td>'
);

fs.writeFileSync('client/src/components/MainTables.tsx', content);
console.log("Updated MainTables.tsx PLO checkboxes!");
