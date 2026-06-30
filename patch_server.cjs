const fs = require('fs');

let content = fs.readFileSync('server/server.js', 'utf8');

const newEndpoint = `
// Unified endpoint to fetch all course data
app.get('/api/full-course-data', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const course = await dbService.getCourseById(courseId);
    const passFailMode = course ? (course.pass_fail_mode || 0) : 0;
    const passMark = course ? (course.pass_mark !== null ? course.pass_mark : 50.0) : 50.0;

    const [
      students,
      assessments,
      marks,
      attendance,
      reports,
      mappings,
      clos,
      plos,
      thresholds,
      planned,
      optionalGroups
    ] = await Promise.all([
      dbService.getStudents(courseId),
      dbService.getAssessments(courseId),
      dbService.getMarks(courseId),
      dbService.getAttendance(courseId),
      dbService.getReports(courseId),
      dbService.getCloPloMappings(courseId),
      dbService.getClos(courseId),
      dbService.getPlos(courseId),
      dbService.getGradeThresholds(courseId),
      dbService.getPlannedAssessments(courseId),
      dbService.getOptionalGroups(courseId)
    ]);

    const grades = calculateStudentGrades(students, assessments, marks, optionalGroups, thresholds, passFailMode, passMark);
    const obeMetrics = calculateObeMetrics(students, assessments, marks, optionalGroups, mappings, plos, clos, grades);

    res.json({
      info: course,
      students,
      assessments,
      optionalGroups,
      marks,
      attendance,
      reports,
      mappings,
      grades,
      obeMetrics,
      clos,
      plos,
      thresholds,
      planned
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});
`;

if (!content.includes('/api/full-course-data')) {
  // insert before the fallback route app.get('*', ...)
  const insertionPoint = "app.get('*', (req, res) => {";
  content = content.replace(insertionPoint, newEndpoint + '\n' + insertionPoint);
  fs.writeFileSync('server/server.js', content, 'utf8');
  console.log('Added /api/full-course-data to server.js');
} else {
  console.log('Endpoint already exists.');
}
