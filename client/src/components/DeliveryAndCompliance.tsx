import React, { useState, useEffect } from 'react';
import type { CourseInfo, Student } from '../App';

type DeliveryAndComplianceProps = {
  courseInfo: CourseInfo | null;
  students: Student[];
  API_BASE: string;
  activeCourseId: number | null;
  onRefresh: () => void;
};

type SyllabusWeek = {
  id?: number;
  week_number: number;
  title: string;
  description: string;
  file_url: string;
  drive_file_id: string;
};

type Deadline = {
  assignment_name: string;
  due_date: string;
};

export default function DeliveryAndCompliance({
  courseInfo,
  students,
  API_BASE,
  activeCourseId,
  onRefresh
}: DeliveryAndComplianceProps) {
  const [activeSubTab, setActiveSubTab] = useState<'materials' | 'compliance' | 'search'>('materials');

  // Weekly Materials States
  const [weeks, setWeeks] = useState<SyllabusWeek[]>([]);
  const [isEditingWeeks, setIsEditingWeeks] = useState(false);
  const [editableWeeks, setEditableWeeks] = useState<SyllabusWeek[]>([]);
  const [uploadingWeekId, setUploadingWeekId] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState('');

  // Roster Compliance States
  const [deadlines, setDeadlines] = useState<Deadline[]>([]);
  const [newDeadlineName, setNewDeadlineName] = useState('Coursework Portfolio');
  const [newDeadlineDate, setNewDeadlineDate] = useState('');

  // Search Audit States
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);

  // Portfolio data map from courseInfo
  const [portfolio, setPortfolio] = useState<any>({});

  useEffect(() => {
    if (courseInfo && courseInfo.portfolio_data) {
      try {
        setPortfolio(JSON.parse(courseInfo.portfolio_data));
      } catch (e) {
        setPortfolio({});
      }
    } else {
      setPortfolio({});
    }
  }, [courseInfo]);

  // Fetch weeks and deadlines on mount or course change
  useEffect(() => {
    if (activeCourseId !== null) {
      fetchWeeks();
      fetchDeadlines();
    }
  }, [activeCourseId]);

  const fetchWeeks = async () => {
    if (activeCourseId === null) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/syllabus-weeks`);
      if (res.ok) {
        const data = await res.json();
        // Ensure 14 weeks are always represented
        const fullWeeks = Array.from({ length: 14 }, (_, i) => {
          const weekNum = i + 1;
          const found = data.find((w: any) => w.week_number === weekNum);
          return found || {
            week_number: weekNum,
            title: `Week ${weekNum} Topic`,
            description: 'Provide week syllabus topic details here...',
            file_url: '',
            drive_file_id: ''
          };
        });
        setWeeks(fullWeeks);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const fetchDeadlines = async () => {
    if (activeCourseId === null) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/deadlines`);
      if (res.ok) {
        const data = await res.json();
        setDeadlines(data);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Syllabus Save
  const handleSaveSyllabus = async () => {
    if (activeCourseId === null) return;
    try {
      for (const w of editableWeeks) {
        await fetch(`${API_BASE}/courses/${activeCourseId}/syllabus-weeks`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(w)
        });
      }
      setIsEditingWeeks(false);
      fetchWeeks();
      onRefresh();
    } catch (e) {
      console.error(e);
      alert('Error saving syllabus timeline.');
    }
  };

  // Syllabus Edit Change
  const handleSyllabusFieldChange = (idx: number, field: keyof SyllabusWeek, val: any) => {
    const copy = [...editableWeeks];
    copy[idx] = { ...copy[idx], [field]: val };
    setEditableWeeks(copy);
  };

  // Weekly Materials Upload
  const handleMaterialUpload = async (e: React.ChangeEvent<HTMLInputElement>, weekNum: number) => {
    const file = e.target.files?.[0];
    if (!file || activeCourseId === null) return;

    setUploadingWeekId(weekNum);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/courses/${activeCourseId}/syllabus-weeks/upload`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              base64Data: base64,
              filename: file.name,
              mimeType: file.type,
              weekNumber: weekNum,
              courseCode: courseInfo?.course_code || 'COURSE'
            })
          });
          if (res.ok) {
            const data = await res.json();
            // Update SQLite table with uploaded path/id
            const targetWeek = weeks.find(w => w.week_number === weekNum);
            if (targetWeek) {
              await fetch(`${API_BASE}/courses/${activeCourseId}/syllabus-weeks`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  ...targetWeek,
                  file_url: data.file_url,
                  drive_file_id: data.drive_file_id
                })
              });
            }
            fetchWeeks();
            onRefresh();
          } else {
            const errData = await res.json();
            setUploadError(errData.error || 'Upload failed.');
          }
        } catch (err: any) {
          setUploadError(err.message || 'Connection error.');
        } finally {
          setUploadingWeekId(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(err.message || 'Exception occurred.');
      setUploadingWeekId(null);
    }
  };

  // Deadlines Setup
  const handleSaveDeadline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCourseId === null || !newDeadlineDate) return;

    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/deadlines`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assignment_name: newDeadlineName,
          due_date: newDeadlineDate
        })
      });
      if (res.ok) {
        setNewDeadlineDate('');
        fetchDeadlines();
        onRefresh();
      }
    } catch (e) {
      console.error(e);
    }
  };

  const handleDeleteDeadline = async (name: string) => {
    if (activeCourseId === null) return;
    try {
      await fetch(`${API_BASE}/courses/${activeCourseId}/deadlines/${encodeURIComponent(name)}`, {
        method: 'DELETE'
      });
      fetchDeadlines();
      onRefresh();
    } catch (e) {
      console.error(e);
    }
  };

  // Run Search Audit
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      setSearchResults([]);
      return;
    }

    const results: any[] = [];

    // 1. Search syllabus weeks
    weeks.forEach(w => {
      if (w.title.toLowerCase().includes(query) || w.description.toLowerCase().includes(query)) {
        results.push({
          type: 'Syllabus Milestone',
          name: `Week ${w.week_number}: ${w.title}`,
          detail: w.description,
          link: w.file_url || null
        });
      }
    });

    // 2. Search student portfolio files
    Object.keys(portfolio).forEach(key => {
      const item = portfolio[key];
      if (item && item.value) {
        let matches = false;
        
        // Find matching student
        let matchedStudent = null;
        if (item.studentMatricId) {
          matchedStudent = students.find(s => s.matric_id === item.studentMatricId);
        }

        if (key.includes(query) || (item.name && item.name.toLowerCase().includes(query))) {
          matches = true;
        } else if (matchedStudent && (matchedStudent.name.toLowerCase().includes(query) || matchedStudent.matric_id.toLowerCase().includes(query))) {
          matches = true;
        }

        if (matches) {
          results.push({
            type: 'Portfolio Resource',
            name: item.name || key,
            detail: matchedStudent ? `Assigned to: ${matchedStudent.name} (${matchedStudent.matric_id})` : 'Global resource file',
            link: item.value
          });
        }
      }
    });

    setSearchResults(results);
  };

  // Compile compliance grid for student roster
  const getComplianceGrid = () => {
    return students.map(s => {
      const bestSlots = ['cw_best_1', 'cw_best_2', 'cw_best_3'].filter(k => portfolio[k]?.studentMatricId === s.matric_id && portfolio[k]?.value);
      const medSlots = ['cw_med_1', 'cw_med_2', 'cw_med_3'].filter(k => portfolio[k]?.studentMatricId === s.matric_id && portfolio[k]?.value);
      const lowSlots = ['cw_low_1', 'cw_low_2', 'cw_low_3'].filter(k => portfolio[k]?.studentMatricId === s.matric_id && portfolio[k]?.value);

      return {
        student: s,
        bestUploaded: bestSlots.length > 0,
        medUploaded: medSlots.length > 0,
        lowUploaded: lowSlots.length > 0,
        completed: bestSlots.length > 0 || medSlots.length > 0 || lowSlots.length > 0
      };
    });
  };

  const complianceList = getComplianceGrid();

  return (
    <div className="view-card" style={{ padding: '20px' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: '0.5rem', color: 'var(--text-active)' }}>
        Delivery & Compliance Manager
      </h2>
      <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
        Track syllabus timeline topics, verify student coursework sample uploads, and audit documents.
      </p>

      {/* Sub tabs navigation */}
      <div style={{ display: 'flex', gap: '8px', borderBottom: '1px solid var(--border-color)', paddingBottom: '1px', marginBottom: '20px' }}>
        <button
          className={`btn ${activeSubTab === 'materials' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('materials')}
        >
          📅 Weekly Timeline & Materials
        </button>
        <button
          className={`btn ${activeSubTab === 'compliance' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('compliance')}
        >
          📋 Portfolio Roster Compliance
        </button>
        <button
          className={`btn ${activeSubTab === 'search' ? 'btn-primary' : 'btn-secondary'}`}
          style={{ padding: '8px 16px', fontSize: '0.85rem' }}
          onClick={() => setActiveSubTab('search')}
        >
          🔍 Auditing & Global Search
        </button>
      </div>

      {/* Tab content: Weekly Materials */}
      {activeSubTab === 'materials' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 style={{ fontSize: '1.05rem', fontWeight: 600 }}>Weekly syllabus timelines</h3>
            {!isEditingWeeks ? (
              <button
                className="btn btn-secondary"
                style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => {
                  setEditableWeeks([...weeks]);
                  setIsEditingWeeks(true);
                }}
              >
                ✏️ Edit Timeline Topics
              </button>
            ) : (
              <div style={{ display: 'flex', gap: '8px' }}>
                <button
                  className="btn btn-primary"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={handleSaveSyllabus}
                >
                  💾 Save
                </button>
                <button
                  className="btn btn-secondary"
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
                  onClick={() => setIsEditingWeeks(false)}
                >
                  Cancel
                </button>
              </div>
            )}
          </div>

          {uploadError && (
            <div style={{ padding: '10px', background: 'rgba(239, 68, 68, 0.1)', border: '1px solid var(--danger)', borderRadius: '6px', color: 'var(--danger)', fontSize: '0.8rem' }}>
              ⚠️ {uploadError}
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {(!isEditingWeeks ? weeks : editableWeeks).map((w, idx) => {
              const fileLink = w.file_url ? (w.file_url.startsWith('/') ? `${API_BASE.replace('/api', '')}${w.file_url}` : w.file_url) : null;
              
              return (
                <div key={w.week_number} style={{ display: 'flex', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px', gap: '15px', alignItems: 'flex-start' }}>
                  <div style={{ background: 'var(--primary)', color: '#fff', borderRadius: '6px', padding: '6px 12px', fontWeight: 700, fontSize: '0.85rem', textAlign: 'center', minWidth: '70px' }}>
                    Week {w.week_number}
                  </div>
                  <div style={{ flex: 1 }}>
                    {!isEditingWeeks ? (
                      <>
                        <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-active)', marginBottom: '4px' }}>
                          {w.title}
                        </h4>
                        <p style={{ fontSize: '0.82rem', color: 'var(--text-muted)', margin: 0 }}>
                          {w.description}
                        </p>
                      </>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                        <input
                          type="text"
                          className="form-input"
                          value={w.title}
                          onChange={(e) => handleSyllabusFieldChange(idx, 'title', e.target.value)}
                          placeholder={`Week ${w.week_number} topic title`}
                        />
                        <textarea
                          className="form-input"
                          rows={2}
                          value={w.description}
                          onChange={(e) => handleSyllabusFieldChange(idx, 'description', e.target.value)}
                          placeholder="Topic description or syllabus scope..."
                          style={{ resize: 'vertical' }}
                        />
                      </div>
                    )}
                  </div>

                  {!isEditingWeeks && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'flex-end', minWidth: '160px' }}>
                      {fileLink ? (
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <a
                            href={fileLink}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="btn btn-secondary"
                            style={{ padding: '4px 8px', fontSize: '0.75rem', textDecoration: 'none' }}
                          >
                            👁️ View Note
                          </a>
                          <button
                            className="btn"
                            style={{ padding: '4px 6px', fontSize: '0.75rem', color: 'var(--danger)', background: 'transparent', border: 'none' }}
                            onClick={async () => {
                              if (confirm('Delete uploaded lecture file?')) {
                                await fetch(`${API_BASE}/courses/${activeCourseId}/syllabus-weeks`, {
                                  method: 'POST',
                                  headers: { 'Content-Type': 'application/json' },
                                  body: JSON.stringify({
                                    ...w,
                                    file_url: '',
                                    drive_file_id: ''
                                  })
                                });
                                fetchWeeks();
                              }
                            }}
                          >
                            🗑️
                          </button>
                        </div>
                      ) : (
                        <div>
                          <input
                            type="file"
                            accept="application/pdf"
                            id={`syllabus-upload-${w.week_number}`}
                            onChange={(e) => handleMaterialUpload(e, w.week_number)}
                            style={{ display: 'none' }}
                          />
                          <label
                            htmlFor={`syllabus-upload-${w.week_number}`}
                            className="btn btn-secondary"
                            style={{ padding: '4px 10px', fontSize: '0.75rem', cursor: 'pointer', display: 'inline-block' }}
                          >
                            {uploadingWeekId === w.week_number ? '⌛ Uploading...' : '📤 Upload PDF Note'}
                          </label>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab content: Compliance */}
      {activeSubTab === 'compliance' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          {/* Deadline settings card */}
          <div className="panel-card" style={{ padding: '15px' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 600, marginBottom: '10px' }}>Assessment due date deadlines</h3>
            <form onSubmit={handleSaveDeadline} style={{ display: 'flex', gap: '10px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Portfolio Stage/Assessment:</label>
                <select
                  className="form-input"
                  value={newDeadlineName}
                  onChange={(e) => setNewDeadlineName(e.target.value)}
                  style={{ width: '220px' }}
                >
                  <option value="Coursework Portfolio">Coursework Portfolio</option>
                  <option value="Final Examination Scripts">Final Examination Scripts</option>
                  <option value="Marks Registry Audit">Marks Registry Audit</option>
                </select>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Due Date & Time:</label>
                <input
                  type="datetime-local"
                  className="form-input"
                  value={newDeadlineDate}
                  onChange={(e) => setNewDeadlineDate(e.target.value)}
                  required
                />
              </div>

              <button type="submit" className="btn btn-primary" style={{ padding: '8px 16px', fontSize: '0.8rem', height: '36px' }}>
                Set Deadline
              </button>
            </form>

            {/* Active Deadlines */}
            {deadlines.length > 0 && (
              <div style={{ marginTop: '15px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                <h4 style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Active deadlines:</h4>
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
                  {deadlines.map(d => (
                    <div key={d.assignment_name} style={{ display: 'flex', alignItems: 'center', background: 'rgba(255,255,255,0.03)', border: '1px solid var(--border-color)', borderRadius: '6px', padding: '6px 10px', gap: '8px', fontSize: '0.75rem' }}>
                      <span>⏳ <strong>{d.assignment_name}</strong>: {new Date(d.due_date).toLocaleString()}</span>
                      <button
                        style={{ border: 'none', background: 'transparent', color: 'var(--danger)', cursor: 'pointer', padding: 0 }}
                        onClick={() => handleDeleteDeadline(d.assignment_name)}
                      >
                        ❌
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Roster Compliance Audit Grid */}
          <div style={{ overflowX: 'auto' }}>
            <table className="table" style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'rgba(255,255,255,0.03)', borderBottom: '2px solid var(--border-color)' }}>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600 }}>Matric ID</th>
                  <th style={{ padding: '12px', textAlign: 'left', fontSize: '0.8rem', fontWeight: 600 }}>Student Name</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>CW Best Sample</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>CW Med Sample</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>CW Low Sample</th>
                  <th style={{ padding: '12px', textAlign: 'center', fontSize: '0.8rem', fontWeight: 600 }}>Compliance Status</th>
                </tr>
              </thead>
              <tbody>
                {complianceList.length > 0 ? (
                  complianceList.map(row => (
                    <tr key={row.student.matric_id} style={{ borderBottom: '1px solid var(--border-color)' }}>
                      <td style={{ padding: '12px', fontSize: '0.82rem', fontWeight: 500 }}>{row.student.matric_id}</td>
                      <td style={{ padding: '12px', fontSize: '0.82rem' }}>{row.student.name}</td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.1rem' }}>
                        {row.bestUploaded ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.1rem' }}>
                        {row.medUploaded ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center', fontSize: '1.1rem' }}>
                        {row.lowUploaded ? '✅' : '❌'}
                      </td>
                      <td style={{ padding: '12px', textAlign: 'center' }}>
                        <span style={{
                          padding: '3px 8px',
                          borderRadius: '4px',
                          fontSize: '0.72rem',
                          fontWeight: 600,
                          background: row.completed ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: row.completed ? '#22c55e' : '#ef4444'
                        }}>
                          {row.completed ? 'SAMPLE READY' : 'NO SAMPLES'}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                      No students enrolled in this course roster.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab content: Search Audit */}
      {activeSubTab === 'search' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
          <form onSubmit={handleSearch} style={{ display: 'flex', gap: '10px' }}>
            <input
              type="text"
              className="form-input"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by student name, matric ID, week topic, or filename..."
              style={{ flex: 1 }}
            />
            <button type="submit" className="btn btn-primary" style={{ padding: '0 20px', fontSize: '0.85rem', width: 'auto' }}>
              🔍 Audit Search
            </button>
          </form>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-muted)' }}>
              Search Results ({searchResults.length})
            </h3>

            {searchResults.length > 0 ? (
              searchResults.map((r, idx) => {
                const fullLink = r.link ? (r.link.startsWith('/') ? `${API_BASE.replace('/api', '')}${r.link}` : r.link) : null;
                
                return (
                  <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--bg-card)', border: '1px solid var(--border-color)', borderRadius: '8px', padding: '15px' }}>
                    <div>
                      <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '2px 6px', borderRadius: '4px', background: 'rgba(255,255,255,0.06)', color: 'var(--text-muted)', marginRight: '8px' }}>
                        {r.type.toUpperCase()}
                      </span>
                      <h4 style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--text-active)', display: 'inline' }}>
                        {r.name}
                      </h4>
                      <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
                        {r.detail}
                      </p>
                    </div>

                    {fullLink && (
                      <a
                        href={fullLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="btn btn-secondary"
                        style={{ width: 'auto', padding: '6px 12px', fontSize: '0.75rem', textDecoration: 'none' }}
                      >
                        ↗️ Open File
                      </a>
                    )}
                  </div>
                );
              })
            ) : (
              <div style={{ padding: '30px', border: '1px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.82rem' }}>
                {searchQuery ? 'No documents found matching the search criteria.' : 'Enter a search term above to audit materials and student portfolios.'}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
