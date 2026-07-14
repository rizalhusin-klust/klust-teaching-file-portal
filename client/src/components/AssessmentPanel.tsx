import { useState } from 'react';

export default function AssessmentPanel() {
  const [loading, setLoading] = useState(true);

  return (
    <div className="view-card" style={{ padding: 0, display: 'flex', flexDirection: 'column', height: 'calc(100vh - 100px)', overflow: 'hidden' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 20px', borderBottom: '1px solid var(--border-color)', background: 'var(--bg-card)' }}>
        <div>
          <h2 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--text-active)' }}>
            OBE Coursework & Assessment Workspace
          </h2>
          <p style={{ fontSize: '0.8rem', color: 'var(--text-muted)', margin: 0 }}>
            Analyze coursework grading weightages, map CLOs to PLOs, and track curriculum compliance.
          </p>
        </div>
        <button
          className="btn btn-secondary"
          onClick={() => {
            setLoading(true);
            const iframe = document.getElementById('assessment-iframe') as HTMLIFrameElement;
            if (iframe) {
              iframe.src = iframe.src;
            }
          }}
          style={{ width: 'auto', padding: '6px 12px', fontSize: '0.8rem' }}
        >
          🔄 Refresh Workspace
        </button>
      </div>

      <div style={{ flex: 1, position: 'relative', background: '#0b1329' }}>
        {loading && (
          <div style={{
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            background: '#0b1329',
            zIndex: 10,
            gap: '15px'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              border: '3px solid rgba(255,255,255,0.05)',
              borderTop: '3px solid var(--primary)',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite'
            }}></div>
            <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontFamily: 'monospace' }}>
              Initializing OBE workspace environment...
            </span>
          </div>
        )}
        <iframe
          id="assessment-iframe"
          src="/assessment-app/"
          style={{ width: '100%', height: '100%', border: 'none', background: 'transparent' }}
          onLoad={() => setLoading(false)}
          title="KLUST Assessment Workspace"
        />
      </div>

      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
