import React, { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';

type CourseworkDocsProps = {
  courseInfo: CourseInfo | null;
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
};

type PortfolioItem = {
  type?: 'link' | 'file';
  value?: string;
  name?: string;
};

type PortfolioMap = {
  [key: string]: PortfolioItem;
};

export default function CourseworkDocs({ courseInfo, onRefresh, API_BASE, activeCourseId }: CourseworkDocsProps) {
  const [portfolio, setPortfolio] = useState<PortfolioMap>({});
  const [inputLinks, setInputLinks] = useState<{ [key: string]: string }>({});
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [uploadError, setUploadError] = useState<{ [key: string]: string }>({});
  const [setCount, setSetCount] = useState(1);

  useEffect(() => {
    if (courseInfo && courseInfo.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data) as PortfolioMap;
        setPortfolio(parsed);
        
        // Pre-fill link inputs
        const links: { [key: string]: string } = {};
        let maxIndex = 1;

        Object.keys(parsed).forEach(k => {
          if (parsed[k].type === 'link') {
            links[k] = parsed[k].value || '';
          }
          
          // Check for index in coursework_brief_doc_X or coursework_rubric_doc_X
          const match = k.match(/^coursework_(brief|rubric)_doc(?:_(\d+))?$/);
          if (match) {
            const idx = match[2] ? parseInt(match[2], 10) : 1;
            if (idx > maxIndex) {
              maxIndex = idx;
            }
          }
        });
        
        setInputLinks(links);
        setSetCount(maxIndex);
      } catch (e) {
        console.error('Failed to parse portfolio_data:', e);
        setPortfolio({});
        setSetCount(1);
      }
    } else {
      setPortfolio({});
      setInputLinks({});
      setSetCount(1);
    }
    setUploadError({});
  }, [courseInfo]);

  const handleLinkChange = (key: string, val: string) => {
    setInputLinks(prev => ({ ...prev, [key]: val }));
  };

  const handleSaveLink = async (key: string) => {
    if (activeCourseId === null) return;
    const linkVal = inputLinks[key];
    if (!linkVal || linkVal.trim() === '') return;

    const nextPortfolio = {
      ...portfolio,
      [key]: {
        type: 'link' as const,
        value: linkVal.trim()
      }
    };

    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: nextPortfolio })
      });
      if (res.ok) {
        setPortfolio(nextPortfolio);
        onRefresh();
      } else {
        alert('Failed to save link.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error while saving link.');
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>, key: string) => {
    const file = e.target.files?.[0];
    if (!file || activeCourseId === null) return;

    setUploadingKey(key);
    setUploadError(prev => ({ ...prev, [key]: '' }));

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/courses/${activeCourseId}/upload-portfolio`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              key,
              fileBase64: base64,
              fileName: file.name
            })
          });
          if (res.ok) {
            const data = await res.json();
            setPortfolio(data.portfolio_data);
            onRefresh();
          } else {
            const errData = await res.json();
            setUploadError(prev => ({ ...prev, [key]: errData.error || 'Upload failed.' }));
          }
        } catch (err) {
          console.error(err);
          setUploadError(prev => ({ ...prev, [key]: 'Connection error.' }));
        } finally {
          setUploadingKey(null);
        }
      };
      reader.onerror = () => {
        setUploadError(prev => ({ ...prev, [key]: 'FileReader error.' }));
        setUploadingKey(null);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadError(prev => ({ ...prev, [key]: 'Exception occurred.' }));
      setUploadingKey(null);
    }
  };

  const handleResetSlot = async (key: string) => {
    if (activeCourseId === null) return;
    
    const nextPortfolio = { ...portfolio };
    delete nextPortfolio[key];

    try {
      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: nextPortfolio })
      });
      if (res.ok) {
        setPortfolio(nextPortfolio);
        setInputLinks(prev => {
          const next = { ...prev };
          delete next[key];
          return next;
        });
        onRefresh();
      } else {
        alert('Failed to reset slot.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const renderSlotCard = (key: string, label: string) => {
    const item = portfolio[key];
    const hasFileOrLink = !!(item && item.value);

    return (
      <div 
        key={key} 
        style={{ 
          background: 'var(--bg-card)', 
          border: '1px solid var(--border-color)', 
          borderRadius: '8px', 
          padding: '16px',
          display: 'flex',
          flexDirection: 'column',
          gap: '12px'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
          <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: 'var(--text-active)', flex: 1, paddingRight: '8px' }}>
            {label}
          </h4>
          {hasFileOrLink && (
            <button 
              className="btn btn-secondary" 
              onClick={() => handleResetSlot(key)}
              style={{ padding: '2px 6px', fontSize: '0.75rem', color: 'var(--danger)', border: 'none', background: 'transparent' }}
              title="Reset Slot"
            >
              ❌
            </button>
          )}
        </div>

        {hasFileOrLink ? (
          <div style={{ 
            background: 'rgba(255,255,255,0.02)', 
            border: '1px solid rgba(255,255,255,0.05)', 
            borderRadius: '6px', 
            padding: '10px',
            display: 'flex',
            flexDirection: 'column',
            gap: '10px'
          }}>
            {(() => {
              const fullUrl = item.value?.startsWith('/') ? `${API_BASE.replace('/api', '')}${item.value}` : item.value;
              const isPdf = item.type === 'file' && (item.name?.toLowerCase().endsWith('.pdf') || item.value?.toLowerCase().endsWith('.pdf'));
              const isImg = item.type === 'file' && (item.name?.match(/\.(jpeg|jpg|png)$/i) || item.value?.match(/\.(jpeg|jpg|png)$/i));
              
              return (
                <>
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>
                      {item.type === 'link' ? '🔗' : '📄'}
                    </span>
                    {item.type === 'link' ? (
                      <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                        {item.value}
                      </a>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '240px' }}>
                        {item.name || 'Uploaded File'}
                      </span>
                    )}
                  </div>
                  <div className="no-print" style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
                    {item.type === 'link' ? (
                      <a 
                        href={item.value} 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="btn btn-secondary" 
                        style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                      >
                        ↗️ Open
                      </a>
                    ) : (
                      <>
                        <a 
                          href={fullUrl}
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="btn btn-secondary" 
                          style={{ padding: '4px 8px', fontSize: '0.75rem', display: 'inline-flex', alignItems: 'center', textDecoration: 'none' }}
                        >
                          👁️ Preview
                        </a>
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
                  
                  {/* Hyperlink for Print Mode */}
                  {(isPdf || isImg || item.type === 'link') && (
                    <div className="print-link-only" style={{ marginTop: '10px' }}>
                      {item.type === 'link' ? '🔗' : '📄'} <strong>{item.name || (item.type === 'link' ? 'Provided Link' : 'Uploaded File')}:</strong>{' '}
                      <a href={item.type === 'link' ? item.value : fullUrl} style={{ color: 'blue', textDecoration: 'underline' }}>
                        {item.type === 'link' ? item.value : fullUrl}
                      </a>
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

            <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0' }}>— OR —</div>

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
                {uploadingKey === key ? '⌛ Uploading...' : '📤 Upload PDF'}
              </label>
              {uploadError[key] && (
                <div style={{ color: 'var(--danger)', fontSize: '0.7rem', marginTop: '4px' }}>
                  ⚠️ {uploadError[key]}
                </div>
              )}
            </div>
          </div>
          </>
        )}
      </div>
    );
  };

  return (
    <div className="view-card" style={{ padding: '20px 15px' }}>
      <h2 className="no-print" style={{ fontSize: '1.4rem', marginBottom: '8px' }}>
        Coursework Documents
      </h2>
      <p className="no-print" style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Upload the Coursework Brief and the corresponding Marking Scheme / Rubric as a PDF, or provide a direct link.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {Array.from({ length: setCount }).flatMap((_, i) => {
          const idx = i + 1;
          const suffix = idx === 1 ? '' : `_${idx}`;
          const labelSuffix = idx === 1 ? '' : ` ${idx}`;
          return [
            renderSlotCard(`coursework_brief_doc${suffix}`, `Coursework Brief${labelSuffix}`),
            renderSlotCard(`coursework_rubric_doc${suffix}`, `Marking Scheme / Rubric${labelSuffix}`)
          ];
        })}
      </div>
      
      <div className="no-print" style={{ marginTop: '24px', textAlign: 'center' }}>
        <button 
          className="btn btn-secondary" 
          onClick={() => setSetCount(prev => prev + 1)}
          style={{ padding: '8px 16px', fontSize: '0.9rem', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
        >
          <span style={{ fontSize: '1.2rem' }}>+</span> Add More Coursework Documents
        </button>
      </div>
    </div>
  );
}
