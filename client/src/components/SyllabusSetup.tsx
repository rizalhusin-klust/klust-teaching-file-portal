import React, { useState, useEffect } from 'react';
import type { CloPloMapping, CourseInfo } from '../App';

type SyllabusSetupProps = {
  cloPloMappings: CloPloMapping[];
  clos: { clo_no: string; description: string }[];
  plos: { plo_no: string; description: string }[];
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  courseInfo: CourseInfo | null;
};

export default function SyllabusSetup({ cloPloMappings, clos: closProp, plos: plosProp, onRefresh, API_BASE, activeCourseId, courseInfo }: SyllabusSetupProps) {
  const [localMappings, setLocalMappings] = useState<{ [key: string]: boolean }>({});
  const [localMethods, setLocalMethods] = useState<{ [key: string]: { tm: string; am: string } }>({});
  const [synopsisInput, setSynopsisInput] = useState('');
  const [savingSynopsis, setSavingSynopsis] = useState(false);
  const [synopsisSaved, setSynopsisSaved] = useState(false);

  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState('');

  useEffect(() => {
    setSynopsisInput(courseInfo?.synopsis || '');
  }, [courseInfo]);

  const handleSaveSynopsis = async () => {
    if (activeCourseId === null) return;
    setSavingSynopsis(true);
    setSynopsisSaved(false);
    try {
      await fetch(`${API_BASE}/course-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCourseId,
          synopsis: synopsisInput
        })
      });
      onRefresh();
      setSynopsisSaved(true);
      setTimeout(() => setSynopsisSaved(false), 2000);
    } catch (err) {
      console.error("Failed to save course synopsis:", err);
    } finally {
      setSavingSynopsis(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type !== 'application/pdf') {
      setUploadError('Only PDF files are allowed.');
      return;
    }

    setUploading(true);
    setUploadError('');

    try {
      const reader = new FileReader();
      reader.onload = async () => {
        const base64 = reader.result as string;
        try {
          const res = await fetch(`${API_BASE}/courses/${activeCourseId}/upload-table4`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ pdfBase64: base64 })
          });
          if (res.ok) {
            onRefresh();
          } else {
            const errData = await res.json();
            setUploadError(errData.error || 'Upload failed.');
          }
        } catch (err) {
          console.error(err);
          setUploadError('Upload failed due to connection error.');
        } finally {
          setUploading(false);
        }
      };
      reader.onerror = () => {
        setUploadError('Failed to read file.');
        setUploading(false);
      };
      reader.readAsDataURL(file);
    } catch (err) {
      console.error(err);
      setUploadError('File reader exception.');
      setUploading(false);
    }
  };

  const clos = closProp.map(c => c.clo_no);
  const plos = plosProp.map(p => p.plo_no);

  useEffect(() => {
    const map: { [key: string]: boolean } = {};
    const methods: { [key: string]: { tm: string; am: string } } = {};
    
    cloPloMappings.forEach(m => {
      map[`${m.clo_no}_${m.plo_no}`] = m.is_mapped === 1;
      methods[m.clo_no] = { tm: m.teaching_method || '', am: m.assessment_method || '' };
    });
    
    setLocalMappings(map);
    setLocalMethods(methods);
  }, [cloPloMappings]);


  const handleCheckboxChange = async (cloNo: string, ploNo: string, val: boolean) => {
    if (activeCourseId === null) return;
    const nextVal = val ? 1 : 0;
    const methods = localMethods[cloNo] || { tm: '', am: '' };
    
    // Optimistic local update
    setLocalMappings(prev => ({
      ...prev,
      [`${cloNo}_${ploNo}`]: val
    }));

    try {
      await fetch(`${API_BASE}/clo-plo-mappings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          clo_no: cloNo,
          plo_no: ploNo,
          is_mapped: nextVal,
          teaching_method: methods.tm,
          assessment_method: methods.am,
          course_id: activeCourseId
        })
      });
      onRefresh();
    } catch (err) {
      console.error(err);
    }
  };

  const handleMethodChange = async (cloNo: string, field: 'tm' | 'am', val: string) => {
    if (activeCourseId === null) return;
    const current = localMethods[cloNo] || { tm: '', am: '' };
    const nextMethods = {
      ...current,
      [field]: val
    };

    setLocalMethods(prev => ({
      ...prev,
      [cloNo]: nextMethods
    }));

    // Save mapping update for all PLOs in that CLO
    try {
      const mappedPlo = plos.find(p => localMappings[`${cloNo}_${p}`]);
      if (mappedPlo) {
        await fetch(`${API_BASE}/clo-plo-mappings`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            clo_no: cloNo,
            plo_no: mappedPlo,
            is_mapped: 1,
            teaching_method: nextMethods.tm,
            assessment_method: nextMethods.am,
            course_id: activeCourseId
          })
        });
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };


  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      
      {/* Course Synopsis Card */}
      <div className="view-card no-print">
        <h2>Course Synopsis</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Enter the course description and synopsis.
        </p>
        <div style={{ marginTop: '10px' }}>
          <textarea
            value={synopsisInput}
            onChange={e => setSynopsisInput(e.target.value)}
            onBlur={handleSaveSynopsis}
            className="inline-textarea"
            style={{ width: '100%', minHeight: '100px', marginBottom: '10px' }}
            placeholder="Enter course synopsis..."
          />
          <div style={{ display: 'flex', gap: '10px', alignItems: 'center', justifyContent: 'flex-end' }}>
            {synopsisSaved && <span style={{ color: '#10b981', fontSize: '0.85rem', fontWeight: 'bold' }}>✓ Saved successfully!</span>}
            <button
              onClick={handleSaveSynopsis}
              disabled={savingSynopsis}
              className="btn btn-primary"
              style={{ fontSize: '0.85rem', padding: '6px 16px' }}
            >
              {savingSynopsis ? '💾 Saving...' : '💾 Save Synopsis'}
            </button>
          </div>
        </div>
      </div>

      {/* CLO-PLO Checkbox mapping Grid */}
      <div className="view-card">
        <h2>CLO to PLO Mapping Matrix (Item 8)</h2>
        <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '14px' }}>
          Tick the checkboxes to create links between Course Learning Outcomes (CLO) and Program Learning Outcomes (PLO).
        </p>

        <div className="table-container" style={{ overflowX: 'auto' }}>
          <table className="data-table">
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>CLO</th>
                {plos.map(ploNo => {
                  const ploObj = plosProp.find(p => p.plo_no === ploNo);
                  return (
                    <th
                      key={ploNo}
                      style={{
                        fontSize: '0.725rem',
                        padding: '10px 4px',
                        textAlign: 'center',
                        cursor: 'help',
                        textDecoration: 'underline dotted var(--text-muted)'
                      }}
                      title={ploObj ? ploObj.description : ''}
                    >
                      {ploNo.replace('_', ' ')}
                    </th>
                  );
                })}
                <th style={{ minWidth: '150px' }}>Teaching Method</th>
                <th style={{ minWidth: '150px' }}>Assessment Method</th>
              </tr>
            </thead>
            <tbody>
              {clos.map(cloNo => {
                const methods = localMethods[cloNo] || { tm: '', am: '' };
                const cloObj = closProp.find(c => c.clo_no === cloNo);
                return (
                  <tr key={cloNo}>
                    <td style={{ fontWeight: 'bold', whiteSpace: 'normal', fontSize: '0.85rem', lineHeight: '1.3', padding: '10px' }}>
                      <div style={{ color: 'var(--info)' }}>{cloNo}</div>
                      <div style={{ fontWeight: 'normal', color: 'var(--text-muted)', marginTop: '4px', fontSize: '0.75rem' }}>
                        {cloObj ? cloObj.description : ''}
                      </div>
                    </td>
                    {plos.map(ploNo => {
                      const isMapped = localMappings[`${cloNo}_${ploNo}`] || false;
                      return (
                        <td key={ploNo} style={{ textAlign: 'center', padding: '8px 4px' }}>
                          <input
                            type="checkbox"
                            checked={isMapped}
                            onChange={e => handleCheckboxChange(cloNo, ploNo, e.target.checked)}
                            style={{ width: '16px', height: '16px', cursor: 'pointer' }}
                          />
                        </td>
                      );
                    })}
                    {/* Method dropdowns */}
                    <td>
                      <select
                        value={methods.tm}
                        onChange={e => handleMethodChange(cloNo, 'tm', e.target.value)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-active)', fontSize: '0.8rem', padding: '4px' }}
                      >
                        <option value="">Select Method</option>
                        <option value="Hands on / Labs">Hands on / Labs</option>
                        <option value="Lecture">Lecture</option>
                        <option value="Tutorial">Tutorial</option>
                      </select>
                    </td>
                    <td>
                      <select
                        value={methods.am}
                        onChange={e => handleMethodChange(cloNo, 'am', e.target.value)}
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-color)', borderRadius: '4px', color: 'var(--text-active)', fontSize: '0.8rem', padding: '4px' }}
                      >
                        <option value="">Select Assessment</option>
                        <option value="Tutorial/Assignment">Tutorial/Assignment</option>
                        <option value="Written Exam">Written Exam</option>
                        <option value="Project">Project</option>
                      </select>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>



      {/* Table 4 PDF upload and display */}
      <div className="view-card" style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2>Table 4 (Syllabus Outline PDF Document)</h2>
          {courseInfo?.table4_path && (
            <div>
              <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="replace-table4-upload" />
              <label htmlFor="replace-table4-upload" className="btn btn-secondary" style={{ cursor: 'pointer', fontSize: '0.8rem', padding: '6px 12px' }}>
                🔄 Replace PDF File
              </label>
            </div>
          )}
        </div>

        {uploadError && (
          <div className="alert alert-info" style={{ color: 'var(--danger)', borderColor: 'rgba(239,68,68,0.2)', background: 'rgba(239,68,68,0.1)', marginBottom: 0 }}>
            ⚠️ {uploadError}
          </div>
        )}

        {courseInfo?.table4_path ? (
          <div>
            <iframe
              src={`http://localhost:3001${courseInfo.table4_path}`}
              width="100%"
              height="600px"
              style={{ border: '1px solid var(--border-color)', borderRadius: '8px', background: 'var(--bg-app)' }}
              title="Table 4 PDF Document"
            />
          </div>
        ) : (
          <div style={{ padding: '40px', border: '2px dashed var(--border-color)', borderRadius: '8px', textAlign: 'center', background: 'var(--bg-app)' }}>
            <p style={{ color: 'var(--text-muted)', marginBottom: '16px' }}>No Table 4 PDF has been uploaded for this course yet.</p>
            <input type="file" accept="application/pdf" onChange={handleFileUpload} style={{ display: 'none' }} id="table4-upload" />
            <label htmlFor="table4-upload" className="btn btn-primary" style={{ cursor: 'pointer' }}>
              {uploading ? '⌛ Uploading...' : '📤 Upload Table 4 PDF'}
            </label>
          </div>
        )}
      </div>

    </div>
  );
}
