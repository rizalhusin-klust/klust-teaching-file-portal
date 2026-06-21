const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

if (!c.includes('import Login from')) {
  c = c.replace(
    "import CoursePortfolio from './components/CoursePortfolio';",
    "import CoursePortfolio from './components/CoursePortfolio';\nimport Login from './components/Login';"
  );
}

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

if (!c.includes('const [token, setToken] =')) {
  c = c.replace(
    "const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);",
    "const [token, setToken] = useState<string | null>(localStorage.getItem('token'));\n  const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);"
  );
}

if (!c.includes('if (!token) {')) {
  const loginRender = `
  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t);
      setToken(t);
    }} API_BASE={API_BASE} />;
  }
`;
  // Target the specific return that starts the main JSX
  c = c.replace(/\n\s*return \(\n\s*<div className="layout">/, loginRender + "\n  return (\n    <div className=\"layout\">");
}

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
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Logout
          </button>
          <button
`;
  c = c.replace(/<button\s+className="btn btn-secondary"\s+onClick=\{refreshAll\}\>.*?\<\/button\>/s, `$&` + "\n" + logoutBtn);
}

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('Patched safely');
