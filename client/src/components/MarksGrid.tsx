import { useState, useEffect } from 'react';
import type { Student, Assessment, OptionalGroup, MarkRecord } from '../App';

type MarksGridProps = {
  students: Student[];
  assessments: Assessment[];
  optionalGroups: OptionalGroup[];
  marks: MarkRecord[];
  gradesData: any[];
  onUpdateMark: (matricId: string, assessmentId: number, rawMark: number | null) => void;
};

export default function MarksGrid({ students, assessments, marks, gradesData, onUpdateMark }: MarksGridProps) {
  const [localMarks, setLocalMarks] = useState<{ [key: string]: string }>({});
  
  // Set local marks from database records on load
  useEffect(() => {
    const markMap: { [key: string]: string } = {};
    marks.forEach(m => {
      markMap[`${m.student_matric_id}_${m.assessment_id}`] = m.raw_mark !== null ? String(m.raw_mark) : '';
    });
    setLocalMarks(markMap);
  }, [marks]);

  const handleInputChange = (matricId: string, assessmentId: number, val: string) => {
    setLocalMarks(prev => ({
      ...prev,
      [`${matricId}_${assessmentId}`]: val
    }));
  };

  const handleBlur = (matricId: string, assessmentId: number, maxMark: number, rawVal: string) => {
    if (rawVal === '') {
      onUpdateMark(matricId, assessmentId, null);
      return;
    }

    const numVal = parseFloat(rawVal);
    if (isNaN(numVal)) {
      alert('Please enter a valid numeric mark!');
      // Reset to original value from marks
      const original = marks.find(m => m.student_matric_id === matricId && m.assessment_id === assessmentId);
      setLocalMarks(prev => ({
        ...prev,
        [`${matricId}_${assessmentId}`]: original ? String(original.raw_mark) : ''
      }));
      return;
    }

    if (numVal < 0 || numVal > maxMark) {
      alert(`Warning: The score ${numVal} exceeds the allowed maximum mark of ${maxMark} for this question! It has been capped.`);
      const cappedVal = numVal < 0 ? 0 : maxMark;
      setLocalMarks(prev => ({
        ...prev,
        [`${matricId}_${assessmentId}`]: String(cappedVal)
      }));
      onUpdateMark(matricId, assessmentId, cappedVal);
    } else {
      onUpdateMark(matricId, assessmentId, numVal);
    }
  };

  // Group assessments by Title to make a nice double-header
  const groupedAssessments: { [key: string]: Assessment[] } = {};
  assessments.forEach(a => {
    if (!groupedAssessments[a.title]) {
      groupedAssessments[a.title] = [];
    }
    groupedAssessments[a.title].push(a);
  });

  const flatAssessments = Object.keys(groupedAssessments).flatMap(title => groupedAssessments[title]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>, rowIndex: number, colIndex: number) => {
    let nextRow = rowIndex;
    let nextCol = colIndex;

    switch (e.key) {
      case 'ArrowUp':
        nextRow = Math.max(0, rowIndex - 1);
        break;
      case 'ArrowDown':
        nextRow = Math.min(students.length - 1, rowIndex + 1);
        break;
      case 'ArrowLeft':
        if ((e.target as HTMLInputElement).selectionStart !== 0) return;
        nextCol = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        if ((e.target as HTMLInputElement).selectionEnd !== (e.target as HTMLInputElement).value.length) return;
        nextCol = Math.min(flatAssessments.length - 1, colIndex + 1);
        break;
      default:
        return;
    }

    if (nextRow !== rowIndex || nextCol !== colIndex) {
      e.preventDefault();
      const nextInput = document.getElementById(`input-mark-${nextRow}-${nextCol}`) as HTMLInputElement;
      if (nextInput) {
        nextInput.focus();
        nextInput.select();
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent<HTMLInputElement>, startRowIndex: number, startColIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/);
    rows.forEach((row, rOffset) => {
      if (!row.trim()) return;
      const cols = row.split(/\t/);
      cols.forEach((val, cOffset) => {
        const targetRow = startRowIndex + rOffset;
        const targetCol = startColIndex + cOffset;
        
        if (targetRow < students.length && targetCol < flatAssessments.length) {
          const studentId = students[targetRow].matric_id;
          const assessmentId = flatAssessments[targetCol].id;
          const maxMark = flatAssessments[targetCol].max_mark;
          
          let cleanedVal = val.trim();
          if (cleanedVal === '') return;
          
          const numVal = parseFloat(cleanedVal);
          if (!isNaN(numVal)) {
            const cappedVal = numVal < 0 ? 0 : (numVal > maxMark ? maxMark : numVal);
            setLocalMarks(prev => ({
              ...prev,
              [`${studentId}_${assessmentId}`]: String(cappedVal)
            }));
            onUpdateMark(studentId, assessmentId, cappedVal);
          }
        }
      });
    });
  };

  return (
    <div className="view-card" style={{ padding: '20px 15px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Course Marks Entry Grid</h2>
        <span style={{ fontSize: '0.825rem', color: 'var(--text-muted)' }}>
          💡 Tip: Changes are saved instantly on leaving a cell. Max mark validation is active.
        </span>
      </div>

      <div className="spreadsheet-grid" style={{ overflowX: 'auto', maxHeight: '550px' }}>
        <table className="spreadsheet-table">
          <thead>
            {/* Top row: Assessment Titles */}
            <tr>
              <th rowSpan={3} className="col-matric">Matric ID</th>
              <th rowSpan={3} className="col-name">Student Name</th>
              {Object.keys(groupedAssessments).map(title => (
                <th key={title} colSpan={groupedAssessments[title].length}>
                  {title}
                </th>
              ))}
              <th colSpan={4} style={{ background: 'rgba(99, 102, 241, 0.2)', borderLeft: '2px solid var(--primary)' }}>
                Final Calculated Metrics
              </th>
            </tr>
            {/* Middle row: Question numbers */}
            <tr>
              {Object.keys(groupedAssessments).map(title => 
                groupedAssessments[title].map(a => (
                  <th key={a.id} style={{ fontSize: '0.75rem', fontWeight: 600 }}>
                    {a.question_no}
                  </th>
                ))
              )}
              {/* Summary columns */}
              <th rowSpan={2} style={{ background: 'rgba(99, 102, 241, 0.1)', borderLeft: '2px solid var(--primary)' }}>CW (50%)</th>
              <th rowSpan={2} style={{ background: 'rgba(99, 102, 241, 0.1)' }}>Exam (50%)</th>
              <th rowSpan={2} style={{ background: 'rgba(99, 102, 241, 0.15)', fontWeight: 'bold' }}>Total (100%)</th>
              <th rowSpan={2} style={{ background: 'rgba(99, 102, 241, 0.2)', fontWeight: 'bold' }}>Grade</th>
            </tr>
            {/* Bottom row: Max Marks and CLO/PLO details */}
            <tr>
              {Object.keys(groupedAssessments).map(title => 
                groupedAssessments[title].map(a => (
                  <th key={a.id} style={{ fontSize: '0.7rem', color: 'var(--text-muted)', fontWeight: 'normal' }}>
                    Max: {a.max_mark}
                  </th>
                ))
              )}
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIndex) => {
              const studentGrade = gradesData.find(g => g.matric_id === student.matric_id) || {};
              const sTotalCW = studentGrade.totalCW !== undefined ? studentGrade.totalCW : 0;
              const sTotalE = studentGrade.totalE !== undefined ? studentGrade.totalE : 0;
              const sTotalMark = studentGrade.totalMark !== undefined ? studentGrade.totalMark : 0;
              const sGrade = studentGrade.grade || 'F';

              return (
                <tr key={student.matric_id}>
                  {/* Student Details (Sticky) */}
                  <td className="col-matric" style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{student.matric_id}</td>
                  <td className="col-name" style={{ fontSize: '0.8rem' }}>{student.name}</td>

                  {/* Mark Cells */}
                  {flatAssessments.map((a, colIndex) => {
                    const inputKey = `${student.matric_id}_${a.id}`;
                    const currentVal = localMarks[inputKey] || '';
                    
                    return (
                      <td key={a.id} style={{ padding: 0 }}>
                        <input
                          id={`input-mark-${rowIndex}-${colIndex}`}
                          type="text"
                          value={currentVal}
                          onChange={e => handleInputChange(student.matric_id, a.id, e.target.value)}
                          onBlur={() => handleBlur(student.matric_id, a.id, a.max_mark, currentVal)}
                          onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                          onPaste={e => handlePaste(e, rowIndex, colIndex)}
                          placeholder="-"
                          style={{
                            width: '100%',
                            height: '100%',
                            padding: '8px 4px',
                            backgroundColor: 'transparent',
                            border: 'none',
                            color: 'var(--text-active)',
                            fontSize: '0.825rem'
                          }}
                        />
                      </td>
                    );
                  })}

                  {/* Summary Cells */}
                  <td style={{ background: 'rgba(255, 255, 255, 0.01)', borderLeft: '2px solid var(--primary)', fontWeight: 500 }}>
                    {sTotalCW.toFixed(2)}
                  </td>
                  <td style={{ background: 'rgba(255, 255, 255, 0.01)', fontWeight: 500 }}>
                    {sTotalE.toFixed(2)}
                  </td>
                  <td style={{ background: 'rgba(99, 102, 241, 0.05)', fontWeight: 'bold', color: 'var(--text-active)' }}>
                    {sTotalMark.toFixed(2)}
                  </td>
                  <td style={{
                    background: (sGrade === 'F' || sGrade === 'Fail') ? 'rgba(239, 68, 68, 0.1)' : 'rgba(16, 185, 129, 0.1)',
                    color: (sGrade === 'F' || sGrade === 'Fail') ? 'var(--danger)' : 'var(--secondary)',
                    fontWeight: 'bold',
                    fontSize: '0.9rem'
                  }}>
                    {sGrade}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
