import { useState, useEffect } from 'react';
import type { WeeklyReport, CourseInfo, Student, PlannedAssessment } from '../App';

type TeachingPlanProps = {
  reports: WeeklyReport[];
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  courseInfo: CourseInfo | null;
  students: Student[];
  clos: { clo_no: string; description: string }[];
  plos: { plo_no: string; description: string }[];
  plannedAssessments: PlannedAssessment[];
};

export default function TeachingPlan({
  reports,
  onRefresh,
  API_BASE,
  activeCourseId,
  courseInfo,
  students,
  clos,
  plos,
  plannedAssessments
}: TeachingPlanProps) {
  const [localReports, setLocalReports] = useState<WeeklyReport[]>([]);
  const [referencesInput, setReferencesInput] = useState('');

  useEffect(() => {
    setReferencesInput(courseInfo?.references_list || '');
  }, [courseInfo]);

  const handleSaveReferences = async () => {
    if (activeCourseId === null) return;
    try {
      await fetch(`${API_BASE}/course-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCourseId,
          references_list: referencesInput
        })
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to save course references:", err);
    }
  };

  useEffect(() => {
    setLocalReports(reports);
  }, [reports]);

  const handleInlineChange = (index: number, field: keyof WeeklyReport, value: any) => {
    setLocalReports(prev => {
      const next = [...prev];
      next[index] = { ...next[index], [field]: value };
      return next;
    });
  };

  const handleInlineBlur = async (index: number) => {
    const row = localReports[index];
    const originalRow = reports[index];
    if (!row || !originalRow || activeCourseId === null) return;

    try {
      await fetch(`${API_BASE}/reports`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          week_no: row.week_no,
          date_label: row.date_label,
          topics: row.topics || '',
          syllabus_topic: row.syllabus_topic,
          f2f_hours: row.f2f_hours,
          nf2f_hours: row.nf2f_hours,
          remarks: row.remarks || 'as planned',
          course_id: activeCourseId,
          original_week_no: originalRow.week_no
        })
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to auto-save syllabus week:", err);
    }
  };

  const getProgramName = () => {
    const code = students.find(s => s.programme)?.programme || 'FBE301';
    if (code.toUpperCase() === 'FBE301') {
      return 'Bachelor of Science (Architectural Studies)';
    }
    return code;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Inject Print Page orientation style (A4 portrait with 0.5" margins) */}
      {/* Also format the text inputs and textareas to look borderless during print */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
          }
          .inline-input, .inline-textarea {
            border: none !important;
            background: transparent !important;
            color: black !important;
            padding: 0 !important;
            resize: none !important;
            overflow: hidden !important;
            font-size: 0.85rem !important;
          }
        }
      `}} />
      
      {/* Print-Only Header & Metadata for Teaching Plan */}
      <div className="only-print teaching-file-cover-container" style={{ maxWidth: '100%', margin: '0', padding: '0 0 1rem 0', borderBottom: '2px solid #1e3a8a', marginBottom: '0.25rem', background: '#ffffff', color: '#000000' }}>
        <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
          <h1 className="cover-title" style={{ textAlign: 'left', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
            KUALA LUMPUR UNIVERSITY OF<br />SCIENCE AND TECHNOLOGY
          </h1>
          <div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.3rem', fontWeight: '300', color: '#1e3a8a', margin: '0.4rem 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Teaching Plan
          </div>
        </div>

        {/* Metadata Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Programme</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{getProgramName().toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Course</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>
                {courseInfo?.course_code?.toUpperCase()} {courseInfo?.course_name?.toUpperCase()} ({courseInfo?.credit_hours} CREDIT HOURS)
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Semester</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.semester?.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Lecturer</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.lecturer?.toUpperCase()} ({courseInfo?.email?.toUpperCase()})</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Consultation</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.consultation_hours?.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Course Synopsis Card */}
      <div className="view-card">
        <h2>Course Synopsis</h2>
        <div style={{ marginTop: '10px', fontSize: '0.875rem', lineHeight: '1.5', whiteSpace: 'pre-wrap', textAlign: 'justify' }}>
          {courseInfo?.synopsis || 'No course synopsis entered. Please configure it in the Syllabus Outline tab.'}
        </div>
      </div>

      {/* Course Learning Outcomes (CLOs) Card */}
      <div className="view-card">
        <h2>Course Learning Outcomes (CLOs)</h2>
        <div className="table-container" style={{ marginTop: '10px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '15%', textAlign: 'left', fontWeight: 'bold' }}>CLO No</th>
                <th style={{ width: '85%', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {clos.map(c => (
                <tr key={c.clo_no}>
                  <td style={{ fontWeight: 'bold', color: 'var(--info)', verticalAlign: 'top', width: '15%' }}>{c.clo_no}</td>
                  <td style={{ verticalAlign: 'top', width: '85%', whiteSpace: 'normal', fontSize: '0.875rem', lineHeight: '1.4' }}>{c.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Program Learning Outcomes (PLOs) Card */}
      <div className="view-card" style={{ pageBreakInside: 'avoid' }}>
        <h2>Program Learning Outcomes (PLOs)</h2>
        <div className="table-container" style={{ marginTop: '10px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ width: '15%', textAlign: 'left', fontWeight: 'bold' }}>PLO No</th>
                <th style={{ width: '85%', textAlign: 'left', fontWeight: 'bold' }}>Description</th>
              </tr>
            </thead>
            <tbody>
              {plos.map(p => (
                <tr key={p.plo_no}>
                  <td style={{ fontWeight: 'bold', color: 'var(--info)', verticalAlign: 'top', width: '15%' }}>{p.plo_no}</td>
                  <td style={{ verticalAlign: 'top', width: '85%', whiteSpace: 'normal', fontSize: '0.875rem', lineHeight: '1.4' }}>{p.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Planned Assessments Scheme Card */}
      <div className="view-card" style={{ pageBreakInside: 'avoid' }}>
        <h2>Planned Assessments Scheme</h2>
        <div className="table-container" style={{ marginTop: '10px' }}>
          <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', fontWeight: 'bold' }}>Assessment Title</th>
                <th style={{ textAlign: 'left', fontWeight: 'bold' }}>Type</th>
                <th style={{ textAlign: 'left', fontWeight: 'bold' }}>Weightage (%)</th>
              </tr>
            </thead>
            <tbody>
              {plannedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={3} style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No planned assessments configured.</td>
                </tr>
              ) : (
                plannedAssessments.map(p => (
                  <tr key={p.id}>
                    <td style={{ fontWeight: 'bold' }}>{p.title}</td>
                    <td>{p.type === 'CW' ? 'Coursework (CW)' : 'Final Exam (E)'}</td>
                    <td>{p.weightage.toFixed(1)}%</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Week-by-Week Teaching Plan Config */}
      <div className="view-card">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <h2>14-Week Planned Curriculum Outline (Teaching Plan)</h2>
        </div>
        
        <div className="table-container">
          <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Week</th>
                <th style={{ width: '20%' }}>Date / Label</th>
                <th style={{ width: '40%' }}>Planned Syllabus Topic (Curriculum Content)</th>
                <th style={{ width: '10%', textAlign: 'center' }}>F2F Hours</th>
                <th style={{ width: '10%', textAlign: 'center' }}>NF2F Hours</th>
                <th style={{ width: '10%', textAlign: 'center' }}>Total SLT</th>
              </tr>
            </thead>
            <tbody>
              {localReports.map((w, idx) => {
                const totalSlt = (w.f2f_hours || 0) + (w.nf2f_hours || 0);
                return (
                  <tr key={w.week_no}>
                    <td style={{ fontWeight: 'bold', textAlign: 'center', verticalAlign: 'middle' }}>Week {w.week_no}</td>
                    <td>
                      <input
                        type="text"
                        value={w.date_label || ''}
                        onChange={e => handleInlineChange(idx, 'date_label', e.target.value)}
                        onBlur={() => handleInlineBlur(idx)}
                        className="inline-input"
                      />
                    </td>
                    <td>
                      <textarea
                        value={w.syllabus_topic || ''}
                        onChange={e => handleInlineChange(idx, 'syllabus_topic', e.target.value)}
                        onBlur={() => handleInlineBlur(idx)}
                        className="inline-textarea"
                        placeholder="Planned syllabus topic details..."
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={w.f2f_hours || 0}
                        onChange={e => handleInlineChange(idx, 'f2f_hours', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleInlineBlur(idx)}
                        className="inline-input"
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="number"
                        step="0.5"
                        value={w.nf2f_hours || 0}
                        onChange={e => handleInlineChange(idx, 'nf2f_hours', parseFloat(e.target.value) || 0)}
                        onBlur={() => handleInlineBlur(idx)}
                        className="inline-input"
                        style={{ textAlign: 'center' }}
                      />
                    </td>
                    <td style={{ fontWeight: 600, color: 'var(--info)', textAlign: 'center', verticalAlign: 'middle' }}>{totalSlt} hrs</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* References and Resources Card */}
      <div className="view-card">
        <h2>References and Resources</h2>
        <div className="no-print" style={{ marginTop: '10px' }}>
          <textarea
            value={referencesInput}
            onChange={e => setReferencesInput(e.target.value)}
            onBlur={handleSaveReferences}
            className="inline-textarea"
            style={{ width: '100%', minHeight: '100px' }}
            placeholder="Enter references and resources..."
          />
        </div>
        <div className="only-print" style={{ marginTop: '10px', fontSize: '0.875rem', lineHeight: '1.5', color: '#334155', whiteSpace: 'pre-wrap', textAlign: 'left' }}>
          {courseInfo?.references_list || 'No references entered.'}
        </div>
      </div>
    </div>
  );
}
