const fs = require('fs');

let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// Import Login
if (!c.includes('import Login from')) {
  c = c.replace(
    "import CoursePortfolio from './components/CoursePortfolio';",
    "import CoursePortfolio from './components/CoursePortfolio';\nimport Login from './components/Login';"
  );
}

// Add Global Fetch Wrapper
if (!c.includes('const originalFetch = window.fetch;')) {
  const fetchInterceptor = `
// Inject JWT token into all fetch requests globally
const originalFetch = window.fetch;
window.fetch = async function () {
  const [resource, config] = arguments;
  const token = localStorage.getItem('token');
  if (token && typeof resource === 'string' && resource.startsWith(API_BASE)) {
    arguments[1] = {
      ...config,
      headers: {
        ...config?.headers,
        'Authorization': \`Bearer \${token}\`
      }
    };
  }
  const response = await originalFetch.apply(this, arguments);
  if (response.status === 401 || response.status === 403) {
    if (resource !== \`\${API_BASE}/auth/login\`) {
      localStorage.removeItem('token');
      window.location.reload();
    }
  }
  return response;
};
`;
  c = c.replace("const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';", "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';\n" + fetchInterceptor);
}

// Add token state to App component
if (!c.includes('const [token, setToken] = useState<string | null>')) {
  c = c.replace(
    "const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);",
    "const [token, setToken] = useState<string | null>(localStorage.getItem('token'));\n  const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);"
  );
}

// Update App render to show Login if !token
if (!c.includes('if (!token) {')) {
  const loginRender = `
  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t);
      setToken(t);
    }} API_BASE={API_BASE} />;
  }
`;
  c = c.replace("return (", loginRender + "\n  return (");
}

// Add Logout button to header
if (!c.includes('handleLogout')) {
  const logoutFunc = `
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
`;
  c = c.replace("const refreshAll = async () => {", logoutFunc + "\n  const refreshAll = async () => {");
  
  const logoutBtn = `
          <button 
            onClick={handleLogout}
            style={{ padding: '6px 12px', background: '#ef4444', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', fontSize: '0.85rem' }}
          >
            Logout
          </button>
          <div className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">
`;
  c = c.replace(`<div className="theme-toggle" onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')} title="Toggle Theme">`, logoutBtn);
}

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Patched App.tsx for Auth');
