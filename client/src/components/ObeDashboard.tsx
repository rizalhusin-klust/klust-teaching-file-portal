import { useState, useEffect } from 'react';
import type { Assessment, OptionalGroup } from '../App';
import PrintHeader from './PrintHeader';

type ObeDashboardProps = {
  assessments: Assessment[];
  optionalGroups: OptionalGroup[];
  obeMetrics: any;
  gradesData: any[];
  isPrintMode?: boolean;
  courseInfo?: any;
  API_BASE?: string;
  activeCourseId?: number | null;
  onRefresh?: () => void;
  activeSubTab?: 'clo' | 'plo' | 'student-clo' | 'student-plo' | 'cqi';
  printSection?: 'clo' | 'plo' | 'student-clo' | 'student-plo' | 'cqi';
};

export default function ObeDashboard({ assessments,  obeMetrics, gradesData, isPrintMode, courseInfo, API_BASE, activeCourseId, onRefresh, activeSubTab: externalSubTab, printSection }: ObeDashboardProps) {
  const [internalSubTab, setInternalSubTab] = useState<'clo' | 'plo' | 'student-clo' | 'student-plo' | 'cqi'>('clo');
  const activeSubTab = externalSubTab || internalSubTab;
  const setActiveSubTab = setInternalSubTab;
  const [cqiActions, setCqiActions] = useState<Record<string, string>>({});
  const [prevCloScores, setPrevCloScores] = useState<Record<string, string>>({});
  const [prevPloScores, setPrevPloScores] = useState<Record<string, string>>({});

  useEffect(() => {
    if (courseInfo?.portfolio_data) {
      try {
        const pd = typeof courseInfo.portfolio_data === 'string' ? JSON.parse(courseInfo.portfolio_data) : courseInfo.portfolio_data;
        if (pd.cqi) {
          setPrevCloScores(pd.cqi.prevCloScores || {});
          setPrevPloScores(pd.cqi.prevPloScores || {});
          setCqiActions(pd.cqi.cqiActions || {});
        }
      } catch (e) {
        console.error("Failed to parse portfolio data for CQI", e);
      }
    }
  }, [courseInfo]);

  if (!obeMetrics) return <div>Loading OBE data...</div>;

  const { cloMetrics = {}, ploMetrics = {} } = obeMetrics;

  const renderCloTable = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="view-card">
          <h2>CLO Class Target Analysis</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>CLO Code</th>
                  <th>Allocated Weight (%)</th>
                  <th>Class Average Score (%)</th>
                  <th style={{ textAlign: 'center' }}>Target Avg (50%) Achieved?</th>
                  <th>Density Rate (%)</th>
                  <th style={{ textAlign: 'center' }}>Target Density (50%) Achieved?</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(cloMetrics).map(cloNo => {
                  const m = cloMetrics[cloNo];
                  return (
                    <tr key={cloNo}>
                      <td style={{ fontWeight: 'bold' }}>{cloNo}</td>
                      <td>{m.allocatedMax.toFixed(2)}%</td>
                      <td>{m.percentageAverage.toFixed(2)}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: m.avgAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: m.avgAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                        }}>
                          {m.avgAchieved}
                        </span>
                      </td>
                      <td>{m.density.toFixed(2)}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: m.densityAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: m.densityAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                        }}>
                          {m.densityAchieved}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphical CLO Bar Chart */}
        <div className="view-card">
          <h2>CLO Average Marks Bar Chart</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {Object.keys(cloMetrics).map(cloNo => {
              const m = cloMetrics[cloNo];
              const pct = m.percentageAverage;
              return (
                <div key={cloNo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '80px', fontWeight: 600, fontSize: '0.875rem' }}>{cloNo}</div>
                  <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: `${Math.min(pct, 100)}%`,
                      height: '100%',
                      background: pct >= 50 ? 'var(--grad-secondary)' : 'var(--danger)',
                      borderRadius: '11px',
                      transition: 'width 0.6s ease'
                    }} />
                    <span style={{
                      position: 'absolute',
                      right: '12px',
                      top: '50%',
                      transform: 'translateY(-50%)',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      color: '#fff'
                    }}>
                      {pct.toFixed(1)}%
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderPloTable = () => {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="view-card">
          <h2>PLO Class Target Analysis</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>PLO Code</th>
                  <th>Allocated Weight (%)</th>
                  <th>Class Average Score (%)</th>
                  <th style={{ textAlign: 'center' }}>Target Avg (50%) Achieved?</th>
                  <th>Density Rate (%)</th>
                  <th style={{ textAlign: 'center' }}>Target Density (50%) Achieved?</th>
                </tr>
              </thead>
              <tbody>
                {Object.keys(ploMetrics).map(ploNo => {
                  const m = ploMetrics[ploNo];
                  return (
                    <tr key={ploNo}>
                      <td style={{ fontWeight: 'bold' }}>{ploNo}</td>
                      <td>{m.allocatedMax.toFixed(2)}%</td>
                      <td>{m.percentageAverage.toFixed(2)}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: m.avgAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: m.avgAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                        }}>
                          {m.avgAchieved}
                        </span>
                      </td>
                      <td>{m.density.toFixed(2)}%</td>
                      <td style={{ textAlign: 'center' }}>
                        <span style={{
                          padding: '2px 8px',
                          borderRadius: '4px',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          background: m.densityAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                          color: m.densityAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                        }}>
                          {m.densityAchieved}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphical PLO Bar Chart */}
        <div className="view-card">
          <h2>PLO Average Marks Bar Chart</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {Object.keys(ploMetrics)
              .filter(ploNo => ploMetrics[ploNo].allocatedMax > 0)
              .map(ploNo => {
                const m = ploMetrics[ploNo];
                const pct = m.percentageAverage;
                return (
                  <div key={ploNo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '80px', fontWeight: 600, fontSize: '0.875rem' }}>{ploNo}</div>
                    <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                      <div style={{
                        width: `${Math.min(pct, 100)}%`,
                        height: '100%',
                        background: pct >= 50 ? 'var(--grad-secondary)' : 'var(--danger)',
                        borderRadius: '11px',
                        transition: 'width 0.6s ease'
                      }} />
                      <span style={{
                        position: 'absolute',
                        right: '12px',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        fontSize: '0.75rem',
                        fontWeight: 700,
                        color: '#fff'
                      }}>
                        {pct.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      </div>
    );
  };

  const renderStudentClo = () => {
    // Get unique CLO codes present
    const clos = Array.from(new Set(assessments.map(a => a.clo_no))).sort();
    return (
      <div className="view-card">
        <h2>Student Personal CLO Breakdown</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matric ID</th>
                <th>Student Name</th>
                {clos.map(c => (
                  <th key={c}>{c}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradesData.map(student => (
                <tr key={student.matric_id}>
                  <td style={{ fontWeight: 'bold' }}>{student.matric_id}</td>
                  <td>{student.name}</td>
                  {clos.map(c => {
                    const score = student.cloScores?.[c] || 0;
                    return (
                      <td key={c} style={{ fontWeight: 500, color: 'var(--text-active)' }}>
                        {score.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderStudentPlo = () => {
    const plos = Array.from(new Set(assessments.map(a => a.plo_no))).sort();
    return (
      <div className="view-card">
        <h2>Student Personal PLO Breakdown</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Matric ID</th>
                <th>Student Name</th>
                {plos.map(p => (
                  <th key={p}>{p}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {gradesData.map(student => (
                <tr key={student.matric_id}>
                  <td style={{ fontWeight: 'bold' }}>{student.matric_id}</td>
                  <td>{student.name}</td>
                  {plos.map(p => {
                    const score = student.ploScores?.[p] || 0;
                    return (
                      <td key={p} style={{ fontWeight: 500, color: 'var(--text-active)' }}>
                        {score.toFixed(2)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  const renderCqiForm = () => {
    // Determine failed outcomes for specific improvement plans
    const failedCLOs = Object.keys(cloMetrics).filter(k => cloMetrics[k].avgAchieved === 'No' || cloMetrics[k].densityAchieved === 'No');
    const failedPLOs = Object.keys(ploMetrics).filter(k => ploMetrics[k].avgAchieved === 'No' || ploMetrics[k].densityAchieved === 'No');

    // 1. Grade Distribution
    let grades = { A: 0, B: 0, C: 0, F: 0, total: gradesData.length };
    gradesData.forEach(student => {
      const finalScore = Object.values(student.cloScores || {}).reduce((sum: any, score: any) => sum + score, 0) as number;
      if (finalScore >= 75) grades.A++;
      else if (finalScore >= 50) grades.B++;
      else if (finalScore >= 40) grades.C++;
      else grades.F++;
    });

    const cloKeys = Object.keys(cloMetrics).sort();
    const ploKeys = Object.keys(ploMetrics).sort();

    const getStatus = (pct: number) => {
      if (pct >= 75) return 'G';
      if (pct >= 50) return 'S';
      return 'W';
    };

    const renderComparativeBarChart = (keys: string[], prevScores: Record<string, string>, currentMetrics: any) => {
      return (
        <div style={{ marginTop: '20px', pageBreakInside: 'avoid' }}>
          <h3 style={{ fontSize: '1rem', marginBottom: '8px', fontWeight: 'bold', textAlign: 'center', color: '#334155' }}>Attainment Progress (Previous vs Current)</h3>
          <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-around', height: '150px', padding: '20px 0 0 0', borderBottom: '1px solid #cbd5e1', gap: '8px' }}>
            {keys.map(k => {
              const prevValStr = prevScores[k] || '0';
              const prevVal = parseFloat(prevValStr.replace('%', '')) || 0;
              const curVal = currentMetrics[k].density;
              
              return (
                <div key={k} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', height: '100%', width: '100%' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-end', height: '100%', gap: '4px', width: '100%', justifyContent: 'center' }}>
                    {/* Previous Semester Bar */}
                    <div className="no-print-bg" style={{ width: '30%', maxWidth: '30px', height: `${Math.min(100, Math.max(0, prevVal))}%`, backgroundColor: '#94a3b8', WebkitPrintColorAdjust: 'exact', position: 'relative', borderTopLeftRadius: '2px', borderTopRightRadius: '2px' }}>
                       <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#555' }}>{prevVal > 0 ? `${prevVal}%` : ''}</span>
                    </div>
                    {/* Current Semester Bar */}
                    <div className="no-print-bg" style={{ width: '30%', maxWidth: '30px', height: `${Math.min(100, Math.max(0, curVal))}%`, backgroundColor: '#3b82f6', WebkitPrintColorAdjust: 'exact', position: 'relative', borderTopLeftRadius: '2px', borderTopRightRadius: '2px' }}>
                       <span style={{ position: 'absolute', top: '-18px', left: '50%', transform: 'translateX(-50%)', fontSize: '0.7rem', color: '#1e3a8a', fontWeight: 'bold' }}>{curVal.toFixed(0)}%</span>
                    </div>
                  </div>
                  <div style={{ marginTop: '8px', fontSize: '0.75rem', fontWeight: 'bold' }}>{k}</div>
                </div>
              )
            })}
          </div>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '16px', marginTop: '16px', fontSize: '0.85rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#94a3b8', WebkitPrintColorAdjust: 'exact', borderRadius: '2px' }}></div> Previous Semester
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
              <div style={{ width: '12px', height: '12px', backgroundColor: '#3b82f6', WebkitPrintColorAdjust: 'exact', borderRadius: '2px' }}></div> Current Semester
            </div>
          </div>
        </div>
      );
    };

    const cqiInfo = courseInfo || {};

    return (
      <div className="view-card cqi-report" style={{ fontSize: '0.9rem', color: 'black', background: '#fff' }}>
        <PrintHeader title="Continuous Quality Improvement (CQI) Report" courseInfo={courseInfo || null} />
        <h1 className="no-print" style={{ borderBottom: '2px solid #ccc', paddingBottom: '8px', marginBottom: '20px', fontSize: '1.8rem', fontWeight: 'bold' }}>Continuous Quality Improvement (CQI) Report</h1>
        
        {/* Course Specifications */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold' }}>Course Specifications</h2>
          <ul style={{ listStyle: 'none', padding: 0, margin: 0, display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <li><strong>Course Code:</strong> {cqiInfo.course_code || 'N/A'}</li>
            <li><strong>Course Name:</strong> {cqiInfo.course_name || 'N/A'}</li>
            <li><strong>Semester:</strong> {cqiInfo.semester || 'N/A'}</li>
            <li><strong>Name of Lecturer:</strong> {cqiInfo.lecturer || 'N/A'}</li>
            <li><strong>Performance Indicator:</strong> CLO and PLO density score of 50% and above</li>
            <li><strong>Total Number of Students:</strong> {grades.total}</li>
          </ul>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* Grade Distribution */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold' }}>Grade Distribution</h2>
          <div className="table-container">
            <table className="data-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>Grade Range</th>
                  <th style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>Letter Grades</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Number of Students</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px' }}>Percentage (%)</th>
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>75 - 100%</td>
                  <td style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>A+, A, A-</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.A}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.total ? ((grades.A / grades.total) * 100).toFixed(2) : '0.00'}%</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>50 - 74%</td>
                  <td style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>B+, B, B-</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.B}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.total ? ((grades.B / grades.total) * 100).toFixed(2) : '0.00'}%</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>40 - 49%</td>
                  <td style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>C+, C</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.C}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.total ? ((grades.C / grades.total) * 100).toFixed(2) : '0.00'}%</td>
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>0 - 39%</td>
                  <td style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>C-, D+, D, F</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.F}</td>
                  <td style={{ border: '1px solid #ccc', padding: '8px' }}>{grades.total ? ((grades.F / grades.total) * 100).toFixed(2) : '0.00'}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* CLO Attainment */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold' }}>Course Learning Outcome (CLO) Attainment</h2>
          <div className="table-container" style={{ marginBottom: '16px' }}>
            <table className="data-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>Cohort / Semester</th>
                  {cloKeys.map(k => <th key={k} style={{ textAlign: 'center', border: '1px solid #ccc', padding: '8px' }}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Previous Semester</td>
                  {cloKeys.map(k => (
                    <td key={`prev-${k}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <input 
                        className="no-print"
                        type="text" 
                        value={prevCloScores[k] || ''} 
                        onChange={e => setPrevCloScores(prev => ({...prev, [k]: e.target.value}))}
                        placeholder="%"
                        style={{ width: '50px', textAlign: 'center', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
                      />
                      <span className="only-print">{prevCloScores[k] || '-'}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Current Semester (%)</td>
                  {cloKeys.map(k => <td key={`cur-${k}`} style={{ border: '1px solid #ccc', padding: '8px' }}>{cloMetrics[k].density.toFixed(0)}%</td>)}
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Status (Current)</td>
                  {cloKeys.map(k => {
                    const st = getStatus(cloMetrics[k].density);
                    return <td key={`stat-${k}`} style={{ fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>{st}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            <strong>CLO Status Legend:</strong><br/>
            • <strong>W (Weak / Non-achievement):</strong> 0 – 49%<br/>
            • <strong>S (Satisfactory achievement):</strong> 50% – 74%<br/>
            • <strong>G (Good / Excellent achievement):</strong> 75% – 100%
          </div>

          {renderComparativeBarChart(cloKeys, prevCloScores, cloMetrics)}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* PLO Attainment */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold' }}>Program Learning Outcome (PLO) Attainment</h2>
          <div className="table-container" style={{ marginBottom: '16px', overflowX: 'auto' }}>
            <table className="data-table" style={{ width: '100%', textAlign: 'center', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  <th style={{ textAlign: 'left', border: '1px solid #ccc', padding: '8px' }}>Cohort / Semester</th>
                  {ploKeys.map(k => <th key={k} style={{ textAlign: 'center', border: '1px solid #ccc', padding: '8px' }}>{k}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Previous Semester</td>
                  {ploKeys.map(k => (
                    <td key={`prev-${k}`} style={{ border: '1px solid #ccc', padding: '8px' }}>
                      <input 
                        className="no-print"
                        type="text" 
                        value={prevPloScores[k] || ''} 
                        onChange={e => setPrevPloScores(prev => ({...prev, [k]: e.target.value}))}
                        placeholder="%"
                        style={{ width: '50px', textAlign: 'center', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '4px' }}
                      />
                      <span className="only-print">{prevPloScores[k] || '-'}</span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Current Semester (%)</td>
                  {ploKeys.map(k => <td key={`cur-${k}`} style={{ border: '1px solid #ccc', padding: '8px' }}>{ploMetrics[k].density.toFixed(0)}%</td>)}
                </tr>
                <tr>
                  <td style={{ textAlign: 'left', fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>Status (Current)</td>
                  {ploKeys.map(k => {
                    const st = getStatus(ploMetrics[k].density);
                    return <td key={`stat-${k}`} style={{ fontWeight: 'bold', border: '1px solid #ccc', padding: '8px' }}>{st}</td>;
                  })}
                </tr>
              </tbody>
            </table>
          </div>
          <div style={{ fontSize: '0.85rem', color: '#555' }}>
            <strong>PLO Status Legend:</strong><br/>
            • <strong>W (Weak / Non-achievement):</strong> 0 – 49%<br/>
            • <strong>S (Satisfactory achievement):</strong> 50% – 74%<br/>
            • <strong>G (Good / Excellent achievement):</strong> 75% – 100%
          </div>

          {renderComparativeBarChart(ploKeys, prevPloScores, ploMetrics)}
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* Review and CQI */}
        <div style={{ marginBottom: '40px', pageBreakInside: 'avoid' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '16px', fontWeight: 'bold' }}>Review and Continuous Quality Improvement (CQI)</h2>
          
          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>• General Remarks on the CLO and PLO performance:</strong>
            <textarea 
              className="no-print"
              value={cqiActions['general'] || ''}
              onChange={e => setCqiActions(p => ({...p, general: e.target.value}))}
              placeholder="e.g. The first cohort with 11 PLOs. Achieved all expected achievement."
              style={{ width: '100%', minHeight: '60px', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}
            />
            <div className="only-print" style={{ whiteSpace: 'pre-wrap', paddingLeft: '16px' }}>
              {cqiActions['general'] || 'Nil'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>• Reason(s) for Weak/non-achievement performance:</strong>
            <textarea 
              className="no-print"
              value={cqiActions['reason'] || ''}
              onChange={e => setCqiActions(p => ({...p, reason: e.target.value}))}
              placeholder="e.g. Nil"
              style={{ width: '100%', minHeight: '60px', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}
            />
            <div className="only-print" style={{ whiteSpace: 'pre-wrap', paddingLeft: '16px' }}>
              {cqiActions['reason'] || 'Nil'}
            </div>
          </div>

          <div style={{ marginBottom: '16px' }}>
            <strong style={{ display: 'block', marginBottom: '8px' }}>• Action Plans:</strong>
            <textarea 
              className="no-print"
              value={cqiActions['action'] || ''}
              onChange={e => setCqiActions(p => ({...p, action: e.target.value}))}
              placeholder="e.g. Improved Syllabus content, Delivery method..."
              style={{ width: '100%', minHeight: '60px', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px' }}
            />
            <div className="only-print" style={{ whiteSpace: 'pre-wrap', paddingLeft: '16px' }}>
              {cqiActions['action'] || 'Nil'}
            </div>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* Specific Outcomes Improvement Plan */}
        <div style={{ marginBottom: '24px' }}>
          <h2 style={{ fontSize: '1.2rem', marginBottom: '12px', fontWeight: 'bold' }}>Specific Outcomes Improvement Plan</h2>
          <p className="no-print" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '16px' }}>
            This section automatically identifies CLOs and PLOs that did not meet the required KPIs. Please provide your proposed actions for improvement for each individually.
          </p>

          <div className="table-container">
            <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr>
                  <th style={{ width: '120px', border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Outcome Code</th>
                  <th style={{ width: '180px', border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Target Achieved?</th>
                  <th style={{ border: '1px solid #ccc', padding: '8px', textAlign: 'left' }}>Proposed Action for Improvement</th>
                </tr>
              </thead>
              <tbody>
                {failedCLOs.length === 0 && failedPLOs.length === 0 && (
                  <tr>
                    <td colSpan={3} style={{ textAlign: 'center', padding: '30px', color: '#555', fontStyle: 'italic', border: '1px solid #ccc' }}>
                      🎉 All CLOs and PLOs met the target KPIs. No specific CQI action required.
                    </td>
                  </tr>
                )}
                {failedCLOs.map(code => (
                  <tr key={code}>
                    <td style={{ fontWeight: 'bold', border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>{code}</td>
                    <td style={{ fontSize: '0.85rem', border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                      <strong>Average:</strong> {cloMetrics[code].avgAchieved} <br/>
                      <strong>Density:</strong> {cloMetrics[code].densityAchieved}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                      <textarea 
                        className="no-print"
                        placeholder="Describe the action plan to improve this outcome..." 
                        value={cqiActions[code] || ''}
                        onChange={(e) => setCqiActions(prev => ({ ...prev, [code]: e.target.value }))}
                        style={{ width: '100%', minHeight: '60px', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px', outline: 'none' }}
                      />
                      <div className="only-print" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                        {cqiActions[code] || 'Nil'}
                      </div>
                    </td>
                  </tr>
                ))}
                {failedPLOs.map(code => (
                  <tr key={code}>
                    <td style={{ fontWeight: 'bold', border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>{code}</td>
                    <td style={{ fontSize: '0.85rem', border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                      <strong>Average:</strong> {ploMetrics[code].avgAchieved} <br/>
                      <strong>Density:</strong> {ploMetrics[code].densityAchieved}
                    </td>
                    <td style={{ border: '1px solid #ccc', padding: '8px', verticalAlign: 'top' }}>
                      <textarea 
                        className="no-print"
                        placeholder="Describe the action plan to improve this outcome..." 
                        value={cqiActions[code] || ''}
                        onChange={(e) => setCqiActions(prev => ({ ...prev, [code]: e.target.value }))}
                        style={{ width: '100%', minHeight: '60px', background: 'var(--bg-input)', color: 'var(--text-active)', border: '1px solid var(--border-color)', borderRadius: '4px', padding: '8px', outline: 'none' }}
                      />
                      <div className="only-print" style={{ minHeight: '60px', whiteSpace: 'pre-wrap' }}>
                        {cqiActions[code] || 'Nil'}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <hr style={{ border: 'none', borderTop: '1px solid #ccc', margin: '24px 0' }} />

        {/* Signatures */}
        <div style={{ marginTop: '40px', display: 'flex', flexDirection: 'column', gap: '40px', pageBreakInside: 'avoid' }}>
          <div>
            <strong>Date:</strong> ________________
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '40px', marginTop: '20px' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '40px' }}>[ Signed ]</div>
              <div>____________________</div>
              <div style={{ marginTop: '8px' }}>Course Leader</div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ marginBottom: '40px' }}>[ Signed ]</div>
              <div>____________________</div>
              <div style={{ marginTop: '8px' }}>Head of Program</div>
            </div>
          </div>
        </div>
        
        {API_BASE && activeCourseId && (
          <div className="no-print" style={{ marginTop: '40px', display: 'flex', justifyContent: 'center' }}>
            <button 
              onClick={async () => {
                try {
                  let currentData: any = {};
                  if (courseInfo?.portfolio_data) {
                    currentData = typeof courseInfo.portfolio_data === 'string' ? JSON.parse(courseInfo.portfolio_data) : courseInfo.portfolio_data;
                  }
                  currentData.cqi = { prevCloScores, prevPloScores, cqiActions };
                  
                  const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ portfolioData: currentData })
                  });
                  if (res.ok) {
                    alert("CQI Report saved successfully!");
                    if (onRefresh) onRefresh();
                  } else {
                    alert("Failed to save CQI Report.");
                  }
                } catch (e) {
                  console.error(e);
                  alert("Error saving CQI Report.");
                }
              }}
              style={{
                background: 'var(--primary)',
                color: 'var(--text-primary)',
                padding: '10px 24px',
                border: 'none',
                borderRadius: '6px',
                fontSize: '1rem',
                fontWeight: 'bold',
                cursor: 'pointer'
              }}
            >
              💾 Save CQI Report
            </button>
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {isPrintMode ? (
        printSection ? (
          <>
            {printSection === 'clo' && <div style={{ paddingBottom: '20px' }}>{renderCloTable()}</div>}
            {printSection === 'plo' && <div style={{ paddingBottom: '20px' }}>{renderPloTable()}</div>}
            {printSection === 'student-clo' && <div style={{ paddingBottom: '20px' }}>{renderStudentClo()}</div>}
            {printSection === 'student-plo' && <div style={{ paddingBottom: '20px' }}>{renderStudentPlo()}</div>}
            {printSection === 'cqi' && <div style={{ paddingBottom: '20px' }}>{renderCqiForm()}</div>}
          </>
        ) : (
          <>
            {/* Print Mode: Render all tabs sequentially with page breaks */}
            <div style={{ paddingBottom: '20px' }}>
              {renderCloTable()}
            </div>
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: '20px' }}>
              {renderPloTable()}
            </div>
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: '20px' }}>
              {renderStudentClo()}
            </div>
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: '20px' }}>
              {renderStudentPlo()}
            </div>
            <div style={{ pageBreakBefore: 'always', breakBefore: 'page', paddingTop: '20px' }}>
              {renderCqiForm()}
            </div>
          </>
        )
      ) : (
        <>
          {/* Screen Mode: Sub tabs nav */}
            <div className="no-print" style={{ display: 'flex', gap: '10px', borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
            <button className={`btn ${activeSubTab === 'clo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('clo')}>
              📊 CLO Analysis
            </button>
            <button className={`btn ${activeSubTab === 'plo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('plo')}>
              📊 PLO Analysis
            </button>
            <button className={`btn ${activeSubTab === 'student-clo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('student-clo')}>
              👥 Student CLO
            </button>
            <button className={`btn ${activeSubTab === 'student-plo' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('student-plo')}>
              👥 Student PLO
            </button>
            <button className={`btn ${activeSubTab === 'cqi' ? 'btn-primary' : 'btn-secondary'}`} onClick={() => setActiveSubTab('cqi')}>
              📈 CQI Report
            </button>
            </div>

            {!isPrintMode && activeSubTab !== 'cqi' && (
            <div className="only-print" style={{ marginBottom: '20px' }}>
              <PrintHeader title="OBE Assessment" courseInfo={courseInfo || null} />
            </div>
          )}

          {activeSubTab === 'clo' && renderCloTable()}
          {activeSubTab === 'plo' && renderPloTable()}
          {activeSubTab === 'student-clo' && renderStudentClo()}
          {activeSubTab === 'student-plo' && renderStudentPlo()}
          {activeSubTab === 'cqi' && renderCqiForm()}
        </>
      )}
    </div>
  );
}
