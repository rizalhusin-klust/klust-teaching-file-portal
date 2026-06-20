import React, { useState } from 'react';
import type { CourseInfo, CLO, PLO, GradeThreshold } from '../App';

type MainTablesProps = {
  courseInfo: CourseInfo | null;
  courses: CourseInfo[];
  activeCourseId: number | null;
  setActiveCourseId: (id: number | null) => void;
  clos: CLO[];
  plos: PLO[];
  gradeThresholds: GradeThreshold[];
  onRefresh: () => void;
  API_BASE: string;
};

export default function MainTables({
  courseInfo,
  courses,
  activeCourseId,
  setActiveCourseId,
  clos,
  plos,
  gradeThresholds,
  onRefresh,
  API_BASE
}: MainTablesProps) {
  const [activeSubTab, setActiveSubTab] = useState<'info' | 'clo' | 'plo' | 'grades'>('info');
  const [showRegisterForm, setShowRegisterForm] = useState(false);
  const [duplicateCourse, setDuplicateCourse] = useState<CourseInfo | null>(null);

  // Course info form state
  const [courseCode, setCourseCode] = useState('');
  const [courseName, setCourseName] = useState('');
  const [creditHours, setCreditHours] = useState(2.0);
  const [lecturer, setLecturer] = useState('');
  const [email, setEmail] = useState('');
  const [roomNo, setRoomNo] = useState('');
  const [telephone, setTelephone] = useState('');
  const [hpNo, setHpNo] = useState('');
  const [consultationHours, setConsultationHours] = useState('');
  const [semester, setSemester] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [session1Day, setSession1Day] = useState('Monday');
  const [session1Start, setSession1Start] = useState('09:00');
  const [session1End, setSession1End] = useState('11:00');
  const [session2Day, setSession2Day] = useState('Thursday');
  const [session2Start, setSession2Start] = useState('14:00');
  const [session2End, setSession2End] = useState('16:00');
  const [passFailMode, setPassFailMode] = useState(0);
  const [passMark, setPassMark] = useState(50.0);

  // Duplicate course form state
  const [dupSemester, setDupSemester] = useState('');
  const [dupStartDate, setDupStartDate] = useState('');
  const [dupEndDate, setDupEndDate] = useState('');

  // Add CLO state
  const [newCloNo, setNewCloNo] = useState('');
  const [newCloDesc, setNewCloDesc] = useState('');
  const [editingClo, setEditingClo] = useState<string | null>(null);
  const [editingCloDesc, setEditingCloDesc] = useState('');

  // Add PLO state
  const [newPloNo, setNewPloNo] = useState('');
  const [newPloDesc, setNewPloDesc] = useState('');
  const [editingPlo, setEditingPlo] = useState<string | null>(null);
  const [editingPloDesc, setEditingPloDesc] = useState('');

  // Add/Edit Grade Threshold state
  const [newGrade, setNewGrade] = useState('');
  const [newMinMark, setNewMinMark] = useState<number | ''>('');

  // Sync active course details when courseInfo changes OR when mode switches
  React.useEffect(() => {
    if (!showRegisterForm && !duplicateCourse && courseInfo) {
      setCourseCode(courseInfo.course_code || '');
      setCourseName(courseInfo.course_name || '');
      setCreditHours(courseInfo.credit_hours || 2.0);
      setLecturer(courseInfo.lecturer || '');
      setEmail(courseInfo.email || '');
      setRoomNo(courseInfo.room_no || '');
      setTelephone(courseInfo.telephone || '');
      setHpNo(courseInfo.hp_no || '');
      setConsultationHours(courseInfo.consultation_hours || '');
      setSemester(courseInfo.semester || '');
      setStartDate(courseInfo.start_date || '');
      setEndDate(courseInfo.end_date || '');
      setSession1Day(courseInfo.session1_day || 'Monday');
      setSession1Start(courseInfo.session1_start || '09:00');
      setSession1End(courseInfo.session1_end || '11:00');
      setSession2Day(courseInfo.session2_day || 'None');
      setSession2Start(courseInfo.session2_start || '');
      setSession2End(courseInfo.session2_end || '');
      setPassFailMode(courseInfo.pass_fail_mode || 0);
      setPassMark(courseInfo.pass_mark !== undefined && courseInfo.pass_mark !== null ? courseInfo.pass_mark : 50.0);
    } else if (showRegisterForm) {
      setCourseCode('');
      setCourseName('');
      setCreditHours(2.0);
      setLecturer('');
      setEmail('');
      setRoomNo('');
      setTelephone('');
      setHpNo('');
      setConsultationHours('');
      setSemester('');
      setStartDate('');
      setEndDate('');
      setSession1Day('Monday');
      setSession1Start('09:00');
      setSession1End('11:00');
      setSession2Day('Thursday');
      setSession2Start('14:00');
      setSession2End('16:00');
      setPassFailMode(0);
      setPassMark(50.0);
    }
  }, [courseInfo, showRegisterForm, duplicateCourse]);

  const handleStartDuplicate = (c: CourseInfo) => {
    setDuplicateCourse(c);
    setDupSemester(`${c.semester} - Copy`);
    setDupStartDate(c.start_date || '');
    setDupEndDate(c.end_date || '');
    setShowRegisterForm(false);
  };

  const handleSaveDuplicate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duplicateCourse) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${duplicateCourse.id}/duplicate`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          semester: dupSemester,
          start_date: dupStartDate,
          end_date: dupEndDate
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert('Course duplicated successfully!');
        setDuplicateCourse(null);
        if (data.id) {
          setActiveCourseId(data.id);
        }
        onRefresh();
      } else {
        alert('Failed to duplicate course.');
      }
    } catch (err) {
      console.error(err);
      alert('Error duplicating course.');
    }
  };

  const handleDeleteCourse = async (courseId: number, code: string, name: string) => {
    const isConfirmed = confirm(
      `⚠️ WARNING: Are you sure you want to delete "${code} - ${name}"?\n\n` +
      `This will permanently delete the course, student roster, marks, attendance registry, syllabus details, weekly reports, and all uploaded portfolio assets.\n\n` +
      `This action CANNOT be undone. Do you wish to proceed?`
    );
    if (!isConfirmed) return;

    try {
      const res = await fetch(`${API_BASE}/courses/${courseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        alert('Course deleted successfully!');
        if (courseId === activeCourseId) {
          const remainingCourses = courses.filter(c => c.id !== courseId);
          if (remainingCourses.length > 0) {
            setActiveCourseId(remainingCourses[0].id);
          } else {
            setActiveCourseId(null);
          }
        }
        onRefresh();
      } else {
        alert('Failed to delete course.');
      }
    } catch (err) {
      console.error(err);
      alert('Error occurred while deleting course.');
    }
  };
  
  // Update Course Info or Create New Course
  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const res = await fetch(`${API_BASE}/course-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: showRegisterForm ? null : (courseInfo?.id || null),
          course_code: courseCode,
          course_name: courseName,
          credit_hours: creditHours,
          lecturer,
          email,
          room_no: roomNo,
          telephone: telephone,
          hp_no: hpNo,
          consultation_hours: consultationHours,
          semester,
          start_date: startDate,
          end_date: endDate,
          session1_day: session1Day,
          session1_start: session1Start,
          session1_end: session1End,
          session2_day: session2Day,
          session2_start: session2Day === 'None' ? '' : session2Start,
          session2_end: session2Day === 'None' ? '' : session2End,
          pass_fail_mode: passFailMode,
          pass_mark: passMark
        })
      });
      if (res.ok) {
        const data = await res.json();
        alert(showRegisterForm ? 'New course registered successfully!' : 'Course details updated successfully!');
        if (showRegisterForm && data.id) {
          setActiveCourseId(data.id);
          setShowRegisterForm(false);
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Failed to save course info.');
    }
  };

  // Add/Update CLO
  const handleSaveClo = async (e: React.FormEvent, cloNo?: string, desc?: string) => {
    if (e) e.preventDefault();
    const targetNo = cloNo || newCloNo;
    const targetDesc = desc !== undefined ? desc : newCloDesc;

    if (!targetNo.trim() || !targetDesc.trim()) {
      alert('Both CLO Code and Description are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/clos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ clo_no: targetNo.trim(), description: targetDesc.trim(), course_id: activeCourseId })
      });
      if (res.ok) {
        if (!cloNo) {
          setNewCloNo('');
          setNewCloDesc('');
        } else {
          setEditingClo(null);
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete CLO
  const handleDeleteClo = async (cloNo: string) => {
    if (!confirm(`Are you sure you want to delete ${cloNo}? This will also clear all mappings and assessment mappings associated with this CLO!`)) return;
    try {
      const res = await fetch(`${API_BASE}/clos/${cloNo}?course_id=${activeCourseId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Add/Update PLO
  const handleSavePlo = async (e: React.FormEvent, ploNo?: string, desc?: string) => {
    if (e) e.preventDefault();
    const targetNo = ploNo || newPloNo;
    const targetDesc = desc !== undefined ? desc : newPloDesc;

    if (!targetNo.trim() || !targetDesc.trim()) {
      alert('Both PLO Code and Description are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/plos`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plo_no: targetNo.trim(), description: targetDesc.trim(), course_id: activeCourseId })
      });
      if (res.ok) {
        if (!ploNo) {
          setNewPloNo('');
          setNewPloDesc('');
        } else {
          setEditingPlo(null);
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete PLO
  const handleDeletePlo = async (ploNo: string) => {
    if (!confirm(`Are you sure you want to delete ${ploNo}? This will also clear all mappings and assessment mappings associated with this PLO!`)) return;
    try {
      const res = await fetch(`${API_BASE}/plos/${ploNo}?course_id=${activeCourseId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save/Update Threshold
  const handleSaveThreshold = async (e: React.FormEvent, gradeName?: string, minMarkVal?: number) => {
    if (e) e.preventDefault();
    const targetGrade = gradeName || newGrade;
    const targetMin = minMarkVal !== undefined ? minMarkVal : newMinMark;

    if (!targetGrade.trim() || targetMin === '') {
      alert('Both Grade and Min Mark are required.');
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/grade-thresholds`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ grade: targetGrade.trim(), min_mark: Number(targetMin), course_id: activeCourseId })
      });
      if (res.ok) {
        if (!gradeName) {
          setNewGrade('');
          setNewMinMark('');
        }
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Delete Threshold
  const handleDeleteThreshold = async (gradeName: string) => {
    if (!confirm(`Are you sure you want to delete threshold for ${gradeName}?`)) return;
    try {
      const res = await fetch(`${API_BASE}/grade-thresholds/${gradeName}?course_id=${activeCourseId}`, { method: 'DELETE' });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Sub tabs nav */}
      <div style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
        <button className={`btn ${activeSubTab === 'info' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('info')}>
          ⚙️ Course Details
        </button>
        <button className={`btn ${activeSubTab === 'clo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('clo')}>
          📚 Course Outcomes (CLO)
        </button>
        <button className={`btn ${activeSubTab === 'plo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('plo')}>
          🎯 Program Outcomes (PLO)
        </button>
        <button className={`btn ${activeSubTab === 'grades' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('grades')}>
          📈 Grade Thresholds
        </button>
      </div>

      {activeSubTab === 'info' && (
        <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1.8fr', gap: '24px', alignItems: 'start' }}>
          {/* Left Column: Registered Courses List */}
          <div className="view-card" style={{ marginBottom: 0 }}>
            <h2>Registered Courses ({courses.length})</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
              Select a course to view details or activate it as the main active course workspace.
            </p>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>Code</th>
                    <th>Course Name</th>
                    <th className="no-print" style={{ textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {courses.map(c => {
                    const isActive = c.id === activeCourseId;
                    return (
                      <tr key={c.id} style={{ background: isActive ? 'rgba(99, 102, 241, 0.05)' : 'transparent' }}>
                        <td style={{ fontWeight: 'bold' }}>{c.course_code}</td>
                        <td>
                          <div>{c.course_name}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                            {c.semester} {c.start_date && c.end_date ? `(${c.start_date} to ${c.end_date})` : ''}
                          </div>
                        </td>
                        <td className="no-print" style={{ textAlign: 'center' }}>
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center', alignItems: 'center' }}>
                            {isActive ? (
                              <span style={{
                                padding: '4px 8px',
                                borderRadius: '4px',
                                fontSize: '0.75rem',
                                fontWeight: 600,
                                background: 'rgba(16, 185, 129, 0.15)',
                                color: 'var(--secondary)'
                              }}>
                                Active
                              </span>
                            ) : (
                              <button
                                className="btn btn-secondary"
                                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                                onClick={() => {
                                  setActiveCourseId(c.id);
                                  setShowRegisterForm(false);
                                  setDuplicateCourse(null);
                                }}
                              >
                                Activate
                              </button>
                            )}
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--info)' }}
                              onClick={() => handleStartDuplicate(c)}
                            >
                              📋 Duplicate
                            </button>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }}
                              onClick={() => handleDeleteCourse(c.id, c.course_code, c.course_name)}
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <div style={{ marginTop: '16px' }}>
              <button
                className="btn btn-primary"
                style={{ width: '100%', gap: '6px' }}
                onClick={() => {
                  setShowRegisterForm(!showRegisterForm);
                  setDuplicateCourse(null);
                }}
              >
                {showRegisterForm ? '✏️ Edit Active Course Details' : '➕ Register New Course'}
              </button>
            </div>
          </div>

          {/* Right Column: Edit/Register/Duplicate Form */}
          <div className="view-card" style={{ marginBottom: 0 }}>
            {duplicateCourse ? (
              <>
                <h2>Duplicate Course: {duplicateCourse.course_code}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  Create a copy of <strong>{duplicateCourse.course_name}</strong> for a new semester. This will duplicate the syllabus outline, CLO/PLO configurations, assessment scheme, and thresholds, but exclude the student roster and marks.
                </p>
                <form onSubmit={handleSaveDuplicate}>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(1, 1fr)' }}>
                    <div className="form-group">
                      <label>New Semester / Year *</label>
                      <input type="text" value={dupSemester} onChange={e => setDupSemester(e.target.value)} required placeholder="e.g. OCTOBER 2024" />
                    </div>
                    <div className="form-group">
                      <label>New Start Date *</label>
                      <input type="date" value={dupStartDate} onChange={e => setDupStartDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>New End Date *</label>
                      <input type="date" value={dupEndDate} onChange={e => setDupEndDate(e.target.value)} required />
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary">
                      🚀 Duplicate Workspace
                    </button>
                    <button type="button" className="btn btn-secondary" onClick={() => setDuplicateCourse(null)}>
                      Cancel
                    </button>
                  </div>
                </form>
              </>
            ) : (
              <>
                <h2>{showRegisterForm ? 'Register New Course' : 'Edit Active Course Details'}</h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
                  {showRegisterForm 
                    ? 'Fill in the information below to register a new course. Default grade thresholds and a 14-week outline will be created.' 
                    : 'Modify the details for the currently active course workspace.'}
                </p>
                <form onSubmit={handleSaveInfo}>
                  <div className="form-grid" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
                    <div className="form-group">
                      <label>Course Code *</label>
                      <input type="text" value={courseCode} onChange={e => setCourseCode(e.target.value)} required placeholder="e.g. ARCH 2240" />
                    </div>
                    <div className="form-group">
                      <label>Course Name *</label>
                      <input type="text" value={courseName} onChange={e => setCourseName(e.target.value)} required placeholder="e.g. COMPUTER ANIMATION" />
                    </div>
                    <div className="form-group">
                      <label>Credit Hours *</label>
                      <input type="number" step="0.5" value={creditHours} onChange={e => setCreditHours(parseFloat(e.target.value))} required />
                    </div>
                    <div className="form-group">
                      <label>Semester / Year *</label>
                      <input type="text" value={semester} onChange={e => setSemester(e.target.value)} required placeholder="e.g. JUNE 2024" />
                    </div>
                    <div className="form-group">
                      <label>Start Date *</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>End Date *</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} required />
                    </div>
                    <div className="form-group">
                      <label>Lecturer Name *</label>
                      <input type="text" value={lecturer} onChange={e => setLecturer(e.target.value)} required placeholder="e.g. RIZAL HUSIN" />
                    </div>
                    <div className="form-group">
                      <label>Lecturer Email *</label>
                      <input type="email" value={email} onChange={e => setEmail(e.target.value)} required placeholder="e.g. rizal@klust.edu.my" />
                    </div>
                    <div className="form-group">
                      <label>Office / Room No</label>
                      <input type="text" value={roomNo} onChange={e => setRoomNo(e.target.value)} placeholder="e.g. 118 Block B" />
                    </div>
                    <div className="form-group">
                      <label>Lecturer Phone Number (HP)</label>
                      <input type="text" value={hpNo} onChange={e => setHpNo(e.target.value)} placeholder="e.g. +601111443741" />
                    </div>
                    <div className="form-group">
                      <label>Office Telephone</label>
                      <input type="text" value={telephone} onChange={e => setTelephone(e.target.value)} placeholder="e.g. 03-89266993" />
                    </div>
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label>Consultation Hours</label>
                      <input type="text" value={consultationHours} onChange={e => setConsultationHours(e.target.value)} placeholder="e.g. Friday 3.00pm - 5.00pm" />
                    </div>

                    {/* Weekly Session Scheduling Section */}
                    <div style={{ gridColumn: 'span 2', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-active)', marginBottom: '12px' }}>Weekly Class Sessions</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px', marginBottom: '14px' }}>
                        {/* Session 1 */}
                        <div className="form-group">
                          <label>Session 1 Day *</label>
                          <select value={session1Day} onChange={e => setSession1Day(e.target.value)} required>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Session 1 Start Time *</label>
                          <input type="time" value={session1Start} onChange={e => setSession1Start(e.target.value)} required />
                        </div>
                        <div className="form-group">
                          <label>Session 1 End Time *</label>
                          <input type="time" value={session1End} onChange={e => setSession1End(e.target.value)} required />
                        </div>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '14px' }}>
                        {/* Session 2 */}
                        <div className="form-group">
                          <label>Session 2 Day</label>
                          <select value={session2Day} onChange={e => setSession2Day(e.target.value)}>
                            <option value="None">None (Single Session)</option>
                            <option value="Monday">Monday</option>
                            <option value="Tuesday">Tuesday</option>
                            <option value="Wednesday">Wednesday</option>
                            <option value="Thursday">Thursday</option>
                            <option value="Friday">Friday</option>
                            <option value="Saturday">Saturday</option>
                            <option value="Sunday">Sunday</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Session 2 Start Time</label>
                          <input 
                            type="time" 
                            value={session2Start} 
                            onChange={e => setSession2Start(e.target.value)} 
                            disabled={session2Day === 'None'} 
                            required={session2Day !== 'None'}
                          />
                        </div>
                        <div className="form-group">
                          <label>Session 2 End Time</label>
                          <input 
                            type="time" 
                            value={session2End} 
                            onChange={e => setSession2End(e.target.value)} 
                            disabled={session2Day === 'None'} 
                            required={session2Day !== 'None'}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Grading Schema Configuration */}
                    <div style={{ gridColumn: 'span 2', marginTop: '14px', borderTop: '1px solid var(--border-color)', paddingTop: '14px' }}>
                      <h3 style={{ fontSize: '1rem', fontWeight: 600, color: 'var(--text-active)', marginBottom: '12px' }}>Grading Schema</h3>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px' }}>
                        <div className="form-group">
                          <label>Grading Mode</label>
                          <select value={passFailMode} onChange={e => setPassFailMode(Number(e.target.value))}>
                            <option value={0}>Letter Grades (A+ to F)</option>
                            <option value={1}>Pass / Fail Mode Only</option>
                          </select>
                        </div>
                        <div className="form-group">
                          <label>Minimum Passing Mark (%)</label>
                          <input 
                            type="number" 
                            step="0.5" 
                            min="0" 
                            max="100" 
                            value={passMark} 
                            onChange={e => setPassMark(parseFloat(e.target.value) || 0)} 
                            disabled={passFailMode === 0}
                            style={{ opacity: passFailMode === 0 ? 0.6 : 1 }}
                            required={passFailMode === 1}
                          />
                        </div>
                      </div>
                    </div>

                  </div>
                  <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                    <button type="submit" className="btn btn-primary">
                      {showRegisterForm ? '🚀 Register Course' : '💾 Save Details'}
                    </button>
                    {showRegisterForm && (
                      <button type="button" className="btn btn-secondary" onClick={() => setShowRegisterForm(false)}>
                        Cancel
                      </button>
                    )}
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      )}

      {activeSubTab === 'clo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add CLO Form */}
          <div className="view-card">
            <h2>Add Course Learning Outcome (CLO)</h2>
            <form onSubmit={(e) => handleSaveClo(e)} className="form-grid" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>CLO Code</label>
                <input type="text" value={newCloNo} onChange={e => setNewCloNo(e.target.value)} placeholder="e.g. CLO_04" required />
              </div>
              <div className="form-group" style={{ flex: 3 }}>
                <label>Description</label>
                <input type="text" value={newCloDesc} onChange={e => setNewCloDesc(e.target.value)} placeholder="Enter CLO description..." required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Add CLO</button>
            </form>
          </div>

          {/* CLOs List */}
          <div className="view-card">
            <h2>Course Learning Outcomes (CLOs)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>CLO Code</th>
                    <th>Description</th>
                    <th className="no-print" style={{ width: '150px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {clos.map(c => (
                    <tr key={c.clo_no}>
                      <td style={{ fontWeight: 'bold' }}>{c.clo_no}</td>
                      <td>
                        {editingClo === c.clo_no ? (
                          <input
                            type="text"
                            value={editingCloDesc}
                            onChange={e => setEditingCloDesc(e.target.value)}
                            style={{ width: '100%', padding: '6px', color: '#fff', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          />
                        ) : (
                          c.description
                        )}
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        {editingClo === c.clo_no ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={(e) => handleSaveClo(e, c.clo_no, editingCloDesc)}>
                              Save
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setEditingClo(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setEditingClo(c.clo_no);
                                setEditingCloDesc(c.description);
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDeleteClo(c.clo_no)}>
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {clos.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No CLOs configured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'plo' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {/* Add PLO Form */}
          <div className="view-card">
            <h2>Add Program Learning Outcome (PLO)</h2>
            <form onSubmit={(e) => handleSavePlo(e)} className="form-grid" style={{ alignItems: 'flex-end' }}>
              <div className="form-group" style={{ flex: 1 }}>
                <label>PLO Code</label>
                <input type="text" value={newPloNo} onChange={e => setNewPloNo(e.target.value)} placeholder="e.g. PLO_13" required />
              </div>
              <div className="form-group" style={{ flex: 3 }}>
                <label>Description</label>
                <input type="text" value={newPloDesc} onChange={e => setNewPloDesc(e.target.value)} placeholder="Enter PLO description..." required />
              </div>
              <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Add PLO</button>
            </form>
          </div>

          {/* PLOs List */}
          <div className="view-card">
            <h2>Program Learning Outcomes (PLOs)</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th style={{ width: '120px' }}>PLO Code</th>
                    <th>Description</th>
                    <th className="no-print" style={{ width: '150px', textAlign: 'center' }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {plos.map(p => (
                    <tr key={p.plo_no}>
                      <td style={{ fontWeight: 'bold' }}>{p.plo_no}</td>
                      <td>
                        {editingPlo === p.plo_no ? (
                          <input
                            type="text"
                            value={editingPloDesc}
                            onChange={e => setEditingPloDesc(e.target.value)}
                            style={{ width: '100%', padding: '6px', color: '#fff', background: 'rgba(0,0,0,0.3)', border: '1px solid var(--border-color)', borderRadius: '4px' }}
                          />
                        ) : (
                          p.description
                        )}
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        {editingPlo === p.plo_no ? (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button className="btn btn-primary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={(e) => handleSavePlo(e, p.plo_no, editingPloDesc)}>
                              Save
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => setEditingPlo(null)}>
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                            <button
                              className="btn btn-secondary"
                              style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                              onClick={() => {
                                setEditingPlo(p.plo_no);
                                setEditingPloDesc(p.description);
                              }}
                            >
                              ✏️ Edit
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDeletePlo(p.plo_no)}>
                              🗑️ Delete
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  ))}
                  {plos.length === 0 && (
                    <tr>
                      <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No PLOs configured yet.</td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeSubTab === 'grades' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
          {courseInfo?.pass_fail_mode === 1 ? (
            <div className="alert alert-info" style={{ margin: 0 }}>
              <span>ℹ️ <strong>Pass/Fail Schema is active</strong>: Letter grade thresholds are disabled for this course workspace. Grades are dynamically calculated as <strong>Pass</strong> (score &ge; {courseInfo.pass_mark || 50.0}%) or <strong>Fail</strong> (score &lt; {courseInfo.pass_mark || 50.0}%). You can configure the grading mode and threshold in the course details form.</span>
            </div>
          ) : (
            <>
              {/* Add/Edit Grade form */}
              <div className="view-card">
                <h2>Add/Edit Grade Boundary</h2>
                <form onSubmit={(e) => handleSaveThreshold(e)} className="form-grid" style={{ alignItems: 'flex-end' }}>
                  <div className="form-group">
                    <label>Grade Label</label>
                    <input type="text" value={newGrade} onChange={e => setNewGrade(e.target.value)} placeholder="e.g. A+" required />
                  </div>
                  <div className="form-group">
                    <label>Min Mark Required (%)</label>
                    <input type="number" step="0.1" value={newMinMark} onChange={e => setNewMinMark(e.target.value === '' ? '' : parseFloat(e.target.value))} placeholder="e.g. 94.5" required />
                  </div>
                  <button type="submit" className="btn btn-primary" style={{ height: '38px' }}>Save Grade Boundary</button>
                </form>
              </div>

              {/* Grade boundaries list */}
              <div className="view-card">
                <h2>Grade Boundaries & Thresholds</h2>
                <div className="table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>Grade Name</th>
                        <th>Minimum Mark (%)</th>
                        <th style={{ width: '120px', textAlign: 'center' }}>Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {gradeThresholds.map(gt => (
                        <tr key={gt.grade}>
                          <td style={{ fontWeight: 'bold', fontSize: '1.1rem', color: 'var(--text-active)' }}>{gt.grade}</td>
                          <td>
                            <input
                              type="number"
                              step="0.1"
                              defaultValue={gt.min_mark}
                              onBlur={(e) => {
                                const val = parseFloat(e.target.value);
                                if (!isNaN(val)) {
                                  handleSaveThreshold(null as any, gt.grade, val);
                                }
                              }}
                              style={{
                                width: '120px',
                                padding: '6px',
                                color: '#fff',
                                background: 'rgba(0,0,0,0.2)',
                                border: '1px solid var(--border-color)',
                                borderRadius: '4px'
                              }}
                            />
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginLeft: '10px' }}>
                              (Tab away to auto-save)
                            </span>
                          </td>
                          <td style={{ textAlign: 'center' }}>
                            <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)' }} onClick={() => handleDeleteThreshold(gt.grade)}>
                              🗑️ Delete
                            </button>
                          </td>
                        </tr>
                      ))}
                      {gradeThresholds.length === 0 && (
                        <tr>
                          <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No grade thresholds configured.</td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}
