import { useState, useEffect } from 'react';
import type { CourseInfo } from '../App';

type TeachingMaterialsProps = {
  courseInfo: CourseInfo | null;
  onRefresh: () => void;
  API_BASE: string;
  activeCourseId: number | null;
};

export default function TeachingMaterials({ courseInfo, onRefresh, API_BASE, activeCourseId }: TeachingMaterialsProps) {
  const [links, setLinks] = useState<{ [key: number]: string }>({});
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ text: '', type: '' });

  useEffect(() => {
    if (courseInfo?.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data);
        const loadedLinks: { [key: number]: string } = {};
        for (let w = 1; w <= 14; w++) {
          const key = `teaching_material_week_${w}`;
          if (parsed[key]?.type === 'link' && parsed[key]?.value) {
            loadedLinks[w] = parsed[key].value;
          }
        }
        setLinks(loadedLinks);
      } catch { /* ignore */ }
    }
  }, [courseInfo]);

  const handleLinkChange = (week: number, value: string) => {
    setLinks(prev => ({ ...prev, [week]: value }));
  };

  const handleSave = async () => {
    if (!API_BASE || !activeCourseId) return;
    setSaving(true);
    setMessage({ text: '', type: '' });

    try {
      // Get current portfolio
      const currentPortfolio = (() => {
        try {
          return JSON.parse(courseInfo?.portfolio_data || '{}');
        } catch {
          return {};
        }
      })();

      // Update with new links
      for (let w = 1; w <= 14; w++) {
        const key = `teaching_material_week_${w}`;
        if (links[w] && links[w].trim() !== '') {
          currentPortfolio[key] = { type: 'link', value: links[w].trim() };
        } else {
          delete currentPortfolio[key];
        }
      }

      const res = await fetch(`${API_BASE}/courses/${activeCourseId}/portfolio`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ portfolioData: currentPortfolio })
      });

      if (res.ok) {
        setMessage({ text: 'Teaching materials saved successfully.', type: 'success' });
        onRefresh();
      } else {
        setMessage({ text: 'Failed to save materials.', type: 'error' });
      }
    } catch (e) {
      setMessage({ text: 'Error saving materials.', type: 'error' });
    } finally {
      setSaving(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 3000);
    }
  };

  return (
    <div className="view-card" style={{ padding: '20px 15px' }}>
      <div className="no-print" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
        <h2 className="no-print">Teaching Materials</h2>
        <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
          {message.text && (
            <span style={{ 
              fontSize: '0.85rem', 
              color: message.type === 'error' ? 'var(--danger)' : 'var(--success)' 
            }}>
              {message.text}
            </span>
          )}
          <button 
            className="btn btn-primary" 
            onClick={handleSave} 
            disabled={saving}
          >
            {saving ? 'Saving...' : '💾 Save Materials'}
          </button>
        </div>
      </div>
      
      <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '24px' }}>
        Provide links (Google Drive, OneDrive, website, etc.) to the teaching materials for each week.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {Array.from({ length: 14 }, (_, i) => i + 1).map(week => (
          <div key={week} style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '16px',
            background: 'var(--bg-card)',
            border: '1px solid var(--border-color)',
            padding: '12px 16px',
            borderRadius: '8px'
          }}>
            <div style={{ width: '80px', fontWeight: 600, color: 'var(--text-active)' }}>
              Week {week}
            </div>
            <div style={{ flex: 1, display: 'flex', gap: '8px' }}>
              <input
                className="no-print"
                type="url"
                placeholder="https://..."
                value={links[week] || ''}
                onChange={e => handleLinkChange(week, e.target.value)}
                style={{
                  flex: 1,
                  background: 'var(--bg-input)',
                  border: '1px solid var(--border-color)',
                  color: 'var(--text-active)',
                  padding: '8px 12px',
                  borderRadius: '4px',
                  fontSize: '0.9rem',
                  outline: 'none'
                }}
              />
              {links[week] && (
                <>
                  <a 
                    href={links[week]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="btn btn-secondary no-print"
                    style={{ textDecoration: 'none', display: 'flex', alignItems: 'center' }}
                  >
                    ↗️ Open
                  </a>
                  <a 
                    href={links[week]} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="only-print"
                    style={{ textDecoration: 'underline', color: '#3b82f6', wordBreak: 'break-all' }}
                  >
                    {links[week]}
                  </a>
                </>
              )}
              {!links[week] && (
                <span className="only-print" style={{ color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                  No link provided
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
