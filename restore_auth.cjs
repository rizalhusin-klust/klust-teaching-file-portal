const fs = require('fs');

let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Ensure imports
if (!content.includes("import { onAuthStateChanged }")) {
  content = content.replace("import Login from './components/Login';", "import Login from './components/Login';\nimport { auth } from './firebase';\nimport { onAuthStateChanged } from 'firebase/auth';");
}

// 2. Add useEffect for Auth
const authEffect = `
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        user.getIdToken().then(t => {
          setToken(t);
          localStorage.setItem('token', t);
        });
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
    });
    return () => unsubscribe();
  }, []);

  const handleLogout = async () => {
    try {
      await auth.signOut();
    } catch (err) {
      console.error(err);
    }
  };
`;

if (!content.includes("onAuthStateChanged(auth")) {
  content = content.replace("const [token, setToken] = useState<string | null>(localStorage.getItem('token'));", "const [token, setToken] = useState<string | null>(localStorage.getItem('token'));\n" + authEffect);
}

// 3. Fix Login component usage
content = content.replace(
  /return <Login onLogin=\{\(t\) => \{[\s\S]*?\}\} API_BASE=\{API_BASE\} \/>;/,
  "return <Login API_BASE={API_BASE} />;"
);

// 4. Add logout button next to Add Course
if (!content.includes("onClick={handleLogout}")) {
  const btn = `<button
              className="btn btn-primary"
              onClick={() => {
                setIsAddModalOpen(true);
                setNewCourseName('');
              }}
            >
              Add Course
            </button>`;
  
  const newBtn = btn + `\n            <button className="btn btn-secondary" onClick={handleLogout} style={{ borderColor: '#ef4444', color: '#ef4444' }}>Logout</button>`;
  content = content.replace(btn, newBtn);
}

fs.writeFileSync('client/src/App.tsx', content, 'utf8');
console.log('Firebase Auth properly restored to App.tsx');
