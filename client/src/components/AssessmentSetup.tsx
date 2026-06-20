import React, { useState } from 'react';
import type { Assessment, OptionalGroup, PlannedAssessment, CourseInfo } from '../App';

type AssessmentSetupProps = {
  assessments: Assessment[];
  optionalGroups: OptionalGroup[];
  clos: { clo_no: string; description: string }[];
  plos: { plo_no: string; description: string }[];
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  plannedAssessments: PlannedAssessment[];
  courseInfo: CourseInfo | null;
  
};

export default function AssessmentSetup({
  assessments,
  optionalGroups,
  clos,
  plos,
  onRefresh,
  API_BASE,
  activeCourseId,
  plannedAssessments,
  courseInfo
}: AssessmentSetupProps) {
  // Add specification item states
  const [type, setType] = useState<'CW' | 'E'>('CW');
  const [title, setTitle] = useState('');
  const [section, setSection] = useState('');
  const [questionNo, setQuestionNo] = useState('');
  const [weightage, setWeightage] = useState(5.0);
  const [maxMark, setMaxMark] = useState(10.0);
  const [cloNo, setCloNo] = useState('');
  const [ploNo, setPloNo] = useState('');
  const [optionalGroupId, setOptionalGroupId] = useState<number | null>(null);
  const [description, setDescription] = useState('');

  // Editing specification item states
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editType, setEditType] = useState<'CW' | 'E'>('CW');
  const [editTitle, setEditTitle] = useState('');
  const [editSection, setEditSection] = useState('');
  const [editQuestionNo, setEditQuestionNo] = useState('');
  const [editWeightage, setEditWeightage] = useState(5.0);
  const [editMaxMark, setEditMaxMark] = useState(10.0);
  const [editCloNo, setEditCloNo] = useState('');
  const [editPloNo, setEditPloNo] = useState('');
  const [editOptionalGroupId, setEditOptionalGroupId] = useState<number | null>(null);
  const [editDescription, setEditDescription] = useState('');

  // Planned Assessment configuration states
  const [plannedTitle, setPlannedTitle] = useState('');
  const [plannedType, setPlannedType] = useState<'CW' | 'E'>('CW');
  const [plannedWeightage, setPlannedWeightage] = useState(10.0);
  const [editingPlannedId, setEditingPlannedId] = useState<number | null>(null);
  const [showPlannedForm, setShowPlannedForm] = useState(false);

  // Target Distribution state
  const targetCw = courseInfo?.cw_weightage ?? 50.0;
  const targetEx = courseInfo?.ex_weightage ?? 50.0;

  const [cwInput, setCwInput] = useState(targetCw);
  const [exInput, setExInput] = useState(targetEx);
  const [isEditingDist, setIsEditingDist] = useState(false);

  // Sync inputs on courseInfo change
  React.useEffect(() => {
    setCwInput(courseInfo?.cw_weightage ?? 50.0);
    setExInput(courseInfo?.ex_weightage ?? 50.0);
  }, [courseInfo]);

  React.useEffect(() => {
    if (clos.length > 0 && !cloNo) {
      setCloNo(clos[0].clo_no);
    }
  }, [clos, cloNo]);

  React.useEffect(() => {
    if (plos.length > 0 && !ploNo) {
      setPloNo(plos[0].plo_no);
    }
  }, [plos, ploNo]);

  const [showAddForm, setShowAddForm] = useState(false);
  const [printOrientation, setPrintOrientation] = useState<'landscape' | 'portrait'>('landscape');
  const [printPaperSize, setPrintPaperSize] = useState<'A4' | 'A3'>('A4');

  // Double scrollbar and drag-to-scroll refs and states
  const topScrollRef = React.useRef<HTMLDivElement>(null);
  const tableContainerRef = React.useRef<HTMLDivElement>(null);
  const tableRef = React.useRef<HTMLTableElement>(null);

  const [tableWidth, setTableWidth] = useState(0);
  const isSyncingRef = React.useRef(false);

  const [isDown, setIsDown] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeftState, setScrollLeftState] = useState(0);

  // Sync scroll positions
  const handleTopScroll = () => {
    if (isSyncingRef.current) return;
    if (topScrollRef.current && tableContainerRef.current) {
      isSyncingRef.current = true;
      tableContainerRef.current.scrollLeft = topScrollRef.current.scrollLeft;
      isSyncingRef.current = false;
    }
  };

  const handleTableScroll = () => {
    if (isSyncingRef.current) return;
    if (topScrollRef.current && tableContainerRef.current) {
      isSyncingRef.current = true;
      topScrollRef.current.scrollLeft = tableContainerRef.current.scrollLeft;
      isSyncingRef.current = false;
    }
  };

  // Drag to scroll handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    if (target.closest('button') || target.closest('select') || target.closest('input') || target.closest('a')) {
      return;
    }
    if (!tableContainerRef.current) return;
    setIsDown(true);
    setStartX(e.pageX - tableContainerRef.current.offsetLeft);
    setScrollLeftState(tableContainerRef.current.scrollLeft);
  };

  const handleMouseLeave = () => {
    setIsDown(false);
  };

  const handleMouseUp = () => {
    setIsDown(false);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDown || !tableContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - tableContainerRef.current.offsetLeft;
    const walk = (x - startX) * 1.5;
    tableContainerRef.current.scrollLeft = scrollLeftState - walk;
  };

  // Measure table width
  React.useEffect(() => {
    const measureTable = () => {
      if (tableRef.current) {
        setTableWidth(tableRef.current.scrollWidth);
      }
    };

    const timer = setTimeout(measureTable, 100);

    window.addEventListener('resize', measureTable);
    return () => {
      clearTimeout(timer);
      window.removeEventListener('resize', measureTable);
    };
  }, [assessments, activeCourseId, showAddForm, editingId]);

  // Mapped weightage helper
  const getMappedWeightage = (titleStr: string) => {
    return assessments
      .filter(a => a.title === titleStr)
      .reduce((acc, curr) => acc + curr.weightage, 0);
  };


  const handleEditClick = (a: Assessment) => {
    setEditingId(a.id);
    setEditType(a.type);
    setEditTitle(a.title);
    setEditSection(a.section || '');
    setEditQuestionNo(a.question_no);
    setEditWeightage(a.weightage);
    setEditMaxMark(a.max_mark);
    setEditCloNo(a.clo_no);
    setEditPloNo(a.plo_no);
    setEditOptionalGroupId(a.optional_group_id);
    setEditDescription(a.description || '');
    setShowAddForm(false); // hide add form if editing
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editTitle || !editQuestionNo) return alert('Title and Question No are required!');
    if (activeCourseId === null) return alert('No active course selected.');

    try {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingId,
          type: editType,
          title: editTitle,
          section: editSection || editTitle,
          question_no: editQuestionNo,
          weightage: editWeightage,
          max_mark: editMaxMark,
          clo_no: editCloNo,
          plo_no: editPloNo,
          optional_group_id: editOptionalGroupId,
          course_id: activeCourseId,
          description: editDescription
        })
      });
      if (res.ok) {
        setEditingId(null);
        onRefresh();
      } else {
        alert('Failed to save assessment item.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !questionNo) return alert('Title and Question No are required!');
    if (activeCourseId === null) return alert('No active course selected.');

    try {
      const res = await fetch(`${API_BASE}/assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type,
          title,
          section: section || title,
          question_no: questionNo,
          weightage,
          max_mark: maxMark,
          clo_no: cloNo,
          plo_no: ploNo,
          optional_group_id: optionalGroupId,
          course_id: activeCourseId,
          description: description
        })
      });
      if (res.ok) {
        setTitle('');
        setSection('');
        setQuestionNo('');
        setWeightage(5.0);
        setMaxMark(10.0);
        setOptionalGroupId(null);
        setDescription('');
        setShowAddForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this assessment item? All entered student marks for this item will be lost.')) return;
    
    try {
      const res = await fetch(`${API_BASE}/assessments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Planned Assessments CRUD Handlers
  const handleSavePlanned = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!plannedTitle.trim()) return alert('Title is required!');
    if (activeCourseId === null) return alert('No active course selected.');

    try {
      const res = await fetch(`${API_BASE}/planned-assessments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: editingPlannedId,
          title: plannedTitle.trim(),
          type: plannedType,
          weightage: plannedWeightage,
          course_id: activeCourseId
        })
      });
      if (res.ok) {
        setPlannedTitle('');
        setPlannedType('CW');
        setPlannedWeightage(10.0);
        setEditingPlannedId(null);
        setShowPlannedForm(false);
        onRefresh();
      } else {
        alert('Failed to save planned assessment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleEditPlanned = (p: PlannedAssessment) => {
    setEditingPlannedId(p.id);
    setPlannedTitle(p.title);
    setPlannedType(p.type);
    setPlannedWeightage(p.weightage);
    setShowPlannedForm(true);
  };

  const handleDeletePlanned = async (id: number, titleStr: string) => {
    const hasItems = assessments.some(a => a.title === titleStr);
    if (hasItems) {
      alert(`Cannot delete planned assessment "${titleStr}" because there are specification items mapped to it. Please delete those items or map them to another assessment title first.`);
      return;
    }
    if (!confirm(`Are you sure you want to delete planned assessment "${titleStr}"?`)) return;

    try {
      const res = await fetch(`${API_BASE}/planned-assessments/${id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      } else {
        alert('Failed to delete planned assessment.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Save Target Distribution Handler
  const handleSaveDistribution = async (e: React.FormEvent) => {
    e.preventDefault();
    if (activeCourseId === null) return;

    const total = Number(cwInput) + Number(exInput);
    if (Math.abs(total - 100.0) > 0.01) {
      alert("Total weightage distribution must sum up to exactly 100%!");
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/course-info`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: activeCourseId,
          cw_weightage: Number(cwInput),
          ex_weightage: Number(exInput)
        })
      });
      if (res.ok) {
        alert('Assessment target distribution updated successfully!');
        setIsEditingDist(false);
        onRefresh();
      } else {
        alert('Failed to save target distribution.');
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Dynamic input changes (auto-compute remaining to sum to 100%)
  const handleCwInput = (val: string) => {
    const num = parseFloat(val) || 0;
    setCwInput(num);
    setExInput(Number((100.0 - num).toFixed(2)));
  };

  const handleExInput = (val: string) => {
    const num = parseFloat(val) || 0;
    setExInput(num);
    setCwInput(Number((100.0 - num).toFixed(2)));
  };

  // Compute cumulative values
  const totalWeight = assessments.reduce((acc, curr) => acc + curr.weightage, 0);

  const plannedCwSum = plannedAssessments
    .filter(p => p.type === 'CW')
    .reduce((acc, curr) => acc + curr.weightage, 0);

  const plannedExSum = plannedAssessments
    .filter(p => p.type === 'E')
    .reduce((acc, curr) => acc + curr.weightage, 0);

  const totalPlannedSum = plannedCwSum + plannedExSum;

  const cwMatch = Math.abs(plannedCwSum - targetCw) < 0.01;
  const exMatch = Math.abs(plannedExSum - targetEx) < 0.01;
  const totalMatch = Math.abs(totalPlannedSum - 100.0) < 0.01;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Inject Print Page orientation and size style dynamically */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: ${printPaperSize} ${printOrientation};
            margin: 0.5in;
          }
        }
      `}} />
      

      {/* 0. Target Weightage Distribution config card */}
      <div className="view-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2>Course Assessment Target Weightage Distribution</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Configure the overall split distribution between Coursework and Final Examination (must total exactly 100%).
            </p>
          </div>
          {!isEditingDist && (
            <button className="btn btn-secondary no-print" onClick={() => setIsEditingDist(true)}>
              ✏️ Edit Target Distribution
            </button>
          )}
        </div>

        {isEditingDist ? (
          <form onSubmit={handleSaveDistribution} style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
              <label>Coursework (CW) Target %</label>
              <input type="number" step="0.1" min="0" max="100" value={cwInput} onChange={e => handleCwInput(e.target.value)} required />
            </div>
            <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
              <label>Examination (E) Target %</label>
              <input type="number" step="0.1" min="0" max="100" value={exInput} onChange={e => handleExInput(e.target.value)} required />
            </div>
            <div className="form-group" style={{ width: '120px', marginBottom: 0 }}>
              <label>Total %</label>
              <input type="text" value="100.0%" disabled style={{ background: 'rgba(255,255,255,0.05)', cursor: 'not-allowed', color: 'var(--secondary)', fontWeight: 'bold' }} />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>Save Target</button>
              <button type="button" className="btn btn-secondary" style={{ height: '40px' }} onClick={() => {
                setCwInput(targetCw);
                setExInput(targetEx);
                setIsEditingDist(false);
              }}>Cancel</button>
            </div>
          </form>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', background: 'rgba(255,255,255,0.01)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Coursework (CW)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--secondary)' }}>{targetCw.toFixed(1)}%</span>
              <span style={{ fontSize: '0.75rem', color: cwMatch ? 'var(--secondary)' : 'var(--warning)' }}>
                {cwMatch ? '✅ Mapped sum matches target' : `⚠️ Planned: ${plannedCwSum.toFixed(2)}% (Diff: ${(plannedCwSum - targetCw).toFixed(2)}%)`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Target Examination (E)</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: 'var(--primary)' }}>{targetEx.toFixed(1)}%</span>
              <span style={{ fontSize: '0.75rem', color: exMatch ? 'var(--secondary)' : 'var(--warning)' }}>
                {exMatch ? '✅ Mapped sum matches target' : `⚠️ Planned: ${plannedExSum.toFixed(2)}% (Diff: ${(plannedExSum - targetEx).toFixed(2)}%)`}
              </span>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
              <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Overall Target</span>
              <span style={{ fontSize: '1.4rem', fontWeight: 700, color: '#fff' }}>100.0%</span>
              <span style={{ fontSize: '0.75rem', color: totalMatch ? 'var(--secondary)' : 'var(--warning)' }}>
                {totalMatch ? '✅ Perfect 100% planned scheme' : `⚠️ Total Planned: ${totalPlannedSum.toFixed(2)}%`}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* 1. Planned Assessments panel */}
      <div className="view-card">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
          <div>
            <h2>Planned Assessments Scheme</h2>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', margin: '4px 0 0 0' }}>
              Create planned assessments representing course boundaries. Their sums must equal the coursework and exam targets.
            </p>
          </div>
          <button
            className="btn btn-secondary no-print"
            onClick={() => {
              setShowPlannedForm(!showPlannedForm);
              if (showPlannedForm) {
                setEditingPlannedId(null);
                setPlannedTitle('');
              }
            }}
          >
            {showPlannedForm ? 'Close Plan Form' : '➕ Plan Assessment'}
          </button>
        </div>

        {showPlannedForm && (
          <form onSubmit={handleSavePlanned} className="no-print" style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid var(--border-color)', marginBottom: '16px', display: 'flex', gap: '16px', alignItems: 'flex-end', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ flex: 1, minWidth: '200px', marginBottom: 0 }}>
              <label>Assessment Title *</label>
              <input type="text" value={plannedTitle} onChange={e => setPlannedTitle(e.target.value)} placeholder="e.g. Test 1, Assignment 1, Final Examination" required />
            </div>
            <div className="form-group" style={{ width: '180px', marginBottom: 0 }}>
              <label>Type</label>
              <select value={plannedType} onChange={e => setPlannedType(e.target.value as 'CW' | 'E')}>
                <option value="CW">Coursework (CW)</option>
                <option value="E">Examination (E)</option>
              </select>
            </div>
            <div className="form-group" style={{ width: '150px', marginBottom: 0 }}>
              <label>Weightage (%) *</label>
              <input type="number" step="0.1" value={plannedWeightage} onChange={e => setPlannedWeightage(parseFloat(e.target.value))} required />
            </div>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button type="submit" className="btn btn-primary" style={{ height: '40px' }}>
                {editingPlannedId ? 'Update Plan' : 'Save Plan'}
              </button>
              {editingPlannedId && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  style={{ height: '40px' }}
                  onClick={() => {
                    setEditingPlannedId(null);
                    setPlannedTitle('');
                    setShowPlannedForm(false);
                  }}
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        )}

        <div className="table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>Planned Assessment Title</th>
                <th>Type</th>
                <th>Planned Weightage</th>
                <th>Mapped Weightage (Items)</th>
                <th>Status Mapping</th>
                <th className="no-print" style={{ textAlign: 'center' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {plannedAssessments.length === 0 ? (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', color: 'var(--text-muted)', padding: '16px' }}>
                    No planned assessments configured. Configure a planned assessment to start mapping items.
                  </td>
                </tr>
              ) : (
                plannedAssessments.map(p => {
                  const mappedVal = getMappedWeightage(p.title);
                  const isMatch = Math.abs(mappedVal - p.weightage) < 0.01;
                  return (
                    <tr key={p.id}>
                      <td style={{ fontWeight: 'bold' }}>{p.title}</td>
                      <td>
                        <span style={{
                          padding: '2px 6px',
                          borderRadius: '4px',
                          fontSize: '0.75rem',
                          fontWeight: 600,
                          background: p.type === 'CW' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                          color: p.type === 'CW' ? 'var(--secondary)' : 'var(--primary)'
                        }}>
                          {p.type === 'CW' ? 'CW' : 'Exam'}
                        </span>
                      </td>
                      <td style={{ fontWeight: '600' }}>{p.weightage.toFixed(2)}%</td>
                      <td>{mappedVal.toFixed(2)}%</td>
                      <td>
                        {isMatch ? (
                          <span style={{ color: 'var(--secondary)', fontWeight: 600, fontSize: '0.825rem' }}>✅ Fully Mapped</span>
                        ) : (
                          <span style={{ color: 'var(--warning)', fontWeight: 600, fontSize: '0.825rem' }}>
                            ⚠️ {mappedVal < p.weightage ? `Short of ${(p.weightage - mappedVal).toFixed(2)}%` : `Exceeds ${(mappedVal - p.weightage).toFixed(2)}%`}
                          </span>
                        )}
                      </td>
                      <td className="no-print" style={{ textAlign: 'center' }}>
                        <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                          <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditPlanned(p)}>
                            ✏️ Edit
                          </button>
                          <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDeletePlanned(p.id, p.title)}>
                            🗑️ Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      {editingId === null && (
        <div className="no-print">
          <button className="btn btn-primary" onClick={() => setShowAddForm(!showAddForm)} disabled={plannedAssessments.length === 0}>
            {showAddForm ? 'Close Add Form' : '➕ Add Specification Item'}
          </button>
          {plannedAssessments.length === 0 && (
            <span style={{ marginLeft: '12px', fontSize: '0.85rem', color: 'var(--warning)' }}>
              ⚠️ You must plan at least one assessment title above before you can add items.
            </span>
          )}
        </div>
      )}

      {/* Edit Specification Item Form */}
      {editingId !== null && (
        <div className="view-card no-print">
          <h2>Edit Specification Item</h2>
          <form onSubmit={handleEditSubmit} className="form-grid">
            <div className="form-group">
              <label>Assessment Title (Planned Scheme) *</label>
              <select
                value={editTitle}
                onChange={e => {
                  const val = e.target.value;
                  setEditTitle(val);
                  const planned = plannedAssessments.find(p => p.title === val);
                  if (planned) {
                    setEditType(planned.type);
                  }
                }}
                required
              >
                <option value="">-- Select Title --</option>
                {plannedAssessments.map(p => (
                  <option key={p.id} value={p.title}>{p.title} ({p.type} - {p.weightage}%)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assessment Class (Read-Only)</label>
              <select value={editType} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                <option value="CW">Coursework (CW)</option>
                <option value="E">Examination (E)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Section / Task Group</label>
              <input type="text" value={editSection} onChange={e => setEditSection(e.target.value)} placeholder="e.g. Part A, Test 1, HS" />
            </div>
            <div className="form-group">
              <label>Question / Task No *</label>
              <input type="text" value={editQuestionNo} onChange={e => setEditQuestionNo(e.target.value)} placeholder="e.g. A1, A2, 1" required />
            </div>
            <div className="form-group">
              <label>Assessment Weightage (%) *</label>
              <input type="number" step="0.01" value={editWeightage} onChange={e => setEditWeightage(parseFloat(e.target.value))} required />
            </div>
            <div className="form-group">
              <label>Maximum Raw Mark *</label>
              <input type="number" step="0.1" value={editMaxMark} onChange={e => setEditMaxMark(parseFloat(e.target.value))} required />
            </div>
            <div className="form-group">
              <label>Course Learning Outcome (CLO)</label>
              <select value={editCloNo} onChange={e => setEditCloNo(e.target.value)}>
                {clos.map(c => (
                  <option key={c.clo_no} value={c.clo_no}>{c.clo_no} - {c.description}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Program Learning Outcome (PLO)</label>
              <select value={editPloNo} onChange={e => setEditPloNo(e.target.value)}>
                {plos.map(p => (
                  <option key={p.plo_no} value={p.plo_no}>{p.plo_no} - {p.description}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Optional Question Group</label>
              <select value={editOptionalGroupId || ''} onChange={e => setEditOptionalGroupId(e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">Compulsory (No group)</option>
                {optionalGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name} (Best {g.max_selectable})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Question / Item Description</label>
              <input type="text" value={editDescription} onChange={e => setEditDescription(e.target.value)} placeholder="e.g. Practical exercise on 3D extrusion, theory MCQ question, etc." />
            </div>
            <div style={{ display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Changes</button>
              <button type="button" className="btn btn-secondary" onClick={() => setEditingId(null)} style={{ flex: 1 }}>Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Add Specification Item Form */}
      {showAddForm && editingId === null && (
        <div className="view-card no-print">
          <h2>Create Specification Item</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Assessment Title (Planned Scheme) *</label>
              <select
                value={title}
                onChange={e => {
                  const val = e.target.value;
                  setTitle(val);
                  const planned = plannedAssessments.find(p => p.title === val);
                  if (planned) {
                    setType(planned.type);
                  }
                }}
                required
              >
                <option value="">-- Select Title --</option>
                {plannedAssessments.map(p => (
                  <option key={p.id} value={p.title}>{p.title} ({p.type} - {p.weightage}%)</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Assessment Class (Auto-selected)</label>
              <select value={type} disabled style={{ opacity: 0.7, cursor: 'not-allowed' }}>
                <option value="CW">Coursework (CW)</option>
                <option value="E">Examination (E)</option>
              </select>
            </div>
            <div className="form-group">
              <label>Section / Task Group</label>
              <input type="text" value={section} onChange={e => setSection(e.target.value)} placeholder="e.g. Part A, Test 1, HS" />
            </div>
            <div className="form-group">
              <label>Question / Task No *</label>
              <input type="text" value={questionNo} onChange={e => setQuestionNo(e.target.value)} placeholder="e.g. A1, A2, 1" required />
            </div>
            <div className="form-group">
              <label>Assessment Weightage (%) *</label>
              <input type="number" step="0.01" value={weightage} onChange={e => setWeightage(parseFloat(e.target.value))} required />
            </div>
            <div className="form-group">
              <label>Maximum Raw Mark *</label>
              <input type="number" step="0.1" value={maxMark} onChange={e => setMaxMark(parseFloat(e.target.value))} required />
            </div>
            <div className="form-group">
              <label>Course Learning Outcome (CLO)</label>
              <select value={cloNo} onChange={e => setCloNo(e.target.value)}>
                {clos.map(c => (
                  <option key={c.clo_no} value={c.clo_no}>{c.clo_no} - {c.description}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Program Learning Outcome (PLO)</label>
              <select value={ploNo} onChange={e => setPloNo(e.target.value)}>
                {plos.map(p => (
                  <option key={p.plo_no} value={p.plo_no}>{p.plo_no} - {p.description}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label>Optional Question Group</label>
              <select value={optionalGroupId || ''} onChange={e => setOptionalGroupId(e.target.value ? parseInt(e.target.value) : null)}>
                <option value="">Compulsory (No group)</option>
                {optionalGroups.map(g => (
                  <option key={g.id} value={g.id}>{g.group_name} (Best {g.max_selectable})</option>
                ))}
              </select>
            </div>
            <div className="form-group" style={{ gridColumn: 'span 2' }}>
              <label>Question / Item Description</label>
              <input type="text" value={description} onChange={e => setDescription(e.target.value)} placeholder="e.g. Practical exercise on 3D extrusion, theory MCQ question, etc." />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Create Item</button>
            </div>
          </form>
        </div>
      )}

      {/* Roster list of Assessments */}
      <div className="view-card">
        <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '12px' }}>
          <div>
            <h2 className="no-print" style={{ marginBottom: '4px' }}>Table of Specification (TOS)</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>🖨️ Size:</span>
                <select
                  value={printPaperSize}
                  onChange={e => setPrintPaperSize(e.target.value as 'A4' | 'A3')}
                  style={{
                    background: 'var(--bg-app)',
                    color: 'var(--text-active)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="A4">A4</option>
                  <option value="A3">A3</option>
                </select>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span>Orientation:</span>
                <select
                  value={printOrientation}
                  onChange={e => setPrintOrientation(e.target.value as 'landscape' | 'portrait')}
                  style={{
                    background: 'var(--bg-app)',
                    color: 'var(--text-active)',
                    border: '1px solid var(--border-color)',
                    borderRadius: '4px',
                    padding: '2px 8px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                    cursor: 'pointer',
                    outline: 'none'
                  }}
                >
                  <option value="landscape">Landscape</option>
                  <option value="portrait">Portrait</option>
                </select>
              </div>
            </div>
          </div>
          <span style={{ fontSize: '0.9rem', fontWeight: 600, color: 'var(--primary)' }}>
            Cumulative Item Weightage: {totalWeight.toFixed(2)}%
          </span>
        </div>
        
        {/* Top scrollbar helper */}
        {tableWidth > 0 && (
          <div
            ref={topScrollRef}
            onScroll={handleTopScroll}
            style={{
              overflowX: 'auto',
              overflowY: 'hidden',
              height: '8px',
              marginBottom: '6px',
              background: 'transparent',
              borderRadius: '4px'
            }}
            className="top-scrollbar-container"
          >
            <div style={{ width: `${tableWidth}px`, height: '1px' }}></div>
          </div>
        )}

        <div 
          className="table-container"
          ref={tableContainerRef}
          onScroll={handleTableScroll}
          onMouseDown={handleMouseDown}
          onMouseLeave={handleMouseLeave}
          onMouseUp={handleMouseUp}
          onMouseMove={handleMouseMove}
          style={{
            cursor: isDown ? 'grabbing' : 'grab',
            userSelect: isDown ? 'none' : 'auto',
          }}
        >
          <table className="data-table" ref={tableRef} style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '7%' }}>Type</th>
                <th style={{ width: '18%' }}>Assessment Title</th>
                <th style={{ width: '6%' }}>Section</th>
                <th style={{ width: '6%' }}>Question No</th>
                <th style={{ width: '21%' }}>Description</th>
                <th style={{ width: '6%' }}>Weightage (%)</th>
                <th style={{ width: '6%' }}>Max Mark</th>
                <th style={{ width: '8%' }}>CLO Map</th>
                <th style={{ width: '8%' }}>PLO Map</th>
                <th style={{ width: '6%' }}>Optional Group</th>
                <th className="no-print" style={{ textAlign: 'center', width: '8%' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {assessments.map(a => (
                <tr key={a.id}>
                  <td>
                    <span style={{
                      padding: '2px 6px',
                      borderRadius: '4px',
                      fontSize: '0.75rem',
                      fontWeight: 600,
                      background: a.type === 'CW' ? 'rgba(16, 185, 129, 0.15)' : 'rgba(99, 102, 241, 0.15)',
                      color: a.type === 'CW' ? 'var(--secondary)' : 'var(--primary)'
                    }}>
                      {a.type === 'CW' ? 'CW' : 'Exam'}
                    </span>
                  </td>
                  <td style={{ fontWeight: 'bold' }}>{a.title}</td>
                  <td>{a.section}</td>
                  <td>{a.question_no}</td>
                  <td style={{ whiteSpace: 'normal', fontSize: '0.825rem', maxWidth: '200px', lineHeight: '1.3' }}>
                    {a.description || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>None</span>}
                  </td>
                  <td>{a.weightage.toFixed(2)}%</td>
                  <td>{a.max_mark.toFixed(1)}</td>
                  <td>
                    <div
                      title={clos.find(c => c.clo_no === a.clo_no)?.description || ''}
                      style={{ color: 'var(--info)', fontWeight: 600, cursor: 'help', borderBottom: '1px dotted var(--info)', display: 'inline-block' }}
                    >
                      {a.clo_no}
                    </div>
                  </td>
                  <td>
                    <div
                      title={plos.find(p => p.plo_no === a.plo_no)?.description || ''}
                      style={{ color: 'var(--warning)', fontWeight: 600, cursor: 'help', borderBottom: '1px dotted var(--warning)', display: 'inline-block' }}
                    >
                      {a.plo_no}
                    </div>
                  </td>
                  <td>
                    {a.optional_group_id ? (
                      <span style={{ fontSize: '0.8rem', color: 'var(--warning)', fontStyle: 'italic' }}>
                        Group {a.optional_group_id}
                      </span>
                    ) : (
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>None</span>
                    )}
                  </td>
                  <td className="no-print">
                    <div style={{ display: 'flex', gap: '8px', justifyContent: 'center' }}>
                      <button className="btn btn-secondary" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleEditClick(a)}>
                        ✏️ Edit
                      </button>
                      <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDelete(a.id)}>
                        🗑️ Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
