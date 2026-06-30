const fs = require('fs');
let content = fs.readFileSync('client/src/components/ObeDashboard.tsx', 'utf8');

const cloOld = `          <div className="view-card">
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
          </div>`;

const cloNew = `          <div className="view-card">
            <h2>CLO Class Target Analysis</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>CLO Code</th>
                    <th>Allocated Weight (%)</th>
                    <th>Middle Marks</th>
                    <th>Average Marks</th>
                    <th>Percentage Average Marks (%)</th>
                    <th>Overall Average Score (%) for each CLO</th>
                    <th>No of students scoring equal or more than 50% of the allocated marks</th>
                    <th>Density (%) [Percentage of students scoring equal or more than 50% of the allocated marks]</th>
                    <th style={{ textAlign: 'center' }}>Is the targeted Average (=>50%) achieved?</th>
                    <th style={{ textAlign: 'center' }}>Is the targeted Density (=>50%) achieved?</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(cloMetrics).map(cloNo => {
                    const m = cloMetrics[cloNo];
                    const middleMarks = m.allocatedMax / 2;
                    return (
                      <tr key={cloNo}>
                        <td style={{ fontWeight: 'bold' }}>{cloNo}</td>
                        <td>{m.allocatedMax.toFixed(2)}</td>
                        <td>{middleMarks.toFixed(2)}</td>
                        <td>{m.averageScore ? m.averageScore.toFixed(2) : '0.00'}</td>
                        <td>{m.percentageAverage.toFixed(2)}%</td>
                        <td>{m.percentageAverage.toFixed(2)}%</td>
                        <td>{m.passCount || 0}</td>
                        <td>{m.density.toFixed(2)}%</td>
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
          </div>`;

const ploOld = `          <div className="view-card">
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
                  {Object.keys(ploMetrics)
                    .filter(ploNo => ploMetrics[ploNo].allocatedMax > 0)
                    .map(ploNo => {
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
          </div>`;

const ploNew = `          <div className="view-card">
            <h2>PLO Class Target Analysis</h2>
            <div className="table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>PLO Code</th>
                    <th>Allocated Weight (%)</th>
                    <th>Middle Marks</th>
                    <th>Average Marks</th>
                    <th>Percentage Average Marks (%)</th>
                    <th>Overall Average Score (%) for each PLO</th>
                    <th>No of students scoring equal or more than 50% of the allocated marks</th>
                    <th>Density (%) [Percentage of students scoring equal or more than 50% of the allocated marks]</th>
                    <th style={{ textAlign: 'center' }}>Is the targeted Average (=>50%) achieved?</th>
                    <th style={{ textAlign: 'center' }}>Is the targeted Density (=>50%) achieved?</th>
                  </tr>
                </thead>
                <tbody>
                  {Object.keys(ploMetrics)
                    .filter(ploNo => ploMetrics[ploNo].allocatedMax > 0)
                    .map(ploNo => {
                    const m = ploMetrics[ploNo];
                    const middleMarks = m.allocatedMax / 2;
                    return (
                      <tr key={ploNo}>
                        <td style={{ fontWeight: 'bold' }}>{ploNo}</td>
                        <td>{m.allocatedMax.toFixed(2)}</td>
                        <td>{middleMarks.toFixed(2)}</td>
                        <td>{m.averageScore ? m.averageScore.toFixed(2) : '0.00'}</td>
                        <td>{m.percentageAverage.toFixed(2)}%</td>
                        <td>{m.percentageAverage.toFixed(2)}%</td>
                        <td>{m.passCount || 0}</td>
                        <td>{m.density.toFixed(2)}%</td>
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
          </div>`;

content = content.replace(cloOld, cloNew);
content = content.replace(ploOld, ploNew);

fs.writeFileSync('client/src/components/ObeDashboard.tsx', content, 'utf8');
console.log('ObeDashboard.tsx columns patched successfully.');
