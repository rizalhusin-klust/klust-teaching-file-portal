import React, { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';
import PrintHeader from './PrintHeader';

type MiscDocsProps = {
  courseInfo: CourseInfo | null;
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  programName?: string;
  hidePrintHeader?: boolean;
};

type PortfolioItem = {
  type?: 'link' | 'file';
  value?: string;
  name?: string;
};

type PortfolioMap = {
  [key: string]: PortfolioItem;
};

export default function MiscDocs({ courseInfo, onRefresh, API_BASE, activeCourseId, programName = 'Bachelor of Science (Architectural Studies)', hidePrintHeader = false }: MiscDocsProps) {
  const [portfolio, setPortfolio] = useState<PortfolioMap>({});
  const [inputLinks, setInputLinks] = useState<{ [key: string]: string }>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (courseInfo && courseInfo.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data) as PortfolioMap;
        setPortfolio(parsed);
        
        // Pre-fill link inputs
        const links: { [key: string]: string } = {};
        Object.keys(parsed).forEach(k => {
          if (parsed[k].type === 'link') {
            links[k] = parsed[k].value || '';
          }
        });
        setInputLinks(links);
      } catch (e) {
        console.error('Failed to parse portfolio_data:', e);
      }
    }
  }, [courseInfo]);

  const updatePortfolioData = async (newPortfolio: PortfolioMap) => {
    if (!activeCourseId) return;
    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolio_data: JSON.stringify(newPortfolio) })
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error('Failed to update portfolio data', err);
    }
  };

  const handleLinkChange = (key: string, val: string) => {
    setInputLinks(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveLink = async (key: string) => {
    const val = inputLinks[key];
    if (!val) return;
    const newPortfolio = { ...portfolio, [key]: { type: 'link' as const, value: val } };
    setPortfolio(newPortfolio);
    await updatePortfolioData(newPortfolio);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file || !activeCourseId) return;

    setUploadingKey(key);
    setUploadError(prev => ({ ...prev, [key]: '' }));

    const formData = new FormData();
    formData.append('file', file);
    formData.append('course_id', String(activeCourseId));

    try {
      const res = await fetch(`${API_BASE}/upload`, {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok && data.filepath) {
        const newPortfolio = { ...portfolio, [key]: { type: 'file' as const, value: data.filepath, name: file.name } };
        setPortfolio(newPortfolio);
        await updatePortfolioData(newPortfolio);
      } else {
        setUploadError(prev => ({ ...prev, [key]: data.error || 'Upload failed' }));
      }
    } catch (err) {
      setUploadError(prev => ({ ...prev, [key]: 'Upload error' }));
    } finally {
      setUploadingKey(null);
    }
  };

  const handleRemove = async (key: string) => {
    const newPortfolio = { ...portfolio };
    delete newPortfolio[key];
    setPortfolio(newPortfolio);
    setInputLinks(prev => {
      const newLinks = { ...prev };
      delete newLinks[key];
      return newLinks;
    });
    await updatePortfolioData(newPortfolio);
  };

  const renderSlotCard = (key: string, title: string) => {
    const item = portfolio[key];
    let isPdf = false;
    let isImg = false;
    let fullUrl = '';

    if (item && item.type === 'file' && item.value) {
      const rawPath = item.value;
      const cleanPath = rawPath.replace(/\\/g, '/');
      const filename = cleanPath.split('/').pop();
      fullUrl = `${API_BASE}/uploads/${filename}`;
      
      const lower = filename?.toLowerCase() || '';
      if (lower.endsWith('.pdf')) isPdf = true;
      else if (lower.endsWith('.jpg') || lower.endsWith('.jpeg') || lower.endsWith('.png')) isImg = true;
    }

    return (
      <div key={key} style={{
        background: 'var(--bg-panel)',
        border: '1px solid var(--border-color)',
        borderRadius: '8px',
        padding: '16px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative'
      }}>
        <h3 style={{ fontSize: '1rem', color: 'var(--text-active)', marginBottom: '12px' }}>{title}</h3>
        
        {item ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'var(--bg-input)', padding: '8px', borderRadius: '4px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden' }}>
                <span style={{ fontSize: '1.2rem' }}>{item.type === 'link' ? '🔗' : '📄'}</span>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-active)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.name || (item.type === 'link' ? item.value : 'Uploaded File')}
                </span>
              </div>
              <button 
                className="btn btn-danger" 
                style={{ padding: '4px 8px', fontSize: '0.75rem' }}
                onClick={() => handleRemove(key)}
              >
                Remove
              </button>
            </div>
            
            {(() => {
              if (item.type === 'link') {
                return (
                  <div className="no-print">
                    <a href={item.value} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-block', textDecoration: 'none' }}>
                      ↗️ Open Link
                    </a>
                  </div>
                );
              }
              
              if (!fullUrl) return null;

              return (
                <>
                  <div className="no-print" style={{ display: 'flex', gap: '8px' }}>
                    <a href={fullUrl} target="_blank" rel="noreferrer" className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-block', textDecoration: 'none' }}>
                      👁️ Preview
                    </a>
                    {(isPdf || isImg) && (
                      <>
                        <a 
                          href={fullUrl} 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                          download
                        >
                          ⬇️ Download
                        </a>
                      </>
                    )}
                  </div>
                  
                  {/* Embedded PDF for Export Mode */}
                  {isPdf && (
                    <div className="export-only" style={{ width: '100%', height: '100vh', pageBreakAfter: 'always', breakAfter: 'page', display: 'flex', flexDirection: 'column', marginTop: '20px' }}>
                      <iframe src={fullUrl} style={{ width: '100%', flex: 1, border: 'none', borderRadius: '8px', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)', backgroundColor: '#525659' }} title={item.name || 'PDF Document'} />
                    </div>
                  )}
                  {/* Embedded Image for Export Mode */}
                  {isImg && (
                    <div className="export-only" style={{ width: '100%', height: '100vh', pageBreakAfter: 'always', breakAfter: 'page', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', marginTop: '20px' }}>
                      <img src={fullUrl} alt={item.name || 'Image Document'} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
                    </div>
                  )}
                </>
              );
            })()}
          </div>
        ) : (
          <>
            <div className="only-print" style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontStyle: 'italic' }}>
              No document provided
            </div>
            <div className="no-print" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
            {/* Link input */}
            <div style={{ display: 'flex', gap: '8px' }}>
              <input
                type="url"
                placeholder="Google Drive/OneDrive URL link"
                value={inputLinks[key] || ''}
                onChange={(e) => handleLinkChange(key, e.target.value)}
                style={{
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  borderRadius: '4px',
                  color: 'var(--text-active)',
                  padding: '6px 8px',
                  fontSize: '0.8rem',
                  flex: 1
                }}
              />
              <button 
                className="btn btn-primary" 
                style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                onClick={() => handleSaveLink(key)}
              >
                Save
              </button>
            </div>

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0' }}>?" OR ?"</div>

            {/* PDF Upload */}
            <div>
              <input
                type="file"
                accept="application/pdf, image/jpeg, image/jpg, image/png"
                onChange={(e) => handleFileUpload(e, key)}
                id={`file-upload-${key}`}
                style={{ display: 'none' }}
              />
              <label 
                htmlFor={`file-upload-${key}`} 
                className="btn btn-secondary" 
                style={{ 
                  display: 'block', 
                  textAlign: 'center', 
                  cursor: 'pointer', 
                  fontSize: '0.8rem', 
                  padding: '6px'
                }}
              >
                {uploadingKey === key ? 'O> Uploading...' : 'dY"  Upload PDF'}
              </label>
              {uploadError[key] && (
                <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '4px' }}>
                  s,? {uploadError[key]}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    );
  };

  const getSummaryData = () => {
    const summary = [];
    const timetableKey = 'lecturer_timetable';
    const timetableItem = portfolio[timetableKey];

    summary.push({
      label: 'Lecturer Timetable Schedule',
      item: timetableItem
    });
    return summary;
  };

  return (
      <div className="view-card" style={{ padding: '20px 15px' }}>
        {!hidePrintHeader && (
          <PrintHeader title="Miscellaneous Documents" courseInfo={courseInfo} programName={programName} />
        )}
        
        {/* Print-Only Summary Table */}
        <div className="print-link-only" style={{ marginBottom: '20px' }}>
          <h3 style={{ fontSize: '1.2rem', marginBottom: '10px', color: '#000', borderBottom: '1px solid #ccc', paddingBottom: '4px' }}>
            Miscellaneous Documents Summary
          </h3>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.85rem' }}>
            <thead>
              <tr>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left', width: '35%' }}>Document Type</th>
                <th style={{ border: '1px solid #cbd5e1', padding: '8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left' }}>Uploaded File / Link</th>
              </tr>
            </thead>
            <tbody>
              {getSummaryData().map((row, idx) => {
                let url = '';
                let displayName = 'Not Provided';
                if (row.item) {
                  if (row.item.type === 'link') {
                    url = row.item.value || '';
                    displayName = row.item.value || '';
                  } else if (row.item.type === 'file') {
                    const rawPath = row.item.value || '';
                    const cleanPath = rawPath.replace(/\\/g, '/');
                    const filename = cleanPath.split('/').pop() || '';
                    url = `${API_BASE}/uploads/${filename}`;
                    displayName = row.item.name || filename || 'Uploaded File';
                  }
                }
                
                return (
                  <tr key={idx}>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', fontWeight: 'bold', color: '#334155' }}>{row.label}</td>
                    <td style={{ border: '1px solid #cbd5e1', padding: '8px', color: '#334155' }}>
                      {row.item ? (
                        <a href={url} style={{ color: 'blue', textDecoration: 'underline' }}>{displayName}</a>
                      ) : (
                        <span style={{ fontStyle: 'italic', color: '#64748b' }}>Not Provided</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <h2 className="no-print" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
          Miscellaneous Documents
        </h2>
        <p className="no-print" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
          Upload up to 5 Miscellaneous Documents. You can upload PDFs/Images or provide direct links to cloud storage folders.
        </p>

        <div className="no-print" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
          {renderSlotCard('lecturer_timetable', 'Lecturer Timetable Schedule')}
        </div>
      </div>
    );
  }
