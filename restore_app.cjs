const fs = require('fs');

let content = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Add Firebase imports
content = content.replace("import JSZip from 'jszip';", "import JSZip from 'jszip';\nimport { onAuthStateChanged } from 'firebase/auth';\nimport { auth } from './firebase';");

// 2. Add Firebase Auth Listener
const effectAnchor = `  useEffect(() => {
    if (theme === 'light') {`;
const authEffect = `  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      if (user) {
        setToken('firebase-active');
        localStorage.setItem('token', 'firebase-active');
      } else {
        setToken(null);
        localStorage.removeItem('token');
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (theme === 'light') {`;
content = content.replace(effectAnchor, authEffect);

// 3. Replace fetchData
const oldFetchData = `  const fetchData = async (cId: number | null = activeCourseId) => {
    if (cId === null) return;
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

      setCourseInfo(await infoRes.json() || null);
      setStudents(await stuRes.json() || []);
      setAssessments(await assRes.json() || []);
      setOptionalGroups(await optRes.json() || []);
      setMarks(await marksRes.json() || []);
      setAttendance(await attRes.json() || []);
      setReports(await repRes.json() || []);
      setMappings(await mapRes.json() || []);
      setGradesData(await gradesRes.json() || []);
      setObeMetrics(await obeRes.json() || { cloMetrics: {}, ploMetrics: {} });
      setClos(await closRes.json() || []);
      setPlos(await plosRes.json() || []);
      setGradeThresholds(await thresholdsRes.json() || []);
      setPlanned(await plannedRes.json() || []);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };`;

const newFetchData = `  const fetchData = async (cId: number | null = activeCourseId) => {
    if (cId === null) return;
    try {
      setLoading(true);
      const q = \`?course_id=\${cId}\`;
      const res = await fetch(\`\${API_BASE}/full-course-data\${q}\`);
      if (res.ok) {
        const data = await res.json();
        setCourseInfo(data.info || null);
        setStudents(data.students || []);
        setAssessments(data.assessments || []);
        setOptionalGroups(data.optionalGroups || []);
        setMarks(data.marks || []);
        setAttendance(data.attendance || []);
        setReports(data.reports || []);
        setMappings(data.mappings || []);
        setGradesData(data.grades || []);
        setObeMetrics(data.obeMetrics || { cloMetrics: {}, ploMetrics: {} });
        setClos(data.clos || []);
        setPlos(data.plos || []);
        setGradeThresholds(data.thresholds || []);
        setPlanned(data.planned || []);
      }
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };`;

content = content.replace(oldFetchData, newFetchData);

fs.writeFileSync('client/src/App.tsx', content, 'utf8');
console.log('App.tsx Firebase and Fast Fetch restored!');
