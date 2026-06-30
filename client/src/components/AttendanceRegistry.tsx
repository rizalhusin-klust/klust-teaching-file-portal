import { useState, useEffect } from 'react';
import type { Student, AttendanceRecord, CourseInfo } from '../App';
import PrintHeader from './PrintHeader';

type AttendanceRegistryProps = {
  students: Student[];
  attendance: AttendanceRecord[];
  onUpdateAttendance: (matricId: string, date: string, status: 'Y' | 'N' | 'MC' | 'LR' | '') => void;
  onUpdateAttendanceBulk?: (updates: { student_matric_id: string; session_date: string; status: 'Y' | 'N' | 'MC' | 'LR' | '' }[]) => void;
  courseInfo: CourseInfo | null;
  API_BASE?: string;
  activeCourseId?: number | null;
  hidePrintHeader?: boolean;
};

// Dynamic course session dates calculator
function getCourseSessionDates(courseInfo: CourseInfo | null): string[] {
  if (!courseInfo || !courseInfo.start_date || !courseInfo.end_date || (!courseInfo.session1_day && !courseInfo.session2_day)) {
    // Return default 28 session dates as fallback
    return [
      '7 Jul', '10 Jul', '14 Jul', '17 Jul', '21 Jul', '24 Jul', '28 Jul', '31 Jul',
      '4 Aug', '7 Aug', '11 Aug', '14 Aug', '18 Aug', '21 Aug', '25 Aug', '28 Aug',
      '1 Sep', '4 Sep', '8 Sep', '11 Sep', '15 Sep', '18 Sep', '22 Sep', '25 Sep',
      '29 Sep', '2 Oct', '6 Oct', '9 Oct'
    ];
  }

  const startDate = new Date(courseInfo.start_date);
  const endDate = new Date(courseInfo.end_date);
  if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
    return [];
  }

  const daysOfWeek = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  const activeDays: number[] = [];
  
  if (courseInfo.session1_day && courseInfo.session1_day !== 'None') {
    const idx = daysOfWeek.findIndex(d => d.toLowerCase() === courseInfo.session1_day!.toLowerCase());
    if (idx !== -1) activeDays.push(idx);
  }
  if (courseInfo.session2_day && courseInfo.session2_day !== 'None') {
    const idx = daysOfWeek.findIndex(d => d.toLowerCase() === courseInfo.session2_day!.toLowerCase());
    if (idx !== -1 && !activeDays.includes(idx)) activeDays.push(idx);
  }

  const dates: string[] = [];
  const currentDate = new Date(startDate);
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

  while (currentDate <= endDate) {
    const day = currentDate.getDay();
    if (activeDays.includes(day)) {
      const dayNum = currentDate.getDate();
      const monthLabel = months[currentDate.getMonth()];
      dates.push(`${dayNum} ${monthLabel}`);
    }
    currentDate.setDate(currentDate.getDate() + 1);
  }

  return dates;
}

export default function AttendanceRegistry({ students, attendance, onUpdateAttendance, onUpdateAttendanceBulk, courseInfo, API_BASE, activeCourseId, hidePrintHeader = false }: AttendanceRegistryProps) {
  const [attendanceMap, setAttendanceMap] = useState<{ [key: string]: 'Y' | 'N' | 'MC' | 'LR' | '' }>({});

  // Multiple PDF upload states
  type AttendancePdf = { key: string; url: string; name: string };
  const [pdfs, setPdfs] = useState<{ [key: string]: AttendancePdf }>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({});

  const dates = getCourseSessionDates(courseInfo);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLDivElement>, rowIndex: number, colIndex: number) => {
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
        nextCol = Math.max(0, colIndex - 1);
        break;
      case 'ArrowRight':
        nextCol = Math.min(dates.length - 1, colIndex + 1);
        break;
      case ' ':
      case 'Enter':
        e.preventDefault();
        const studentId = students[rowIndex].matric_id;
        const sessionDate = dates[colIndex];
        handleCellClick(studentId, sessionDate);
        return;
      default:
        return;
    }

    if (nextRow !== rowIndex || nextCol !== colIndex) {
      e.preventDefault();
      const nextInput = document.getElementById(`attendance-cell-${nextRow}-${nextCol}`) as HTMLDivElement;
      if (nextInput) {
        nextInput.focus();
      }
    }
  };

  const handlePasteAttendance = (e: React.ClipboardEvent<HTMLDivElement>, startRowIndex: number, startColIndex: number) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text/plain');
    if (!pasteData) return;

    const rows = pasteData.split(/\r?\n/);
    rows.forEach((row, rOffset) => {
      if (rOffset === rows.length - 1 && row.trim() === '') return;
      const cols = row.split('\t');
      cols.forEach((val, cOffset) => {
        const targetRow = startRowIndex + rOffset;
        const targetCol = startColIndex + cOffset;
        
        if (targetRow < students.length && targetCol < dates.length) {
          const studentId = students[targetRow].matric_id;
          const sessionDate = dates[targetCol];
          
          let cleanedVal = val.trim().toUpperCase();
          let status: 'Y' | 'N' | 'MC' | 'LR' | '' = '';
          if (cleanedVal === 'Y' || cleanedVal === 'PRESENT' || cleanedVal === '1') {
            status = 'Y';
          } else if (cleanedVal === 'N' || cleanedVal === 'ABSENT' || cleanedVal === '0') {
            status = 'N';
          } else if (cleanedVal === 'MC' || cleanedVal === 'EXCUSED') {
            status = 'MC';
          } else if (cleanedVal === 'LR' || cleanedVal === 'LEAVE') {
            status = 'LR';
          } else if (cleanedVal === '') {
            status = '';
          } else {
            return;
          }

          setAttendanceMap(prev => ({
            ...prev,
            [`${studentId}_${sessionDate}`]: status
          }));
          onUpdateAttendance(studentId, sessionDate, status);
        }
      });
    });
  };

  useEffect(() => {
    const map: { [key: string]: 'Y' | 'N' | 'MC' | 'LR' | '' } = {};
    attendance.forEach(rec => {
      map[`${rec.student_matric_id}_${rec.session_date}`] = rec.status;
    });
    setAttendanceMap(map);
  }, [attendance]);

  // Load existing attendance PDFs from portfolio_data
  useEffect(() => {
    if (courseInfo?.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data);
        const loadedPdfs: { [key: string]: AttendancePdf } = {};
        for (let i = 1; i <= 5; i++) {
          const k = `attendance_pdf_${i}`;
          if (parsed[k]?.type === 'file' && parsed[k]?.value) {
            loadedPdfs[k] = {
              key: k,
              url: parsed[k].value,
              name: parsed[k].name || `Attendance Month ${i} PDF`
            };
          }
        }
        setPdfs(loadedPdfs);
      } catch { /* ignore */ }
    }
  }, [courseInfo]);

  const handleCellClick = (matricId: string, date: string) => {
    const current = attendanceMap[`${matricId}_${date}`] || '';
    let next: 'Y' | 'N' | 'MC' | 'LR' | '' = '';
    
    if (current === '') next = 'Y';
    else if (current === 'Y') next = 'N';
    else if (current === 'N') next = 'MC';
    else if (current === 'MC') next = 'LR';
    else if (current === 'LR') next = '';

    // Optimistic local update
    setAttendanceMap(prev => ({
      ...prev,
      [`${matricId}_${date}`]: next
    }));

    onUpdateAttendance(matricId, date, next);
  };

  const calculateStats = (matricId: string) => {
    let y = 0, n = 0, mc = 0, lr = 0;
    dates.forEach(d => {
      const status = attendanceMap[`${matricId}_${d}`];
      if (status === 'Y') y++;
      else if (status === 'N') n++;
      else if (status === 'MC') mc++;
      else if (status === 'LR') lr++;
    });

    const totalActive = y + n + mc + lr;
    const rate = totalActive > 0 ? (y / totalActive) * 100 : 0;

    // Calculate prediction based on remaining future sessions
    const remainingSessions = Math.max(0, dates.length - totalActive);
    const maxPossiblePresent = y + remainingSessions;
    const maxPossibleRate = dates.length > 0 ? (maxPossiblePresent / dates.length) * 100 : 0;

    const isLockedOut = totalActive > 0 && maxPossibleRate < 80;
    const isWarning = totalActive > 0 && rate < 80 && !isLockedOut;

    return { y, n, mc, lr, rate, isLockedOut, isWarning, maxPossibleRate };
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file || !API_BASE || !activeCourseId) return;

    setUploadingKey(key);
    setUploadError(prev => ({ ...prev, [key]: '' }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/courses/${activeCourseId}/upload-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              fileName: file.name,
              fileBase64: base64
            }),
          });

          if (res.ok) {
            const data = await res.json();
            const saved = data.portfolio_data?.[key];
            if (saved?.value) {
              setPdfs(prev => ({
                ...prev,
                [key]: {
                  key,
                  url: saved.value,
                  name: saved.name || file.name
                }
              }));
            }
          } else {
            setUploadError(prev => ({ ...prev, [key]: 'Upload failed. Please try again.' }));
          }
        } catch {
          setUploadError(prev => ({ ...prev, [key]: 'An error occurred during upload.' }));
        } finally {
          setUploadingKey(null);
        }
      };
      reader.onerror = () => {
        setUploadError(prev => ({ ...prev, [key]: 'FileReader error.' }));
        setUploadingKey(null);
      };
      reader.readAsDataURL(file);
    } catch {
      setUploadError(prev => ({ ...prev, [key]: 'Exception occurred.' }));
      setUploadingKey(null);
    }
    e.target.value = '';
  };

  const handleResetPdf = async (key: string) => {
    if (!API_BASE || !activeCourseId) return;
    try {
      // Fetch current portfolio data, delete key, save back
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          portfolioData: (() => {
            try {
              const p = JSON.parse(courseInfo?.portfolio_data || '{}');
              delete p[key];
              return p;
            } catch { return {}; }
          })()
        }),
      });
      if (res.ok) {
        setPdfs(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
      }
    } catch { /* ignore */ }
  };

  return (
    <div className="view-card" style={{ padding: '20px 15px' }}>
      {!hidePrintHeader && (
        <PrintHeader title="Student Monthly Attendance" courseInfo={courseInfo} />
      )}
      <h3 className="only-print" style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', textTransform: 'uppercase' }}>
        Student Attendance Summary
      </h3>
      <style dangerouslySetInnerHTML={{__html: `
        .attendance-cell:focus {
          outline: 2px solid var(--primary) !important;
          box-shadow: 0 0 8px var(--primary);
        }
      `}} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="no-print">Attendance Tracking Registry</h2>
        <div style={{ display: 'flex', gap: '12px', fontSize: '0.8rem' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--secondary)' }} /> Present (Y)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--danger)' }} /> Absent (N)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: 'var(--warning)' }} /> Excused (MC)
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <span style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#8b5cf6' }} /> Leave (LR)
          </span>
        </div>
      </div>

      <div className="spreadsheet-grid" style={{ overflowX: 'auto', maxHeight: '550px' }}>
        <table className="spreadsheet-table">
          <thead>
            <tr>
              <th className="col-matric">Matric ID</th>
              <th className="col-name">Student Name</th>
              {dates.map(date => {
                const allPresent = students.length > 0 && students.every(student => attendanceMap[`${student.matric_id}_${date}`] === 'Y');
                return (
                  <th key={date} className="no-print" style={{ fontSize: '0.75rem', padding: '6px 4px', minWidth: '34px', textAlign: 'center' }}>
                    <div>{date}</div>
                    <div style={{ marginTop: '4px' }}>
                      <input
                        type="checkbox"
                        checked={allPresent}
                        onChange={(e) => {
                          const checked = e.target.checked;
                          const targetStatus: 'Y' | 'N' | 'MC' | 'LR' | '' = checked ? 'Y' : '';
                          const updates = students.map(student => ({
                            student_matric_id: student.matric_id,
                            session_date: date,
                            status: targetStatus
                          }));

                          // Update local state map
                          const newMap = { ...attendanceMap };
                          students.forEach(student => {
                            newMap[`${student.matric_id}_${date}`] = targetStatus;
                          });
                          setAttendanceMap(newMap);

                          // Call bulk or fall back to loop
                          if (onUpdateAttendanceBulk) {
                            onUpdateAttendanceBulk(updates);
                          } else {
                            students.forEach(student => {
                              onUpdateAttendance(student.matric_id, date, targetStatus);
                            });
                          }
                        }}
                        style={{ cursor: 'pointer', transform: 'scale(0.95)' }}
                        title="Mark Y (Present) for all students"
                      />
                    </div>
                  </th>
                );
              })}
              <th style={{ background: 'rgba(255,255,255,0.05)', borderLeft: '2px solid var(--primary)', minWidth: '40px' }}>Y</th>
              <th style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px' }}>N</th>
              <th style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px' }}>MC</th>
              <th style={{ background: 'rgba(255,255,255,0.05)', minWidth: '40px' }}>LR</th>
              <th style={{ background: 'rgba(99, 102, 241, 0.15)', fontWeight: 'bold', minWidth: '60px' }}>Rate</th>
            </tr>
          </thead>
          <tbody>
            {students.map((student, rowIndex) => {
              const { y, n, mc, lr, rate, isLockedOut, isWarning, maxPossibleRate } = calculateStats(student.matric_id);
              
              return (
                <tr key={student.matric_id}>
                  <td className="col-matric" style={{ fontWeight: 'bold', fontSize: '0.8rem' }}>{student.matric_id}</td>
                  <td 
                    className="col-name" 
                    style={{ 
                      fontSize: '0.8rem',
                      background: isLockedOut 
                        ? 'rgba(239, 68, 68, 0.12)' 
                        : isWarning 
                          ? 'rgba(245, 158, 11, 0.08)' 
                          : undefined,
                      color: isLockedOut 
                        ? 'var(--danger)' 
                        : isWarning 
                          ? 'var(--warning)' 
                          : undefined,
                      fontWeight: (isLockedOut || isWarning) ? '600' : 'normal',
                      transition: 'background-color 0.2s, color 0.2s'
                    }}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%', gap: '6px' }}>
                      <span style={{ whiteSpace: 'normal', wordBreak: 'break-word', textAlign: 'left' }}>{student.name}</span>
                      {isLockedOut && (
                        <span 
                          style={{ cursor: 'help', fontSize: '0.9rem' }} 
                          title={`🚨 Attendance locked out: Cannot exceed ${maxPossibleRate.toFixed(0)}% by end of semester.`}
                        >
                          🚨
                        </span>
                      )}
                      {isWarning && (
                        <span 
                          style={{ cursor: 'help', fontSize: '0.9rem' }} 
                          title={`⚠️ Warning: Current rate is ${rate.toFixed(0)}%. Can recover up to ${maxPossibleRate.toFixed(0)}% with perfect future attendance.`}
                        >
                          ⚠️
                        </span>
                      )}
                    </div>
                  </td>

                  {dates.map((date, colIndex) => {
                    const status = attendanceMap[`${student.matric_id}_${date}`] || '';
                    return (
                      <td key={date} className="no-print" style={{ padding: '4px' }}>
                        <div
                          className={`attendance-cell ${status}`}
                          onClick={() => handleCellClick(student.matric_id, date)}
                          onKeyDown={e => handleKeyDown(e, rowIndex, colIndex)}
                          onPaste={e => handlePasteAttendance(e, rowIndex, colIndex)}
                          tabIndex={0}
                          id={`attendance-cell-${rowIndex}-${colIndex}`}
                          style={{ margin: '0 auto', outline: 'none' }}
                        >
                          {status}
                        </div>
                      </td>
                    );
                  })}

                  {/* Summary Stats */}
                  <td style={{ borderLeft: '2px solid var(--primary)', color: 'var(--secondary)', fontWeight: 600 }}>{y}</td>
                  <td style={{ color: 'var(--danger)', fontWeight: 600 }}>{n}</td>
                  <td style={{ color: 'var(--warning)', fontWeight: 600 }}>{mc}</td>
                  <td style={{ color: '#8b5cf6', fontWeight: 600 }}>{lr}</td>
                  <td style={{
                    background: isLockedOut 
                      ? 'rgba(239, 68, 68, 0.18)' 
                      : isWarning 
                        ? 'rgba(245, 158, 11, 0.12)' 
                        : 'rgba(16, 185, 129, 0.1)',
                    color: isLockedOut 
                      ? 'var(--danger)' 
                      : isWarning 
                        ? 'var(--warning)' 
                        : 'var(--secondary)',
                    fontWeight: 'bold',
                    fontSize: '0.825rem'
                  }}>
                    {rate.toFixed(0)}%
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* ── Student Monthly Attendance PDF Uploads ── */}
      {API_BASE && activeCourseId && (
        <div style={{
          marginTop: '24px',
          padding: '16px',
          background: 'var(--bg-card)',
          border: '1px solid var(--border-color)',
          borderRadius: '8px',
        }}>
          <h3 className="no-print" style={{ fontWeight: 600, fontSize: '1rem', color: 'var(--text-active)', marginBottom: '16px' }}>
            📄 Student Monthly Attendance PDFs (Up to 5)
          </h3>
          <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[1, 2, 3, 4, 5].map(i => {
              const key = `attendance_pdf_${i}`;
              const pdf = pdfs[key];
              const isUploading = uploadingKey === key;

              return (
                <div key={key}>
                  <div className="no-print" style={{
                    padding: '12px',
                    background: 'rgba(255,255,255,0.02)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '6px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--text-muted)' }}>Month {i}</span>
                      {pdf && (
                        <button
                          onClick={() => handleResetPdf(key)}
                          style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
                        >
                          ❌ Reset
                        </button>
                      )}
                    </div>
                    
                    {pdf ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflow: 'hidden' }}>
                          <span style={{ fontSize: '1rem' }}>📄</span>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-active)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            {pdf.name}
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a href={pdf.url} target="_blank" rel="noopener noreferrer" className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }}>
                            👁️ Preview
                          </a>
                          <a href={pdf.url} className="btn btn-secondary" style={{ flex: 1, padding: '4px', fontSize: '0.75rem', textAlign: 'center', textDecoration: 'none' }} download>
                            ⬇️ Download
                          </a>
                        </div>
                      </div>
                    ) : (
                      <div>
                        <input
                          type="file"
                          accept="application/pdf"
                          id={`upload-${key}`}
                          style={{ display: 'none' }}
                          onChange={(e) => handleFileUpload(e, key)}
                        />
                        <label
                          htmlFor={`upload-${key}`}
                          className="btn btn-secondary"
                          style={{ display: 'block', textAlign: 'center', cursor: 'pointer', fontSize: '0.8rem', padding: '6px' }}
                        >
                          {isUploading ? '⌛ Uploading...' : `📤 Upload Month ${i}`}
                        </label>
                        {uploadError[key] && (
                          <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '4px', textAlign: 'center' }}>
                            ⚠️ {uploadError[key]}
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Print UI: Render links in rows outside the grid */}
          <div className="only-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '16px' }}>
            {[1, 2, 3, 4, 5].map(i => {
              const key = `attendance_pdf_${i}`;
              const pdf = pdfs[key];
              if (!pdf) return null;
              return (
                <div key={`print-link-${key}`} style={{ fontSize: '0.9rem' }}>
                  📄 <strong>Attendance Month {i}:</strong> <a href={pdf.url} style={{ color: 'blue', textDecoration: 'underline' }}>{pdf.url}</a>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
