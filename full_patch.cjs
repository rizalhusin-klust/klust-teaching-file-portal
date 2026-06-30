const fs = require('fs');
let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Optimize fetchData
const oldFetchData = `  const fetchData = async (cId: number | null = activeCourseId) => {
    if (cId === null) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const q = \`?course_id=\${cId}\`;
      const [infoRes, stuRes, assRes, optRes, marksRes, attRes, repRes, mapRes, gradesRes, obeRes, closRes, plosRes, thresholdsRes, plannedRes] = await Promise.all([
        fetch(\`\${API_BASE}/course-info\${q}\`),
        fetch(\`\${API_BASE}/students\${q}\`),
        fetch(\`\${API_BASE}/assessments\${q}\`),
        fetch(\`\${API_BASE}/optional-groups\${q}\`),
        fetch(\`\${API_BASE}/marks\${q}\`),
        fetch(\`\${API_BASE}/attendance\${q}\`),
        fetch(\`\${API_BASE}/reports\${q}\`),
        fetch(\`\${API_BASE}/clo-plo-mappings\${q}\`),
        fetch(\`\${API_BASE}/grades\${q}\`),
        fetch(\`\${API_BASE}/obe-metrics\${q}\`),
        fetch(\`\${API_BASE}/clos\${q}\`),
        fetch(\`\${API_BASE}/plos\${q}\`),
        fetch(\`\${API_BASE}/grade-thresholds\${q}\`),
        fetch(\`\${API_BASE}/planned-assessments\${q}\`)
      ]);

      const info = await infoRes.json();
      const stu = await stuRes.json();
      const ass = await assRes.json();
      const opt = await optRes.json();
      const mrks = await marksRes.json();
      const att = await attRes.json();
      const rep = await repRes.json();
      const maps = await mapRes.json();
      const grds = await gradesRes.json();
      const obe = await obeRes.json();
      const cls = await closRes.json();
      const pls = await plosRes.json();
      const thrs = await thresholdsRes.json();

      setCourseInfo(info);
      setStudents(stu);
      setAssessments(ass);
      setOptionalGroups(opt);
      setMarks(mrks);
      setAttendance(att);
      setReports(rep);
      setCloPloMappings(maps);
      setGradesData(grds);
      setObeMetrics(obe);
      setClos(cls);
      setPlos(pls);
      setGradeThresholds(thrs);
      setPlannedAssessments(await plannedRes.json());
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setLoading(false);
    }
  };`;

const newFetchData = `  const fetchData = async (cId: number | null = activeCourseId) => {
    if (cId === null) {
      setLoading(false);
      return;
    }
    try {
      setLoading(true);
      const res = await fetch(\`\${API_BASE}/full-course-data?course_id=\${cId}\`);
      const data = await res.json();
      
      setCourseInfo(data.info || null);
      setStudents(data.students || []);
      setAssessments(data.assessments || []);
      setOptionalGroups(data.optionalGroups || []);
      setMarks(data.marks || []);
      setAttendance(data.attendance || []);
      setReports(data.reports || []);
      setCloPloMappings(data.mappings || []);
      setGradesData(data.grades || []);
      setObeMetrics(data.obeMetrics || []);
      setClos(data.clos || []);
      setPlos(data.plos || []);
      setGradeThresholds(data.thresholds || []);
      setPlannedAssessments(data.planned || []);
    } catch (err) {
      console.error('Error fetching data from API:', err);
    } finally {
      setLoading(false);
    }
  };`;
content = content.replace(oldFetchData, newFetchData);


// 2. Add Semester to dropdown
const oldOption = `{c.course_code} - {c.course_name}`;
const newOption = `{c.course_code} - {c.course_name} {c.semester ? \`(\${c.semester})\` : ''}`;
content = content.replace(oldOption, newOption);


// 3. Fix Firebase Auth (remove dummy logic, add proper hook)

// 3.a) remove old handleLogout
const oldHandleLogout = `  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };`;
content = content.replace(oldHandleLogout, "");

// 3.b) add imports
if (!content.includes("import { onAuthStateChanged }")) {
  content = content.replace("import Login from './components/Login';", "import Login from './components/Login';\nimport { auth } from './firebase';\nimport { onAuthStateChanged } from 'firebase/auth';");
}

// 3.c) Add useEffect for Auth
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

const oldTokenState = `const [token, setToken] = useState<string | null>(localStorage.getItem('token'));`;
if (!content.includes("onAuthStateChanged(auth")) {
  content = content.replace(oldTokenState, oldTokenState + "\n" + authEffect);
}

// 3.d) Fix Login component usage
content = content.replace(
  /return <Login onLogin=\{\(t\) => \{[\s\S]*?\}\} API_BASE=\{API_BASE\} \/>;/,
  "return <Login API_BASE={API_BASE} />;"
);


fs.writeFileSync('client/src/App.tsx', content, 'utf8');
console.log('App.tsx patched all changes cleanly.');
