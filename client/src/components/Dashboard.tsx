import { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';

type DashboardProps = {
  API_BASE: string;
  gradesData: any[];
  obeMetrics: any;
  courseInfo: CourseInfo | null;
};

export default function Dashboard({ API_BASE, gradesData, obeMetrics, courseInfo }: DashboardProps) {
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const fetchStats = async () => {
      if (!courseInfo?.id) return;
      try {
        const res = await fetch(`${API_BASE}/dashboard?course_id=${courseInfo.id}`);
        setStats(await res.json());
      } catch (err) {
        console.error('Error fetching dashboard stats:', err);
      }
    };
    fetchStats();
  }, [gradesData, obeMetrics, API_BASE, courseInfo]);

  const [checklist, setChecklist] = useState([
    { no: 1, details: "Details of Students' Results", tick: true, hardcopy: false, softcopy: true },
    { no: 2, details: "OBE Assessment", tick: true, hardcopy: false, softcopy: true },
    { no: 3, details: "Course Syllabus", tick: true, hardcopy: false, softcopy: true },
    { no: 4, details: "Teaching Plan", tick: true, hardcopy: false, softcopy: true },
    { no: 5, details: "Time-Table of Lecturer", tick: true, hardcopy: false, softcopy: true },
    { no: 6, details: "Student Monthly Attendance", tick: true, hardcopy: false, softcopy: true },
    { no: 7, details: "Report by Lecturer", tick: true, hardcopy: false, softcopy: true },
    { no: 8, details: "Teaching Materials", tick: true, hardcopy: false, softcopy: true },
    { no: 9, details: "Moderated Final Exam with Marking Scheme", tick: false, hardcopy: false, softcopy: false },
    { no: 10, details: "Final Exam Scripts (3 higher, 3 lower, and 3 middle scores)", tick: false, hardcopy: false, softcopy: false },
    { no: 11, details: "Coursework with Marking Schemes (Tests, Assignments, Quizzes, Lab Reports, Tutorials, Projects Etc.)", tick: true, hardcopy: false, softcopy: true },
    { no: 12, details: "Samples of Student Coursework (Tests, Assignments, Quizzes, Lab Reports, Tutorials, Projects etc.) (3 higher, 3 lower, and 3 middle scores for each coursework)", tick: true, hardcopy: false, softcopy: true },
    { no: 13, details: "Miscellaneous Records - copies of medical certificates, letters, etc.", tick: false, hardcopy: false, softcopy: false },
  ]);

  const handleToggle = (index: number, field: 'tick' | 'hardcopy' | 'softcopy') => {
    const nextChecklist = [...checklist];
    nextChecklist[index] = {
      ...nextChecklist[index],
      [field]: !nextChecklist[index][field]
    };
    setChecklist(nextChecklist);
  };

  const getProgramName = () => {
    const code = gradesData.find(g => g.programme)?.programme || 'FBE301';
    if (code.toUpperCase() === 'FBE301') {
      return 'Bachelor of Science (Architectural Studies)';
    }
    return code;
  };

  if (!stats) return <div>Loading statistics...</div>;

  // Compute stats
  const totalStudents = stats.studentCount;
  const classAvg = stats.classAverage;
  
  // Calculate average attendance rate
  const isPassFail = courseInfo?.pass_fail_mode === 1;
  const passMark = courseInfo?.pass_mark !== undefined && courseInfo?.pass_mark !== null ? courseInfo.pass_mark : 50.0;
  const passFailThreshold = isPassFail ? passMark : 46.5; 

  const totalPass = gradesData.filter(g => {
    if (isPassFail) {
      return g.grade === 'Pass';
    } else {
      return g.totalMark >= passFailThreshold && g.totalMark > 0;
    }
  }).length;
  const activeCount = gradesData.filter(g => g.totalMark > 0).length;
  const passRate = activeCount > 0 ? Number(((totalPass / activeCount) * 100).toFixed(1)) : 0;

  // Grade distributions
  const gradeDistribution = stats.gradeDistribution || {};
  const maxGradeCount = Math.max(...Object.values(gradeDistribution) as number[], 1);

  return (
    <>
      {/* --- Screen view (Hidden on Print) --- */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        {/* 4 Core Stat Cards */}
        <div className="dashboard-grid">
          <div className="stat-card primary">
            <span className="stat-label">Total Roster</span>
            <span className="stat-value">{totalStudents}</span>
            <span className="stat-trend up">👥 Active Students</span>
          </div>
          <div className="stat-card secondary">
            <span className="stat-label">Class Average</span>
            <span className="stat-value">{classAvg}%</span>
            <span className="stat-trend up">📈 Cumulative Performance</span>
          </div>
          <div className="stat-card warning">
            <span className="stat-label">Pass Rate</span>
            <span className="stat-value">{activeCount > 0 ? `${passRate}%` : 'N/A'}</span>
            <span className="stat-trend up">🎓 Marks &gt;= {passFailThreshold}%</span>
          </div>
          <div className="stat-card danger">
            <span className="stat-label">OBE Targets</span>
            <span className="stat-value">
              {obeMetrics ? Object.values(obeMetrics.cloMetrics).filter((m: any) => m.avgAchieved === 'Yes').length : 0} / {obeMetrics ? Object.keys(obeMetrics.cloMetrics).length : 0}
            </span>
            <span className="stat-trend up">🎯 CLOs Achieved</span>
          </div>
        </div>

        {/* Grid of detailed analysis */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', gap: '24px' }}>
          
          {/* Grade Distribution Bar Chart */}
          <div className="view-card" style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            <h2>Grade Distribution</h2>
            <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1, minHeight: '220px', padding: '10px 0 10px', marginTop: '10px' }}>
              {Object.keys(gradeDistribution).map(grade => {
                const val = gradeDistribution[grade] || 0;
                const heightPct = (val / maxGradeCount) * 85 + 5; 
                return (
                  <div key={grade} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', flex: 1, height: '100%', gap: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 600, color: val > 0 ? 'var(--primary)' : 'var(--text-muted)' }}>
                      {val > 0 ? val : ''}
                    </span>
                    <div style={{
                      width: '70%',
                      maxWidth: '45px',
                      height: `${heightPct}%`,
                      background: val > 0 ? 'var(--grad-primary)' : 'var(--bg-card-hover)',
                      borderRadius: '6px 6px 0 0',
                      transition: 'all 0.4s ease',
                      boxShadow: val > 0 ? '0 0 10px rgba(99, 102, 241, 0.15)' : 'none'
                    }} />
                    <span style={{ fontSize: '0.8rem', fontWeight: 500, color: 'var(--text-main)' }}>{grade}</span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* OBE Targets Quick Audit */}
          <div className="view-card" style={{ flex: 1 }}>
            <h2>OBE Assessment Summary</h2>
            {obeMetrics ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', marginTop: '10px' }}>
                {Object.keys(obeMetrics.cloMetrics).map(cloNo => {
                  const metric = obeMetrics.cloMetrics[cloNo];
                  return (
                    <div key={cloNo} style={{ display: 'flex', flexDirection: 'column', gap: '6px', padding: '12px', background: 'var(--bg-app)', borderRadius: '8px', border: '1px solid var(--border-color)' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontWeight: 600, fontFamily: 'Outfit', color: 'var(--text-active)' }}>{cloNo}</span>
                        <span style={{ fontSize: '0.8rem', padding: '2px 8px', borderRadius: '4px', background: metric.avgAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)', color: metric.avgAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)', fontWeight: 600 }}>
                          {metric.avgAchieved === 'Yes' ? 'Target Achieved' : 'Target Failed'}
                        </span>
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-muted)', marginTop: '4px' }}>
                        <span>Average Score: {metric.percentageAverage}% (Target &gt;= 50%)</span>
                        <span>Density: {metric.density}% (Target &gt;= 50%)</span>
                      </div>
                      <div style={{ height: '6px', background: 'var(--bg-card-hover)', borderRadius: '3px', overflow: 'hidden', marginTop: '4px' }}>
                        <div style={{ height: '100%', width: `${Math.min(metric.percentageAverage, 100)}%`, background: metric.percentageAverage >= 50 ? 'var(--grad-secondary)' : 'var(--danger)', borderRadius: '3px' }} />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p style={{ color: 'var(--text-muted)' }}>No OBE metrics available.</p>
            )}
          </div>

        </div>

        {/* Course Information Metadata Box */}
        <div className="view-card">
          <h2>Course Details</h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px', fontSize: '0.9rem', color: 'var(--text-main)' }}>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Faculty</p>
              <p style={{ fontWeight: 500 }}>Faculty of Architecture & Built Environment</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Programme</p>
              <p style={{ fontWeight: 500 }}>{getProgramName()}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>Office / Room</p>
              <p style={{ fontWeight: 500 }}>{courseInfo?.room_no || '118 Block B'}</p>
            </div>
            <div>
              <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', textTransform: 'uppercase', marginBottom: '4px' }}>HP / Contact</p>
              <p style={{ fontWeight: 500 }}>{courseInfo?.hp_no || '+6011 1144 3741'}</p>
            </div>
          </div>
        </div>

        {/* Teaching File Cover Checklist Configuration Grid */}
        <div className="view-card">
          <h2>📄 Teaching File Cover & Print Setup</h2>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '16px' }}>
            Configure the checklist of records for this course. Toggle the checkboxes below as needed.
            When you click the global <strong>🖨️ Print View</strong> in the header while on the Dashboard tab, this cover page will print instead of the charts and stats cards.
          </p>
          <div className="table-container" style={{ overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '6%', textAlign: 'center' }}>No.</th>
                  <th>Details of Students' Records</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Tick (✓)</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Hardcopy</th>
                  <th style={{ width: '12%', textAlign: 'center' }}>Softcopy</th>
                </tr>
              </thead>
              <tbody>
                {checklist.map((item, idx) => (
                  <tr key={item.no}>
                    <td style={{ textAlign: 'center' }}>{item.no}</td>
                    <td>{item.details}</td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.tick}
                        onChange={() => handleToggle(idx, 'tick')}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.hardcopy}
                        onChange={() => handleToggle(idx, 'hardcopy')}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={item.softcopy}
                        onChange={() => handleToggle(idx, 'softcopy')}
                        style={{ cursor: 'pointer', width: '16px', height: '16px', accentColor: 'var(--primary)' }}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* --- Print-Only View: Teaching File Cover (Matches KLUST COVER FORMAT.html) --- */}
      <div className="only-print teaching-file-cover-container">
        <div className="cover-header" style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <img
            className="cover-logo"
            src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png"
            alt="KLUST Logo"
            style={{ width: '120px', height: 'auto', margin: '0 auto 0.75rem auto', display: 'block' }}
          />
          <h1 className="cover-title" style={{ textAlign: 'center', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 700, margin: '0 0 0.25rem 0', letterSpacing: '0.04em', lineHeight: 1.25 }}>
            KUALA LUMPUR UNIVERSITY OF<br />SCIENCE AND TECHNOLOGY
          </h1>
          <div style={{ textAlign: 'center', fontSize: '2.5rem', fontWeight: 300, color: '#1e3a8a', textTransform: 'uppercase', letterSpacing: '0.1em', margin: '1rem 0 0.5rem 0', lineHeight: 1.1 }}>
            Teaching File
          </div>
        </div>

        {/* Metadata Table — standard style */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Faculty</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>FACULTY OF ARCHITECTURE &amp; BUILT ENVIRONMENT</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Programme</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{getProgramName().toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Course</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>
                {courseInfo?.course_code?.toUpperCase()} {courseInfo?.course_name?.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Semester</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.semester?.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Lecturer</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.lecturer?.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>

        <h2 className="cover-section-title">Checklist of Records</h2>
        <table className="cover-table">
          <thead>
            <tr>
              <th style={{ width: '6%', textAlign: 'center' }}>No.</th>
              <th>Details of Students' Records</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Tick (✓)</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Hardcopy</th>
              <th style={{ width: '12%', textAlign: 'center' }}>Softcopy</th>
            </tr>
          </thead>
          <tbody>
            {checklist.map((item) => (
              <tr key={item.no}>
                <td style={{ textAlign: 'center' }}>{item.no}</td>
                <td>{item.details}</td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#1e3a8a' }}>
                  {item.tick ? '✓' : ''}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#1e3a8a' }}>
                  {item.hardcopy ? '✓' : ''}
                </td>
                <td style={{ textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#1e3a8a' }}>
                  {item.softcopy ? '✓' : ''}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}
