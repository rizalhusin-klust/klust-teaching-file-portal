import { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';
import PrintHeader from './PrintHeader';

type TeachingMaterialsProps = {
  courseInfo: CourseInfo | null;
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  programName?: string;
  hidePrintHeader?: boolean;
};

export default function TeachingMaterials({ courseInfo, onRefresh, API_BASE, activeCourseId, hidePrintHeader = false }: TeachingMaterialsProps) {
  const [items, setItems] = useState<{ [key: number]: { type: string, value: string, name?: string } }>({});
  // const [saving, setSaving] = useState(false);
  // const [message, setMessage] = useState({ text: '', type: '' });
  const [uploadingWeek, setUploadingWeek] = useState<number | null>(null);
  const [uploadError, setUploadError] = useState<{ [week: number]: string }>({});
  const [tempLinks, setTempLinks] = useState<{ [key: number]: string }>({});

  useEffect(() => {
    if (courseInfo?.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data);
        const loaded: any = {};
        const tls: any = {};
        for (let w = 1; w <= 14; w++) {
          const key = `teaching_material_week_${w}`;
          if (parsed[key]) {
            loaded[w] = parsed[key];
            if (parsed[key].type === 'link') {
               tls[w] = parsed[key].value;
            }
          }
        }
        setItems(loaded);
        setTempLinks(tls);
      } catch { /* ignore */ }
    }
  }, [courseInfo]);

  const handleLinkChange = (week: number, value: string) => {
    setTempLinks(prev => ({ ...prev, [week]: value }));
  };

  const handleSaveLink = async (week: number) => {
    if (!API_BASE || !activeCourseId) return;
    // setSaving(true);
    try {
      const currentPortfolio = (() => {
        try { return JSON.parse(courseInfo?.portfolio_data || '{}'); } catch { return {}; }
      })();
      const key = `teaching_material_week_${week}`;
      if (tempLinks[week] && tempLinks[week].trim() !== '') {
        currentPortfolio[key] = { type: 'link', value: tempLinks[week].trim() };
      } else {
        delete currentPortfolio[key];
      }
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: currentPortfolio })
      });
      if (res.ok) onRefresh();
    } catch (e) {
      console.error(e);
    } finally {
      // setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, week: number) => {
    const file = e.target.files?.[0];
    if (!file || !activeCourseId) return;

    setUploadingWeek(week);
    setUploadError(prev => ({ ...prev, [week]: '' }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/courses/${activeCourseId}/upload-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key: `teaching_material_week_${week}`,
              filename: file.name,
              base64
            })
          });

          if (!res.ok) throw new Error('Upload failed');
          onRefresh();
        } catch (err: any) {
          setUploadError(prev => ({ ...prev, [week]: err.message || 'Upload failed' }));
        } finally {
          setUploadingWeek(null);
        }
      };
      reader.readAsDataURL(file);
    } catch (err: any) {
      setUploadError(prev => ({ ...prev, [week]: err.message }));
      setUploadingWeek(null);
    }
  };

  return (
    <div className="view-card" style={{ padding: '20px 15px' }}>
      {!hidePrintHeader && (
        <PrintHeader title="Teaching Materials" courseInfo={courseInfo} />
      )}
      
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2>Teaching Materials</h2>
      </div>
      
      <p className="no-print" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Upload files (PDF, images) or provide links (Google Drive, OneDrive) to the teaching materials for each week.
      </p>

      {/* ── Print-Only Table ── */}
      <div className="only-print" style={{ background: '#ffffff', color: '#000000', width: '100%', marginTop: '10px' }}>
        <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', textTransform: 'uppercase' }}>
          Weekly Teaching Materials Summary
        </h3>
        <table className="data-table" style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
          <thead>
            <tr>
              <th style={{ width: '15%', border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'center' }}>Week</th>
              <th style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left' }}>Teaching Material Reference (Link / File Name)</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: 14 }, (_, i) => i + 1).map(week => {
              const item = items[week];
              let ref = '—';
              if (item?.type === 'link') {
                ref = item.value;
              } else if (item?.type === 'file') {
                const rawPath = item.value || '';
                const cleanPath = rawPath.replace(/\\/g, '/');
                ref = item.name || cleanPath.split('/').pop() || 'Uploaded File';
              }
              return (
                <tr key={week}>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', textAlign: 'center', fontWeight: 'bold' }}>Week {week}</td>
                  <td style={{ border: '1px solid #cbd5e1', padding: '8px', wordBreak: 'break-all' }}>{ref}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Screen view: card editor list (hidden during print) */}
      <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {Array.from({ length: 14 }, (_, i) => i + 1).map(week => {
          const item = items[week];
          let fullUrl = '';
          let displayName = 'No Document';
          
          if (item?.type === 'link') {
            fullUrl = item.value;
            displayName = item.value;
          } else if (item?.type === 'file') {
             const rawPath = item.value || '';
             fullUrl = rawPath.startsWith('/') ? `${(API_BASE || '').replace('/api', '')}${rawPath}` : rawPath;
             const cleanPath = rawPath.replace(/\\/g, '/');
             displayName = item.name || cleanPath.split('/').pop() || 'Uploaded File';
          }

          return (
            <div key={week} style={{ 
              display: 'flex', 
              flexDirection: 'column',
              gap: '8px',
              alignItems: 'flex-start',
              padding: '12px',
              background: 'rgba(255,255,255,0.02)',
              border: '1px solid var(--border-color)',
              borderRadius: '6px'
            }}>
              <div style={{ fontWeight: 600, width: '100px' }}>Week {week}</div>
              
              {item ? (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                   <a href={fullUrl} target="_blank" rel="noreferrer" style={{ color: 'var(--primary)', textDecoration: 'underline', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', flex: 1 }}>{displayName}</a>
                   <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', color: 'var(--danger)', borderColor: 'var(--danger)' }} onClick={async () => {
                     if (!activeCourseId) return;
                     const currentPortfolio = JSON.parse(courseInfo?.portfolio_data || '{}');
                     delete currentPortfolio[`teaching_material_week_${week}`];
                     await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
                       method: 'POST',
                       headers: { 'Content-Type': 'application/json' },
                       body: JSON.stringify({ portfolioData: currentPortfolio })
                     });
                     onRefresh();
                   }}>Remove</button>
                 </div>
              ) : (
                 <div style={{ display: 'flex', alignItems: 'center', gap: '12px', width: '100%' }}>
                    <input
                      type="url"
                      placeholder="Enter link..."
                      value={tempLinks[week] || ''}
                      onChange={e => handleLinkChange(week, e.target.value)}
                      style={{ flex: 1, padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)', background: 'var(--bg-input)', color: 'var(--text-active)' }}
                    />
                    <button className="btn btn-primary" onClick={() => handleSaveLink(week)}>Save Link</button>
                    <span style={{ color: 'var(--text-muted)' }}>OR</span>
                    <input
                      type="file"
                      accept="application/pdf, image/jpeg, image/jpg, image/png, application/vnd.openxmlformats-officedocument.wordprocessingml.document, application/vnd.openxmlformats-officedocument.presentationml.presentation"
                      onChange={(e) => handleFileUpload(e, week)}
                      id={`file-upload-week-${week}`}
                      style={{ display: 'none' }}
                    />
                    <label 
                      htmlFor={`file-upload-week-${week}`} 
                      className="btn btn-secondary" 
                      style={{ cursor: 'pointer', margin: 0 }}
                    >
                      {uploadingWeek === week ? '⌛ Uploading...' : '📤 Upload File'}
                    </label>
                 </div>
              )}
              {uploadError[week] && <span style={{ color: 'var(--danger)', fontSize: '0.8rem' }}>{uploadError[week]}</span>}
            </div>
          );
        })}
      </div>
    </div>
  );
}
