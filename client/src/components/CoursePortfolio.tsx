import React, { useState, useEffect } from 'react';
import type { CourseInfo, Student } from '../App';

export type CoursePortfolioProps = {
  printMode?: 'coursework' | 'exam' | 'misc' | 'all';
  isPrintMode?: boolean;

  courseInfo: CourseInfo | null;
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  students: Student[];
};

type PortfolioItem = {
  type?: 'link' | 'file';
  value?: string;
  name?: string;
  studentMatricId?: string;
};

type PortfolioMap = {
  [key: string]: PortfolioItem;
};

const PORTFOLIO_KEYS = [
  { key: 'timetable', label: 'Timetable Schedule', group: 'general' },
  { key: 'cw_best_1', label: 'CW Best Sample 1', group: 'cw_best' },
  { key: 'cw_best_2', label: 'CW Best Sample 2', group: 'cw_best' },
  { key: 'cw_best_3', label: 'CW Best Sample 3', group: 'cw_best' },
  { key: 'cw_med_1', label: 'CW Medium Sample 1', group: 'cw_med' },
  { key: 'cw_med_2', label: 'CW Medium Sample 2', group: 'cw_med' },
  { key: 'cw_med_3', label: 'CW Medium Sample 3', group: 'cw_med' },
  { key: 'cw_low_1', label: 'CW Low Sample 1', group: 'cw_low' },
  { key: 'cw_low_2', label: 'CW Low Sample 2', group: 'cw_low' },
  { key: 'cw_low_3', label: 'CW Low Sample 3', group: 'cw_low' },

  { key: 'exam_best_1', label: 'Exam Best Sample 1', group: 'exam_best' },
  { key: 'exam_best_2', label: 'Exam Best Sample 2', group: 'exam_best' },
  { key: 'exam_best_3', label: 'Exam Best Sample 3', group: 'exam_best' },
  { key: 'exam_med_1', label: 'Exam Medium Sample 1', group: 'exam_med' },
  { key: 'exam_med_2', label: 'Exam Medium Sample 2', group: 'exam_med' },
  { key: 'exam_med_3', label: 'Exam Medium Sample 3', group: 'exam_med' },
  { key: 'exam_low_1', label: 'Exam Low Sample 1', group: 'exam_low' },
  { key: 'exam_low_2', label: 'Exam Low Sample 2', group: 'exam_low' },
  { key: 'exam_low_3', label: 'Exam Low Sample 3', group: 'exam_low' }
];

export default function CoursePortfolio({ courseInfo, onRefresh, API_BASE, activeCourseId, students, printMode = 'all' }: CoursePortfolioProps) {
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

  const handleSelectStudent = async (key: string, matricId: string) => {
    if (activeCourseId === null) return;

    const currentItem = portfolio[key] || {};
    const nextItem: PortfolioItem = {
      ...currentItem,
      studentMatricId: matricId
    };

    const nextPortfolio = {
      ...portfolio,
      [key]: nextItem
    };

    if (!matricId && !currentItem.value) {
      delete nextPortfolio[key];
    }

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
        alert('Failed to save student selection.');
      }
    } catch (err) {
      console.error(err);
      alert('Connection error.');
    }
  };

  const handleSaveLink = async (key: string) => {
    if (activeCourseId === null) return;
    const linkVal = inputLinks[key] || '';
    const currentItem = portfolio[key] || {};

    const nextItem: PortfolioItem = {
      ...currentItem,
      type: 'link',
      value: linkVal
    };

    const nextPortfolio = {
      ...portfolio,
      [key]: nextItem
    };

    if (!linkVal.trim() && !currentItem.studentMatricId) {
      delete nextPortfolio[key];
    }

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
    const hasValue = !!item;
    const hasFileOrLink = !!(item && item.value);
    const isSample = key.startsWith('cw_') || key.startsWith('exam_');
    const isUploadOnly = key === 'timetable' || key === 'lms_result';

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
          gap: '12px',
          transition: 'transform 0.2s, box-shadow 0.2s'
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <span style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--text-active)' }}>{label}</span>
          {hasValue && (
            <button 
              onClick={() => handleResetSlot(key)} 
              style={{ background: 'transparent', border: 'none', color: 'var(--danger)', fontSize: '0.75rem', cursor: 'pointer' }}
              title="Clear item reference"
            >
              ❌ Reset
            </button>
          )}
        </div>

        {isSample && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <label style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: '500' }}>Student Name:</label>
            <select
              value={item?.studentMatricId || ''}
              onChange={(e) => handleSelectStudent(key, e.target.value)}
              style={{
                background: 'var(--bg-input)',
                border: '1px solid var(--border-color)',
                borderRadius: '4px',
                color: 'var(--text-active)',
                padding: '6px 8px',
                fontSize: '0.8rem',
                width: '100%',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">-- Select Student --</option>
              {students.map(s => (
                <option key={s.matric_id} value={s.matric_id}>
                  {s.name} ({s.matric_id})
                </option>
              ))}
            </select>
          </div>
        )}

        {hasFileOrLink ? (
          <div style={{ background: 'rgba(255,255,255,0.02)', padding: '10px', borderRadius: '6px', display: 'flex', flexDirection: 'column', border: '1px solid rgba(255,255,255,0.05)', gap: '10px' }}>
            {(() => {
              const fullUrl = item.value?.startsWith('/') ? `${API_BASE.replace('/api', '')}${item.value}` : item.value;
              const isPdf = item.type === 'file' && (item.name?.toLowerCase().endsWith('.pdf') || item.value?.toLowerCase().endsWith('.pdf'));
              const isImg = item.type === 'file' && (item.name?.match(/\.(jpeg|jpg|png)$/i) || item.value?.match(/\.(jpeg|jpg|png)$/i));
              
              return (
                <>
                  <div className="no-print" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', overflow: 'hidden', flex: 1, minWidth: 0 }}>
                      <span style={{ fontSize: '1.1rem' }}>{item.type === 'link' ? '🔗' : '📄'}</span>
                      {item.type === 'link' ? (
                        <a href={item.value} target="_blank" rel="noopener noreferrer" style={{ fontSize: '0.8rem', color: '#3b82f6', textDecoration: 'underline', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '500px' }}>
                          {item.value}
                        </a>
                      ) : (
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', maxWidth: '180px' }}>
                          {item.name || 'Uploaded File'}
                        </span>
                      )}
                    </div>
                    <div style={{ display: 'flex', gap: '6px', flexShrink: 0 }}>
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

            {/* Link input — hidden for upload-only slots */}
            {!isUploadOnly && (
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
            )}

            {/* OR divider — only when both options available */}
            {!isUploadOnly && !isSample && (
              <div style={{ textAlign: 'center', fontSize: '0.75rem', color: 'var(--text-muted)', margin: '4px 0' }}>— OR —</div>
            )}

            {/* PDF Upload — hidden for link-only (sample) slots */}
            {!isSample && (
              <div>
                <input
                  type="file"
                  accept="application/pdf"
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
            )}
          </div>
          </>
        )}
      </div>
    );
  };

  const renderGroupSection = (groupKey: string, sectionTitle: string) => {
    const keys = PORTFOLIO_KEYS.filter(k => k.group === groupKey);
    return (
      <div className="view-card" style={{ marginTop: '16px' }}>
        <h3 style={{ fontSize: '1.05rem', color: 'var(--primary)', marginBottom: '14px', borderBottom: '1px solid var(--border-color)', paddingBottom: '8px' }}>
          {sectionTitle}
        </h3>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {keys.map(k => renderSlotCard(k.key, k.label))}
        </div>
      </div>
    );
  };

  // ── Helpers ──────────────────────────────────────────────────────────────
  /*
  const getItemDisplay = (key: string) => {
    const item = portfolio[key];
    if (!item) return '—';
    const parts: string[] = [];
    if (item.studentMatricId) {
      const stu = students.find(s => s.matric_id === item.studentMatricId);
      parts.push(stu ? `${stu.name} (${stu.matric_id})` : item.studentMatricId);
    }
    if (item.value) {
      parts.push(item.type === 'link' ? item.value : (item.name || 'Uploaded File'));
    }
    return parts.join(' | ') || '—';
  };
  */

  const SECTION_GROUPS = [
    {
      title: 'Institutional Documents',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'general')
    },
    {
      title: 'Coursework Student Samples – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_best')
    },
    {
      title: 'Coursework Student Samples – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_med')
    },
    {
      title: 'Coursework Student Samples – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'cw_low')
    },
    {
      title: 'Examination Scripts – Best (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_best')
    },
    {
      title: 'Examination Scripts – Medium (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_med')
    },
    {
      title: 'Examination Scripts – Low (3 items)',
      keys: PORTFOLIO_KEYS.filter(k => k.group === 'exam_low')
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>

      {/* ── Print page CSS ── */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page { size: A4 portrait; margin: 0.5in; }
          .no-print { display: none !important; }
          .only-print { display: block !important; }
          .inline-input, .inline-textarea {
            border: none !important; background: transparent !important;
            color: black !important; padding: 0 !important; resize: none !important;
          }
        }
        @media screen {
          .only-print { display: none !important; }
        }
      `}} />

      {/* ── Print button (hidden in print) ── */}
      <div className="no-print" style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <button className="btn btn-primary" onClick={() => window.print()}>
          🖨️ Print Course Portfolio
        </button>
      </div>

      {/* ── Print-Only Header ── */}
      <div className="only-print teaching-file-cover-container" style={{ maxWidth: '100%', margin: 0, padding: '0 0 1rem 0', borderBottom: '2px solid #1e3a8a', marginBottom: '0.25rem', background: '#ffffff', color: '#000000' }}>
        <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
          <h1 className="cover-title" style={{ textAlign: 'left', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: 700, margin: '0 0 0.25rem 0' }}>
            KUALA LUMPUR UNIVERSITY OF<br />SCIENCE AND TECHNOLOGY
          </h1>
          <div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.3rem', fontWeight: 300, color: '#1e3a8a', margin: '0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {printMode === 'exam' ? 'Examination Script Samples' : printMode === 'coursework' ? 'Coursework Student Samples' : 'Course Portfolio'}
          </div>
        </div>
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.875rem' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase' }}>Course</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155' }}>{courseInfo?.course_code?.toUpperCase()} {courseInfo?.course_name?.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase' }}>Semester</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155' }}>{courseInfo?.semester?.toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase' }}>Lecturer</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155' }}>{courseInfo?.lecturer?.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* ── Print-Only Portfolio Summary Table ── */}
      <div className="only-print" style={{ background: '#ffffff', color: '#000000' }}>
        {SECTION_GROUPS.filter(grp => {
          if (printMode === 'all') return true;
          if (printMode === 'exam' && grp.keys[0]?.group.startsWith('exam')) return true;
          if (printMode === 'coursework' && grp.keys[0]?.group.startsWith('cw')) return true;
          if (printMode === 'misc' && grp.keys[0]?.group === 'general') return true;
          return false;
        }).map(grp => (
          <div key={grp.title} style={{ marginBottom: '20px' }}>
            <h3 style={{ fontSize: '0.9rem', fontWeight: 700, color: '#1e3a8a', borderBottom: '1px solid #1e3a8a', paddingBottom: '4px', marginBottom: '6px', textTransform: 'uppercase' }}>
              {grp.title}
            </h3>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8rem' }}>
              <thead>
                <tr>
                  <th style={{ width: '5%', border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'center' }}>No</th>
                  <th style={{ width: '30%', border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left' }}>Document</th>
                  <th style={{ width: '20%', border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left' }}>Student</th>
                  <th style={{ border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'left' }}>Reference (Link / File)</th>
                  <th style={{ width: '10%', border: '1px solid #cbd5e1', padding: '5px 8px', background: '#f8fafc', color: '#1e3a8a', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {grp.keys.map((k, i) => {
                  const item = portfolio[k.key];
                  const stu = item?.studentMatricId ? students.find(s => s.matric_id === item.studentMatricId) : null;
                  const ref = item?.value ? (item.type === 'link' ? item.value : (item.name || 'Uploaded File')) : '';
                  const filled = !!(item && (item.value || item.studentMatricId));
                  return (
                    <tr key={k.key}>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 8px', textAlign: 'center', color: '#334155' }}>{i + 1}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 8px', fontWeight: 600, color: '#1e293b' }}>{k.label}</td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 8px', color: '#334155', fontSize: '0.75rem' }}>
                        {stu ? `${stu.name}` : (item?.studentMatricId || '—')}
                      </td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 8px', color: '#334155', fontSize: '0.72rem', wordBreak: 'break-all' }}>
                        {ref || '—'}
                      </td>
                      <td style={{ border: '1px solid #e2e8f0', padding: '5px 8px', textAlign: 'center' }}>
                        <span style={{ display: 'inline-block', padding: '2px 6px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 700, background: filled ? '#dcfce7' : '#fef2f2', color: filled ? '#15803d' : '#b91c1c' }}>
                          {filled ? '✓ Done' : '✗ Empty'}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ))}
      </div>

      {/* ── Screen view (existing UI, hidden during print) ── */}
      <div className="no-print">

        {/* Tip Note */}
        <div
          style={{
            borderLeft: '3px solid var(--warning)',
            background: 'rgba(245, 158, 11, 0.06)',
            borderRadius: '0 6px 6px 0',
            padding: '10px 14px',
            marginBottom: '20px',
            display: 'flex',
            gap: '10px',
            alignItems: 'center',
            fontSize: '0.8rem',
            color: 'var(--text-muted)',
            lineHeight: '1.45'
          }}
        >
          <span style={{ fontSize: '1rem', flexShrink: 0 }}>💡</span>
          <span>
            <strong style={{ color: 'var(--text-active)', fontWeight: 600 }}>Tip:</strong> Use shared web links
            (Google Drive, OneDrive, Dropbox) instead of uploading files to save server storage.
          </span>
        </div>

        {/* General Documents Section */}
        {(printMode === 'all' || printMode === 'misc') && (
          <div>
            {renderGroupSection('general', 'Institutional Documents')}
          </div>
        )}

        {/* Coursework Samples Section */}
        {(printMode === 'all' || printMode === 'coursework') && (
          <div className="view-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Coursework Student Samples Portfolio</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Provide folders or scripts containing 3 Best, 3 Medium, and 3 Low student coursework outcomes.
            </p>
            {renderGroupSection('cw_best', 'Best CW Samples (3 items)')}
            {renderGroupSection('cw_med', 'Medium CW Samples (3 items)')}
            {renderGroupSection('cw_low', 'Low CW Samples (3 items)')}
          </div>
        )}

        {/* Exam Script Samples Section */}
        {(printMode === 'all' || printMode === 'exam') && (
          <div className="view-card" style={{ background: 'transparent', border: 'none', boxShadow: 'none', padding: 0 }}>
            <h2 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Examination Script Samples Portfolio</h2>
            <p style={{ fontSize: '0.825rem', color: 'var(--text-muted)', marginBottom: '16px' }}>
              Provide folders or scripts containing 3 Best, 3 Medium, and 3 Low student examination sheets.
            </p>
            {renderGroupSection('exam_best', 'Best Examination Scripts (3 items)')}
            {renderGroupSection('exam_med', 'Medium Examination Scripts (3 items)')}
            {renderGroupSection('exam_low', 'Low Examination Scripts (3 items)')}
          </div>
        )}

      </div>
    </div>
  );
}
