import React, { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';

type FinalExamDocsProps = {
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

const DOC_KEYS = [
  { key: 'final_exam_doc', label: 'Final Examination / Assessment Document' },
  { key: 'marking_scheme_doc', label: 'Marking Scheme' }
];

export default function FinalExamDocs({ courseInfo, onRefresh, API_BASE, activeCourseId }: FinalExamDocsProps) {
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
        setPortfolio({});
      }
    } else {
      setPortfolio({});
      setInputLinks({});
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
                  
                  {/* Embedded PDF for Print/Export Mode */}
                  {isPdf && (
                    <div className="only-print" style={{ width: '100%', marginTop: '20px', pageBreakInside: 'avoid' }}>
                      <iframe src={fullUrl} style={{ width: '100%', height: '1000px', border: '1px solid #ccc' }} title={item.name || 'PDF Document'} />
                    </div>
                  )}
                  {/* Embedded Image for Print/Export Mode */}
                  {isImg && (
                    <div className="only-print" style={{ width: '100%', marginTop: '20px', pageBreakInside: 'avoid', textAlign: 'center' }}>
                      <img src={fullUrl} alt={item.name || 'Image Document'} style={{ maxWidth: '100%', maxHeight: '1000px', objectFit: 'contain' }} />
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
    <div style={{ padding: '16px' }}>
      <h2 className="no-print" style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--text-active)', marginBottom: '16px' }}>
        Final Exam / Assessment Documents
      </h2>
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Upload the final examination question paper / assessment guidelines and the corresponding marking scheme as a PDF, or provide a direct link.
      </p>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '20px' }}>
        {DOC_KEYS.map(k => renderSlotCard(k.key, k.label))}
      </div>
    </div>
  );
}
