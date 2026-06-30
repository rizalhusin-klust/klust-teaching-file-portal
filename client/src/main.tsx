import { Component, type ErrorInfo, type ReactNode } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App.tsx';

interface Props {
  children: ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
    error: null,
    errorInfo: null
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error, errorInfo: null };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error("Uncaught error:", error, errorInfo);
    this.setState({ errorInfo });

    // Log the error back to the backend Express server
    const API_BASE = import.meta.env.VITE_API_URL || '/api';
    fetch(`${API_BASE}/log-error`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: error.message,
        stack: error.stack + '\nComponent Stack:\n' + errorInfo.componentStack
      })
    }).catch(err => console.error('Failed to log error to server:', err));
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: '2rem', fontFamily: 'sans-serif', color: '#fff', backgroundColor: '#0f172a', minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          <div style={{ maxWidth: '700px', width: '100%', padding: '2rem', borderRadius: '8px', backgroundColor: '#1e293b', border: '1px solid #ef4444' }}>
            <h1 style={{ color: '#ef4444', marginTop: 0 }}>Something went wrong</h1>
            <p>The application encountered an unexpected error. You can try reloading the application.</p>
            <button 
              onClick={() => window.location.reload()} 
              style={{ padding: '0.5rem 1rem', backgroundColor: '#3b82f6', border: 'none', color: '#fff', borderRadius: '4px', cursor: 'pointer', fontWeight: 'bold' }}
            >
              Reload Application
            </button>
            {this.state.error && (
              <pre style={{ marginTop: '1.5rem', padding: '1rem', backgroundColor: '#0f172a', borderRadius: '4px', overflowX: 'auto', fontSize: '0.85rem', color: '#94a3b8', whiteSpace: 'pre-wrap' }}>
                {this.state.error.toString()}
                {this.state.errorInfo?.componentStack}
              </pre>
            )}
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

createRoot(document.getElementById('root')!).render(
  <ErrorBoundary>
    <App />
  </ErrorBoundary>
);
