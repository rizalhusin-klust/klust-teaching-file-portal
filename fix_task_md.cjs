const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// The earlier Firebase replace failed because the anchor wasn't found or was already replaced incorrectly.
// Let's find "const [sidebarCollapsed" and insert the Firebase useEffect directly after its closing brace.
content = content.replace(/const \[sidebarCollapsed.*?\}\);/s, (match) => {
  return match + `\n\n  useEffect(() => {\n    const unsubscribe = onAuthStateChanged(auth, (user) => {\n      if (user) {\n        setToken('firebase-active');\n        localStorage.setItem('token', 'firebase-active');\n      } else {\n        setToken(null);\n        localStorage.removeItem('token');\n      }\n    });\n    return () => unsubscribe();\n  }, []);\n`;
});

// Fix CourseInfo type
content = content.replace(/export type CourseInfo = \{[\s\S]*?id: number;[\s\S]*?course_code: string;[\s\S]*?course_name: string;[\s\S]*?\};/, (match) => {
  if (!match.includes("program_name")) {
    return match.replace("course_name: string;", "course_name: string;\n  program_name?: string;\n  program_abb?: string;");
  }
  return match;
});

fs.writeFileSync('client/src/App.tsx', content, 'utf8');
console.log('App.tsx final fix attempt 2 completed!');
