import { useState, useEffect } from 'react';
import type { CourseInfo, WeeklyReport } from '../App';

type LecturerReportProps = {
  courseInfo: CourseInfo | null;
  reports: WeeklyReport[];
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
};

export default function LecturerReport({ courseInfo, reports, onRefresh, API_BASE, activeCourseId }: LecturerReportProps) {
  const [localReports, setLocalReports] = useState<WeeklyReport[]>([]);

  useEffect(() => {
    setLocalReports(reports);
  }, [reports]);

  const handlePrint = () => {
    window.print();
  };

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
          topics: row.topics,
          syllabus_topic: row.syllabus_topic,
          f2f_hours: row.f2f_hours,
          nf2f_hours: row.nf2f_hours,
          remarks: row.remarks,
          course_id: activeCourseId,
          original_week_no: originalRow.week_no
        })
      });
      onRefresh();
    } catch (err) {
      console.error("Failed to auto-save report:", err);
    }
  };

  // Group weekly reports into pages of 3 rows each for print
  const reportPages: WeeklyReport[][] = [];
  const chunkSize = 3;
  for (let i = 0; i < reports.length; i += chunkSize) {
    reportPages.push(reports.slice(i, i + chunkSize));
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Action buttons (Hidden in print) */}
      <div style={{ display: 'flex', gap: '12px' }} className="no-print">
        <button className="btn btn-primary" onClick={handlePrint}>
          🖨️ Print KLUST F28 Report (PDF)
        </button>
      </div>

      {/* Screen View: Single Card containing a Single Table of all weekly reports with inline editing */}
      <div className="view-card screen-only">
        <h2 className="no-print">Weekly Lecturer Reports (KLUST F28)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
          Edit the date, week number, topics, and remarks directly inside the table cells. Click outside the input field to auto-save your changes.
        </p>

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ width: '10%', textAlign: 'center' }}>Week</th>
                <th style={{ width: '25%' }}>Date / Week Label</th>
                <th style={{ width: '45%' }}>Areas / Topics covered</th>
                <th style={{ width: '20%' }}>Remarks</th>
              </tr>
            </thead>
            <tbody>
              {localReports.map((row, idx) => (
                <tr key={row.week_no}>
                  <td style={{ textAlign: 'center' }}>
                    <input
                      type="number"
                      value={row.week_no}
                      onChange={(e) => handleInlineChange(idx, 'week_no', parseInt(e.target.value) || 0)}
                      onBlur={() => handleInlineBlur(idx)}
                      className="inline-input"
                      style={{ textAlign: 'center', fontWeight: 'bold' }}
                      min="1"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.date_label || ''}
                      onChange={(e) => handleInlineChange(idx, 'date_label', e.target.value)}
                      onBlur={() => handleInlineBlur(idx)}
                      className="inline-input"
                    />
                  </td>
                  <td>
                    <textarea
                      value={row.topics || ''}
                      placeholder={row.syllabus_topic || "Topics taught during class..."}
                      onChange={(e) => handleInlineChange(idx, 'topics', e.target.value)}
                      onBlur={() => handleInlineBlur(idx)}
                      className="inline-textarea"
                    />
                  </td>
                  <td>
                    <input
                      type="text"
                      value={row.remarks || ''}
                      onChange={(e) => handleInlineChange(idx, 'remarks', e.target.value)}
                      onBlur={() => handleInlineBlur(idx)}
                      className="inline-input"
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Print View: Grouped into pages of 3 rows each (hidden on screen, visible on print) */}
      <div className="print-only" style={{ display: 'flex', flexDirection: 'column', gap: '40px' }}>
        {reportPages.map((pageRows, pageIdx) => (
          <div
            key={pageIdx}
            className="print-page"
            style={{
              background: 'white',
              border: '1px solid #000',
              padding: '30px',
              color: 'black',
              boxSizing: 'border-box'
            }}
          >
            {/* Page Header (KLUST F28 Form Header) */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', borderBottom: '2px solid #000', paddingBottom: '12px', marginBottom: '20px' }}>
               <div>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.02em', color: '#000' }}>
                  Kuala Lumpur University of Science & Technology (KLUST)
                </h3>
                <span style={{ fontSize: '0.85rem', color: '#555' }}>REPORT BY LECTURER</span>
              </div>
              <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#555', lineHeight: '1.4' }}>
                <div>Form: KLUST F28</div>
                <div>Issue No: 6</div>
                <div>Revision No: 1</div>
                <div>Page No: Page {pageIdx + 1} of {reportPages.length}</div>
              </div>
            </div>

            {/* Lecturer details metadata */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '14px', marginBottom: '24px', fontSize: '0.85rem', color: '#000' }}>
              <div>
                <span style={{ color: '#555' }}>Name of Lecturer: </span>
                <span style={{ fontWeight: 600 }}>{courseInfo?.lecturer || 'RIZAL HUSIN'}</span>
              </div>
              <div>
                <span style={{ color: '#555' }}>Semester: </span>
                <span style={{ fontWeight: 600 }}>{courseInfo?.semester || 'JUNE 2024'}</span>
              </div>
              <div>
                <span style={{ color: '#555' }}>Subject: </span>
                <span style={{ fontWeight: 600 }}>{courseInfo?.course_code || 'ARCH 2240'} {courseInfo?.course_name || 'COMPUTER ANIMATION'}</span>
              </div>
              <div>
                <span style={{ color: '#555' }}>Programme: </span>
                <span style={{ fontWeight: 600 }}>Bachelor of Science (Architectural Studies)</span>
              </div>
            </div>

            {/* Topics Table */}
            <div style={{ marginBottom: '24px', border: '1px solid #000' }}>
              <table style={{ borderCollapse: 'collapse', width: '100%' }}>
                <thead>
                  <tr style={{ background: '#eee', borderBottom: '1px solid #000' }}>
                    <th style={{ width: '25%', borderRight: '1px solid #000', padding: '8px', textAlign: 'left', fontSize: '0.85rem' }}>Date & Week No</th>
                    <th style={{ width: '50%', borderRight: '1px solid #000', padding: '8px', textAlign: 'left', fontSize: '0.85rem' }}>Areas / Topics covered</th>
                    <th style={{ width: '25%', padding: '8px', textAlign: 'left', fontSize: '0.85rem' }}>Remarks</th>
                  </tr>
                </thead>
                <tbody>
                  {pageRows.map(row => (
                    <tr key={row.week_no} style={{ borderBottom: '1px solid #000' }}>
                      <td style={{ fontWeight: 600, padding: '8px', borderRight: '1px solid #000', fontSize: '0.8rem' }}>{row.date_label}</td>
                      <td style={{ whiteSpace: 'normal', lineHeight: '1.4', padding: '8px', borderRight: '1px solid #000', fontSize: '0.8rem' }}>{row.topics || row.syllabus_topic || <span style={{ color: '#888', fontStyle: 'italic' }}>no topics entered</span>}</td>
                      <td style={{ padding: '8px', fontSize: '0.8rem' }}>{row.remarks || <span style={{ color: '#888', fontStyle: 'italic' }}>no remarks</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Note & footer */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', fontSize: '0.75rem', color: '#555', paddingTop: '10px' }}>
              <div>
                <p>Note: Please keep all reports for each semester. Used for quality accreditation standards.</p>
                <p style={{ marginTop: '2px', fontWeight: 'bold' }}>Strictly limited to three (3) rows per page only.</p>
              </div>
              <div style={{ fontWeight: 'bold', letterSpacing: '0.05em' }}>KLUST-F28 I6R1</div>
            </div>

          </div>
        ))}
      </div>

      {/* Hide print CSS block for this page */}
      <style>{`
        .print-only {
          display: none !important;
        }
        .screen-only {
          display: block !important;
        }

        .inline-input {
          background: transparent;
          border: none;
          border-bottom: 1px dashed var(--border-color);
          color: var(--text-active);
          width: 100%;
          padding: 6px 4px;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          transition: border-bottom-color 0.2s, background-color 0.2s;
        }
        .inline-input:focus {
          border-bottom: 1px solid var(--primary);
          background: rgba(255, 255, 255, 0.02);
        }
        
        .inline-textarea {
          background: transparent;
          border: none;
          border-bottom: 1px dashed var(--border-color);
          color: var(--text-active);
          width: 100%;
          padding: 6px 4px;
          font-family: inherit;
          font-size: 0.875rem;
          outline: none;
          resize: vertical;
          min-height: 50px;
          transition: border-bottom-color 0.2s, background-color 0.2s;
        }
        .inline-textarea:focus {
          border-bottom: 1px solid var(--primary);
          background: rgba(255, 255, 255, 0.02);
        }
        
        /* For light theme compatibility */
        .light-theme .inline-input:focus,
        .light-theme .inline-textarea:focus {
          background: rgba(0, 0, 0, 0.02);
        }

        @media print {
          .no-print {
            display: none !important;
          }
          .screen-only {
            display: none !important;
          }
          .print-only {
            display: block !important;
          }
          .print-page {
            background-color: white !important;
            border: 1px solid #000 !important;
            color: black !important;
            box-shadow: none !important;
            margin-bottom: 0 !important;
            page-break-after: always;
            box-sizing: border-box;
          }
          .print-page h3, .print-page span, .print-page th, .print-page td {
            color: black !important;
          }
        }
      `}</style>
    </div>
  );
}
