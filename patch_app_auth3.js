const fs = require('fs');
let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Add Login import
if (!c.includes("import Login from './components/Login';")) {
  c = c.replace(
    "import CoursePortfolio from './components/CoursePortfolio';",
    "import CoursePortfolio from './components/CoursePortfolio';\nimport Login from './components/Login';"
  );
}

// 2. Add Fetch wrapper at the top API_BASE
if (!c.includes('const originalFetch = window.fetch;')) {
  const fetchInterceptor = `
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
  c = c.replace(
    "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';",
    "const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';\n" + fetchInterceptor
  );
}

// 3. Add token state
if (!c.includes('const [token, setToken] = useState<string | null>')) {
  c = c.replace(
    "const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);",
    "const [token, setToken] = useState<string | null>(localStorage.getItem('token'));\n  const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);"
  );
}

// 4. Insert Login return just before `const programCode = ` (which is right before main return)
if (!c.includes('if (!token) {')) {
  const loginRender = `
  if (!token) {
    return <Login onLogin={(t) => {
      localStorage.setItem('token', t);
      setToken(t);
    }} API_BASE={API_BASE} />;
  }
`;
  c = c.replace(
    "const programCode = students.find(s => s.programme)?.programme || 'FBE301';",
    loginRender + "\n  const programCode = students.find(s => s.programme)?.programme || 'FBE301';"
  );
}

// 5. Add Logout function and button
if (!c.includes('const handleLogout = () =>')) {
  const logoutFunc = `
  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };
`;
  c = c.replace(
    "const refreshAll = async () => {",
    logoutFunc + "\n  const refreshAll = async () => {"
  );

  const logoutBtn = `
          <button 
            className="btn btn-secondary"
            onClick={handleLogout}
            style={{ borderColor: '#ef4444', color: '#ef4444' }}
          >
            Logout
          </button>
`;
  // Insert before the Theme button
  c = c.replace(
    /<button\s+className="btn btn-secondary"\s+onClick=\{\(\) => setTheme\(prev => prev === 'dark' \? 'light' : 'dark'\)\}/s,
    logoutBtn + "$&"
  );
}

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
console.log('App.tsx successfully patched with Auth');
