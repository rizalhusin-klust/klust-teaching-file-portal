const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');

const cloOld = `  const renderStudentClo = () => {
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
  };`;

const cloNew = `  const renderStudentClo = () => {
    const clos = Array.from(new Set(assessments.map(a => a.clo_no))).sort();
    return (
      <div className="view-card">
        <h2>Student Personal CLO Breakdown</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Matric ID</th>
                <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Student Name</th>
                {clos.map(c => (
                  <th key={c} colSpan={2} style={{ textAlign: 'center' }}>{c}</th>
                ))}
              </tr>
              <tr>
                {clos.map(c => (
                  <React.Fragment key={c + '-sub'}>
                    <th style={{ textAlign: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>Score</th>
                    <th style={{ textAlign: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>%</th>
                  </React.Fragment>
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
                    const max = cloMetrics?.[c]?.allocatedMax || 0;
                    const pct = max > 0 ? (score / max) * 100 : 0;
                    return (
                      <React.Fragment key={c}>
                        <td style={{ fontWeight: 500, color: 'var(--text-active)', textAlign: 'center' }}>
                          {score.toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--info)', textAlign: 'center' }}>
                          {pct.toFixed(1)}%
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };`;

const ploOld = `  const renderStudentPlo = () => {
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
  };`;

const ploNew = `  const renderStudentPlo = () => {
    const plos = Array.from(new Set(assessments.map(a => a.plo_no))).sort();
    return (
      <div className="view-card">
        <h2>Student Personal PLO Breakdown</h2>
        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Matric ID</th>
                <th rowSpan={2} style={{ verticalAlign: 'middle' }}>Student Name</th>
                {plos.map(p => (
                  <th key={p} colSpan={2} style={{ textAlign: 'center' }}>{p}</th>
                ))}
              </tr>
              <tr>
                {plos.map(p => (
                  <React.Fragment key={p + '-sub'}>
                    <th style={{ textAlign: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>Score</th>
                    <th style={{ textAlign: 'center', fontSize: '0.8rem', background: 'rgba(255,255,255,0.02)' }}>%</th>
                  </React.Fragment>
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
                    const max = ploMetrics?.[p]?.allocatedMax || 0;
                    const pct = max > 0 ? (score / max) * 100 : 0;
                    return (
                      <React.Fragment key={p}>
                        <td style={{ fontWeight: 500, color: 'var(--text-active)', textAlign: 'center' }}>
                          {score.toFixed(2)}
                        </td>
                        <td style={{ fontWeight: 500, color: 'var(--info)', textAlign: 'center' }}>
                          {pct.toFixed(1)}%
                        </td>
                      </React.Fragment>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };`;

// Also need to make sure React.Fragment is available.
// React is usually imported. We can just check.
if (!content.includes('import React')) {
    content = content.replace("import { useState", "import React, { useState");
}

content = content.replace(cloOld, cloNew);
content = content.replace(ploOld, ploNew);

fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('ObeDashboard.tsx patched successfully.');
