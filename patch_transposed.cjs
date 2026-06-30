const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');

const newRenderCloTable = `  const renderCloTable = () => {
    const cloKeys = Object.keys(cloMetrics).sort();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px', marginBottom: '40px' }}>
        <div className="view-card">
          <h2>CLO Class Target Analysis</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {cloKeys.map(c => <th key={c}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Allocated Weight (%)</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].allocatedMax.toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Middle Marks</td>
                  {cloKeys.map(c => <td key={c}>{(cloMetrics[c].allocatedMax / 2).toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Average Marks</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].averageScore ? cloMetrics[c].averageScore.toFixed(2) : '0.00'}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Percentage Average Marks (%)</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].percentageAverage.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Overall Average Score (%) for each CLO</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].percentageAverage.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>No of students scoring &gt;= 50%</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].passCount || 0}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Density (%) [&gt;= 50%]</td>
                  {cloKeys.map(c => <td key={c}>{cloMetrics[c].density.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Is the targeted Average (&gt;=50%) achieved?</td>
                  {cloKeys.map(c => (
                    <td key={c} style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: cloMetrics[c].avgAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: cloMetrics[c].avgAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {cloMetrics[c].avgAchieved}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Is the targeted Density (&gt;=50%) achieved?</td>
                  {cloKeys.map(c => (
                    <td key={c} style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: cloMetrics[c].densityAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: cloMetrics[c].densityAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {cloMetrics[c].densityAchieved}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphical CLO Bar Chart */}
        <div className="view-card">
          <h2>CLO Average Marks Bar Chart</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {cloKeys.map(cloNo => {
              const m = cloMetrics[cloNo];
              const pct = m.percentageAverage;
              return (
                <div key={cloNo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '80px', fontWeight: 600, fontSize: '0.875rem' }}>{cloNo}</div>
                  <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: \`\${Math.min(pct, 100)}%\`,
                      height: '100%',
                      background: pct >= 50 ? 'var(--grad-secondary)' : 'var(--danger)',
                      borderRadius: '11px',
                      transition: 'width 0.6s ease'
                    }} />
                    <span style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff'
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
  };`;

const newRenderPloTable = `  const renderPloTable = () => {
    const ploKeys = Object.keys(ploMetrics).filter(p => ploMetrics[p].allocatedMax > 0).sort();
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
        <div className="view-card">
          <h2>PLO Class Target Analysis</h2>
          <div className="table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>Metric</th>
                  {ploKeys.map(p => <th key={p}>{p}</th>)}
                </tr>
              </thead>
              <tbody>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Allocated Weight (%)</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].allocatedMax.toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Middle Marks</td>
                  {ploKeys.map(p => <td key={p}>{(ploMetrics[p].allocatedMax / 2).toFixed(2)}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Average Marks</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].averageScore ? ploMetrics[p].averageScore.toFixed(2) : '0.00'}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Percentage Average Marks (%)</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].percentageAverage.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Overall Average Score (%) for each PLO</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].percentageAverage.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>No of students scoring &gt;= 50%</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].passCount || 0}</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Density (%) [&gt;= 50%]</td>
                  {ploKeys.map(p => <td key={p}>{ploMetrics[p].density.toFixed(2)}%</td>)}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Is the targeted Average (&gt;=50%) achieved?</td>
                  {ploKeys.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: ploMetrics[p].avgAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: ploMetrics[p].avgAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {ploMetrics[p].avgAchieved}
                      </span>
                    </td>
                  ))}
                </tr>
                <tr>
                  <td style={{ fontWeight: 'bold' }}>Is the targeted Density (&gt;=50%) achieved?</td>
                  {ploKeys.map(p => (
                    <td key={p} style={{ textAlign: 'center' }}>
                      <span style={{
                        padding: '2px 8px', borderRadius: '4px', fontSize: '0.8rem', fontWeight: 600,
                        background: ploMetrics[p].densityAchieved === 'Yes' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                        color: ploMetrics[p].densityAchieved === 'Yes' ? 'var(--secondary)' : 'var(--danger)'
                      }}>
                        {ploMetrics[p].densityAchieved}
                      </span>
                    </td>
                  ))}
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Graphical PLO Bar Chart */}
        <div className="view-card">
          <h2>PLO Average Marks Bar Chart</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', marginTop: '14px' }}>
            {ploKeys.map(ploNo => {
              const m = ploMetrics[ploNo];
              const pct = m.percentageAverage;
              return (
                <div key={ploNo} style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div style={{ width: '80px', fontWeight: 600, fontSize: '0.875rem' }}>{ploNo}</div>
                  <div style={{ flex: 1, height: '24px', background: 'rgba(255,255,255,0.03)', borderRadius: '12px', border: '1px solid var(--border-color)', overflow: 'hidden', position: 'relative' }}>
                    <div style={{
                      width: \`\${Math.min(pct, 100)}%\`,
                      height: '100%',
                      background: pct >= 50 ? 'var(--grad-secondary)' : 'var(--danger)',
                      borderRadius: '11px',
                      transition: 'width 0.6s ease'
                    }} />
                    <span style={{
                      position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)',
                      fontSize: '0.75rem', fontWeight: 700, color: '#fff'
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
  };`;

// Regex replace for the functions
content = content.replace(/const renderCloTable = \(\) => \{[\s\S]*?return \([\s\S]*?\}\);\n  \};/m, newRenderCloTable);
content = content.replace(/const renderPloTable = \(\) => \{[\s\S]*?return \([\s\S]*?\}\);\n  \};/m, newRenderPloTable);

fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('Transposed tables successfully injected!');
