const fs = require('fs');
const path = require('path');
const file = path.join(__dirname, 'client/src/App.tsx');
let content = fs.readFileSync(file, 'utf8');

// 1. Add imports
content = content.replace(
    /import ObeDashboard from '\.\/components\/ObeDashboard';\r?\n/,
    `import ObeDashboard from './components/ObeDashboard';\nimport Login from './components/Login';\nimport { auth } from './firebase';\nimport { onAuthStateChanged } from 'firebase/auth';\n`
);

// 2. Add token state and handleLogout inside App component
content = content.replace(
    /const \[isCourseworkMenuOpen, setIsCourseworkMenuOpen\] = useState<boolean>\(true\);\r?\n/,
    `const [isCourseworkMenuOpen, setIsCourseworkMenuOpen] = useState<boolean>(true);\n  const [token, setToken] = useState<string | null>(localStorage.getItem('token'));\n\n  useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (user) => {\n      if (user) {\n        user.getIdToken().then(t => {\n          setToken(t);\n          localStorage.setItem('token', t);\n        });\n      } else {\n        setToken(null);\n        localStorage.removeItem('token');\n      }\n    });\n    return () => unsubscribe();\n  }, []);\n\n  const handleLogout = async () => {\n    try {\n      await auth.signOut();\n    } catch (err) {\n      console.error(err);\n    }\n  };\n`
);

// 3. Fix loading bug in fetchData
content = content.replace(
    /const fetchData = async \(cId: number \| null = activeCourseId\) => \{\r?\n\s+if \(cId === null\) return;\r?\n/g,
    `const fetchData = async (cId: number | null = activeCourseId) => {\n    if (cId === null) {\n      setLoading(false);\n      return;\n    }\n`
);

// 4. Fix refreshAll
content = content.replace(
    /if \(currentId !== null\) \{\r?\n\s+await fetchData\(currentId\);\r?\n\s+\}\r?\n/g,
    `if (currentId !== null) {\n      await fetchData(currentId);\n    } else {\n      setLoading(false);\n    }\n`
);

// 5. Intercept render if not logged in (put this right after the first `if (loading)` block, or before the return)
const returnRenderRegex = /return \(\r?\n\s+<div className="app-container">\r?\n/;
content = content.replace(returnRenderRegex, `if (!token) {\n    return <Login />;\n  }\n\n  return (\n    <div className="app-container">\n`);

// 6. Add Logout button to top bar
const addCourseBtnRegex = /<button \r?\n\s+className="btn btn-primary"\r?\n\s+onClick=\{\(\) => \{\r?\n\s+setIsAddModalOpen\(true\);\r?\n\s+setNewCourseName\(''\);\r?\n\s+\}\}\r?\n\s+>\r?\n\s+Add Course\r?\n\s+<\/button>/g;
content = content.replace(addCourseBtnRegex, `<button className="btn btn-primary" onClick={() => { setIsAddModalOpen(true); setNewCourseName(''); }}>Add Course</button>\n          <button className="btn btn-secondary" onClick={handleLogout} style={{ borderColor: '#ef4444', color: '#ef4444' }}>Logout</button>`);

fs.writeFileSync(file, content);
console.log("App.tsx configured with Firebase Auth");
