import React, { useState } from 'react';
import type { Student, CourseInfo } from '../App';

type RosterProps = {
  students: Student[];
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
  courseInfo: CourseInfo | null;
};

export default function Roster({ students, onRefresh, API_BASE, activeCourseId, courseInfo }: RosterProps) {
  const [matricId, setMatricId] = useState('');
  const [name, setName] = useState('');
  const [programme, setProgramme] = useState('FBE301');
  const [email, setEmail] = useState('');
  const [hpNo, setHpNo] = useState('');
  const [showAddForm, setShowAddForm] = useState(false);
  const [importText, setImportText] = useState('');
  const [showImportForm, setShowImportForm] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!matricId || !name) return alert('Matric ID and Name are required!');
    if (activeCourseId === null) return alert('No active course selected.');
    
    try {
      const res = await fetch(`${API_BASE}/students`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ matric_id: matricId, name, programme, email, hp_no: hpNo, course_id: activeCourseId })
      });
      if (res.ok) {
        setMatricId('');
        setName('');
        setEmail('');
        setHpNo('');
        setShowAddForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this student? All their marks and attendance records will be removed.')) return;
    if (activeCourseId === null) return;

    try {
      const res = await fetch(`${API_BASE}/students/${id}?course_id=${activeCourseId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        onRefresh();
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Bulk CSV parser
  const handleBulkImport = async () => {
    if (!importText) return alert('Please paste some CSV content!');
    if (activeCourseId === null) return alert('No active course selected.');
    
    const lines = importText.split('\n');
    const importedList: any[] = [];
    
    lines.forEach(line => {
      if (!line.trim()) return;
      const parts = line.split(',');
      if (parts.length >= 2) {
        const id = parts[0].trim();
        const studentName = parts[1].trim();
        if (id && studentName) {
          importedList.push({
            matric_id: id,
            name: studentName,
            programme: parts[2] ? parts[2].trim() : 'FBE301',
            email: parts[3] ? parts[3].trim() : '',
            hp_no: parts[4] ? parts[4].trim() : ''
          });
        }
      }
    });

    if (importedList.length === 0) return alert('No valid records found. Make sure format is: MatricID,Name,Programme,Email,HP');

    try {
      const res = await fetch(`${API_BASE}/students/bulk`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentsList: importedList, course_id: activeCourseId })
      });
      if (res.ok) {
        alert(`Successfully imported ${importedList.length} students.`);
        setImportText('');
        setShowImportForm(false);
        onRefresh();
      }
    } catch (err) {
      console.error(err);
      alert('Error importing students.');
    }
  };

  const getProgramName = () => {
    const code = students.find(s => s.programme)?.programme || 'FBE301';
    if (code.toUpperCase() === 'FBE301') {
      return 'Bachelor of Science (Architectural Studies)';
    }
    return code;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
      {/* Inject Print Page orientation style (A4 portrait with 0.5" margins) */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 0.5in;
          }
        }
      `}} />
      
      {/* Print-Only Header & Metadata for Roster */}
      <div className="only-print teaching-file-cover-container" style={{ maxWidth: '100%', margin: '0', padding: '0 0 1rem 0', borderBottom: '2px solid #1e3a8a', marginBottom: '0.25rem', background: '#ffffff', color: '#000000' }}>
        <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
          <h1 className="cover-title" style={{ textAlign: 'left', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
            KUALA LUMPUR UNIVERSITY OF<br />SCIENCE AND TECHNOLOGY
          </h1>
          <div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.3rem', fontWeight: '300', color: '#1e3a8a', margin: '0.4rem 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            List of Student
          </div>
        </div>

        {/* Metadata Table */}
        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
          <tbody>
            <tr>
              <td style={{ width: '22%', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Programme</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{getProgramName().toUpperCase()}</td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Course</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>
                {courseInfo?.course_code?.toUpperCase()} {courseInfo?.course_name?.toUpperCase()}
              </td>
            </tr>
            <tr>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Semester</td>
              <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.semester?.toUpperCase()}</td>
            </tr>
          </tbody>
        </table>
      </div>

      {/* Top action buttons (Hidden on Print) */}
      <div className="no-print" style={{ display: 'flex', gap: '12px' }}>
        <button className="btn btn-primary" onClick={() => { setShowAddForm(!showAddForm); setShowImportForm(false); }}>
          {showAddForm ? 'Close Add Form' : '➕ Add Single Student'}
        </button>
        <button className="btn btn-secondary" onClick={() => { setShowImportForm(!showImportForm); setShowAddForm(false); }}>
          {showImportForm ? 'Close Import Form' : '📥 Bulk Import (CSV)'}
        </button>
      </div>

      {/* Add Student Form (Hidden on Print) */}
      {showAddForm && (
        <div className="view-card no-print">
          <h2>Add New Student</h2>
          <form onSubmit={handleSubmit} className="form-grid">
            <div className="form-group">
              <label>Matric ID *</label>
              <input type="text" value={matricId} onChange={e => setMatricId(e.target.value)} placeholder="e.g. 243925026" required />
            </div>
            <div className="form-group">
              <label>Student Name *</label>
              <input type="text" value={name} onChange={e => setName(e.target.value)} placeholder="e.g. ABDULKADIR ABDIRAHMAN" required />
            </div>
            <div className="form-group">
              <label>Programme</label>
              <input type="text" value={programme} onChange={e => setProgramme(e.target.value)} placeholder="e.g. FBE301" />
            </div>
            <div className="form-group">
              <label>Email Address</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="e.g. student@klust.edu.my" />
            </div>
            <div className="form-group">
              <label>HP Number</label>
              <input type="text" value={hpNo} onChange={e => setHpNo(e.target.value)} placeholder="e.g. +6012345678" />
            </div>
            <div style={{ display: 'flex', alignItems: 'flex-end' }}>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>Add Student</button>
            </div>
          </form>
        </div>
      )}

      {/* Bulk Import Form (Hidden on Print) */}
      {showImportForm && (
        <div className="view-card no-print">
          <h2>Bulk Import Students</h2>
          <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '12px' }}>
            Paste CSV rows here. Format: <code>MatricID,Name,Programme,Email,HP</code> (One student per line)
          </p>
          <div className="form-group" style={{ marginBottom: '14px' }}>
            <textarea
              rows={6}
              value={importText}
              onChange={e => setImportText(e.target.value)}
              placeholder="243925026,JOHN DOE,FBE301,john@klust.edu.my,+60123&#10;243925210,HAJIR HAMID,FBE301,hajir@klust.edu.my,"
            />
          </div>
          <button className="btn btn-primary" onClick={handleBulkImport}>Import List</button>
        </div>
      )}

      {/* Students Table */}
      <div className="view-card">
        <h2 className="no-print">Active Course List of Student ({students.length} Students)</h2>
        <div className="table-container">
          <table className="data-table" style={{ tableLayout: 'fixed', width: '100%' }}>
            <thead>
              <tr>
                <th style={{ width: '6%', textAlign: 'center' }}>No</th>
                <th style={{ width: '15%' }}>Matric ID</th>
                <th style={{ width: '35%' }}>Name</th>
                <th style={{ width: '12%' }}>Programme</th>
                <th style={{ width: '18%' }}>Email</th>
                <th className="no-print" style={{ width: '14%' }}>HP No</th>
                <th className="no-print" style={{ width: '0px', display: 'none' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {students.map((student, index) => (
                <tr key={student.matric_id}>
                  <td style={{ textAlign: 'center' }}>{index + 1}</td>
                  <td style={{ fontWeight: 'bold' }}>{student.matric_id}</td>
                  <td>{student.name}</td>
                  <td><span style={{ padding: '2px 6px', background: 'rgba(255,255,255,0.05)', borderRadius: '4px', fontSize: '0.8rem' }}>{student.programme}</span></td>
                  <td>{student.email || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>no email</span>}</td>
                  <td className="no-print">{student.hp_no || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>no number</span>}</td>
                  <td className="no-print" style={{ display: 'flex', justifyContent: 'center' }}>
                    <button className="btn btn-danger" style={{ padding: '4px 8px', fontSize: '0.75rem' }} onClick={() => handleDelete(student.matric_id)}>
                      🗑️ Delete
                    </button>
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
