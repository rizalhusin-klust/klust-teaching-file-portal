import express from 'express';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';
dotenv.config();
import cors from 'cors';
import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';
import { onRequest } from 'firebase-functions/v2/https';
import { dbService } from './dbService.js';
import { uploadFile, deleteFile } from './storageService.js';
import { calculateStudentGrades, calculateObeMetrics } from './calculationEngine.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3001;

app.use(cors());
// Increase body limit to 50MB to accommodate large base64-encoded PDF uploads
app.use(express.json({ limit: '50mb' }));

// Serve uploaded files (PDFs, images) as static assets
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Serve the built Vite frontend
app.use(express.static(path.join(__dirname, '../client/dist')));



const JWT_SECRET = process.env.JWT_SECRET || 'fallback_secret_for_local_dev';
const APP_PASSWORD = process.env.APP_PASSWORD || 'password123';

app.post('/api/auth/login', (req, res) => {
  const { password } = req.body;
  if (password === APP_PASSWORD) {
    const token = jwt.sign({ authenticated: true }, JWT_SECRET, { expiresIn: '7d' });
    return res.json({ token });
  }
  return res.status(401).json({ error: 'Invalid password' });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') return next();
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: No token provided' });
  }
  const token = authHeader.split(' ')[1];
  try {
    jwt.verify(token, JWT_SECRET);
    next();
  } catch (err) {
    return res.status(403).json({ error: 'Forbidden: Invalid or expired token' });
  }
});

// 1. Dashboard Summary Stats
app.get('/api/dashboard', async (req, res) => {
  const courseId = req.query.course_id;
  if (!courseId) return res.status(400).json({ error: "Missing course_id" });

  try {
    const students = await dbService.getStudents(courseId);
    const assessments = await dbService.getAssessments(courseId);
    const clos = await dbService.getCLOs(courseId);
    const plos = await dbService.getPLOs(courseId);
    const course = await dbService.getCourseById(courseId);
    const marks = await dbService.getMarks(courseId);
    const optionalGroups = await dbService.getOptionalGroups(courseId);
    const thresholds = await dbService.getGradeThresholds(courseId);

    const studentCount = students.length;
    const assessmentCount = assessments.length;
    const cloCount = clos.length;
    const ploCount = plos.length;
    
    const passFailMode = course ? (course.pass_fail_mode || 0) : 0;
    const passMark = course ? (course.pass_mark !== null ? course.pass_mark : 50.0) : 50.0;

    const grades = calculateStudentGrades(students, assessments, marks, optionalGroups, thresholds, passFailMode, passMark);
    const activeGrades = grades.filter(g => g.totalMark > 0);
    
    let classAverage = 0;
    if (activeGrades.length > 0) {
      const sum = activeGrades.reduce((acc, curr) => acc + curr.totalMark, 0);
      classAverage = Number((sum / activeGrades.length).toFixed(2));
    }

    // Grade distribution
    const gradeDist = {};
    if (passFailMode === 1) {
      gradeDist['Pass'] = 0;
      gradeDist['Fail'] = 0;
    } else {
      thresholds.forEach(t => { gradeDist[t.grade] = 0; });
    }
    activeGrades.forEach(g => {
      gradeDist[g.grade] = (gradeDist[g.grade] || 0) + 1;
    });

    res.json({
      studentCount,
      assessmentCount,
      cloCount,
      ploCount,
      classAverage,
      gradeDistribution: gradeDist
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 2. Course Info Endpoints
app.get('/api/courses', async (req, res) => {
  try {
    const courses = await dbService.getCourses();
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/course-info', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    let info;
    if (courseId) {
      info = await dbService.getCourseById(courseId);
    } else {
      info = await dbService.getFirstCourse();
    }
    res.json(info || {});
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/course-info', async (req, res) => {
  try {
    const { id } = req.body;
    if (id) {
      await dbService.updateCourse(id, req.body);
      res.json({ success: true, id });
    } else {
      const result = await dbService.createCourse(req.body);
      res.json(result);
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload Table 4 PDF
app.post('/api/courses/:id/upload-table4', async (req, res) => {
  const { id } = req.params;
  const { pdfBase64 } = req.body;

  if (!pdfBase64) {
    return res.status(400).json({ error: "Missing pdfBase64 payload" });
  }

  try {
    const matches = pdfBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 PDF format" });
    }

    const type = matches[1];
    if (type !== 'application/pdf') {
      return res.status(400).json({ error: "Only PDF files are allowed" });
    }

    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');
    const fileName = `course_${id}_table4.pdf`;

    // Upload via storageService (which handles local disk or Firebase Storage automatically)
    const publicUrlPath = await uploadFile(id, fileName, null, buffer, 'application/pdf');

    // Update database path
    await dbService.updateCourse(id, { table4_path: publicUrlPath });

    res.json({ success: true, table4_path: publicUrlPath });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Update portfolio link metadata
app.post('/api/courses/:id/portfolio', async (req, res) => {
  const { id } = req.params;
  const { portfolioData } = req.body;

  try {
    const portfolioJson = JSON.stringify(portfolioData);
    await dbService.updateCourse(id, { portfolio_data: portfolioJson });
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Upload portfolio file
app.post('/api/courses/:id/upload-portfolio', async (req, res) => {
  const { id } = req.params;
  const { key, fileBase64, fileName } = req.body;

  if (!key || !fileBase64 || !fileName) {
    return res.status(400).json({ error: "Missing required portfolio file fields" });
  }

  try {
    const matches = fileBase64.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    if (!matches || matches.length !== 3) {
      return res.status(400).json({ error: "Invalid base64 file format" });
    }

    const mimeType = matches[1];
    const base64Data = matches[2];
    const buffer = Buffer.from(base64Data, 'base64');

    const safeFileName = fileName.replace(/[^a-zA-Z0-9.\-_]/g, '_');
    const diskFileName = `course_${id}_${key}_${safeFileName}`;

    // Upload via storageService (placed in 'portfolio' subdirectory)
    const publicUrlPath = await uploadFile(id, diskFileName, 'portfolio', buffer, mimeType);

    // Fetch existing portfolio data to update the key
    const course = await dbService.getCourseById(id);
    let currentData = {};
    if (course && course.portfolio_data) {
      try {
        currentData = typeof course.portfolio_data === 'string' ? JSON.parse(course.portfolio_data) : course.portfolio_data;
      } catch (e) {
        currentData = {};
      }
    }

    const existingSlot = currentData[key] || {};
    currentData[key] = {
      ...existingSlot,
      type: 'file',
      value: publicUrlPath,
      name: fileName
    };

    const nextJson = JSON.stringify(currentData);
    await dbService.updateCourse(id, { portfolio_data: nextJson });

    res.json({ success: true, portfolio_data: currentData });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 3. Student Roster Endpoints
app.get('/api/students', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const students = await dbService.getStudents(courseId);
    res.json(students);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students', async (req, res) => {
  try {
    await dbService.saveStudent(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/students/bulk', async (req, res) => {
  const { studentsList, course_id } = req.body; 
  try {
    const result = await dbService.saveStudentsBulk(studentsList, course_id);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/students/:id', async (req, res) => {
  const { id } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deleteStudent(id, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4. Assessment Schema Endpoints
app.get('/api/assessments', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const assessments = await dbService.getAssessments(courseId);
    res.json(assessments);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/assessments', async (req, res) => {
  try {
    await dbService.saveAssessment(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/assessments/:id', async (req, res) => {
  const { id } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deleteAssessment(id, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 4b. Planned Assessments Endpoints
app.get('/api/planned-assessments', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const planned = await dbService.getPlannedAssessments(courseId);
    res.json(planned);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/planned-assessments', async (req, res) => {
  try {
    await dbService.savePlannedAssessment(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/planned-assessments/:id', async (req, res) => {
  const { id } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deletePlannedAssessment(id, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/optional-groups', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const groups = await dbService.getOptionalGroups(courseId);
    res.json(groups);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 5. Marks and Grades calculation
app.get('/api/marks', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const marks = await dbService.getMarks(courseId);
    res.json(marks);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/marks', async (req, res) => {
  const { student_matric_id, assessment_id, raw_mark, course_id } = req.body;
  try {
    await dbService.saveMark(student_matric_id, assessment_id, raw_mark, course_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/grades', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const course = await dbService.getCourseById(courseId);
    const passFailMode = course ? (course.pass_fail_mode || 0) : 0;
    const passMark = course ? (course.pass_mark !== null ? course.pass_mark : 50.0) : 50.0;

    const students = await dbService.getStudents(courseId);
    const assessments = await dbService.getAssessments(courseId);
    const marks = await dbService.getMarks(courseId);
    const optionalGroups = await dbService.getOptionalGroups(courseId);
    const thresholds = await dbService.getGradeThresholds(courseId);

    const grades = calculateStudentGrades(students, assessments, marks, optionalGroups, thresholds, passFailMode, passMark);
    res.json(grades);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/obe-metrics', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const course = await dbService.getCourseById(courseId);
    const passFailMode = course ? (course.pass_fail_mode || 0) : 0;
    const passMark = course ? (course.pass_mark !== null ? course.pass_mark : 50.0) : 50.0;

    const students = await dbService.getStudents(courseId);
    const assessments = await dbService.getAssessments(courseId);
    const marks = await dbService.getMarks(courseId);
    const optionalGroups = await dbService.getOptionalGroups(courseId);
    const thresholds = await dbService.getGradeThresholds(courseId);

    const grades = calculateStudentGrades(students, assessments, marks, optionalGroups, thresholds, passFailMode, passMark);
    const obeMetrics = calculateObeMetrics(grades, assessments, optionalGroups);
    res.json(obeMetrics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 6. Attendance Endpoints
app.get('/api/attendance', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const att = await dbService.getAttendance(courseId);
    res.json(att);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/attendance', async (req, res) => {
  const { student_matric_id, session_date, status, course_id } = req.body;
  try {
    await dbService.saveAttendance(student_matric_id, session_date, status, course_id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 7. Weekly Lecture Reports Endpoints
app.get('/api/reports', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const reports = await dbService.getWeeklyReports(courseId);
    res.json(reports);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/reports', async (req, res) => {
  try {
    await dbService.saveWeeklyReport(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 8. CLO-PLO Mappings Endpoints
app.get('/api/clo-plo-mappings', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const mappings = await dbService.getCLOPLOMappings(courseId);
    res.json(mappings);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clo-plo-mappings', async (req, res) => {
  try {
    await dbService.saveCLOPLOMapping(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 9. CLO Settings Endpoints
app.get('/api/clos', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const clos = await dbService.getCLOs(courseId);
    res.json(clos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/clos', async (req, res) => {
  try {
    await dbService.saveCLO(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/clos/:clo_no', async (req, res) => {
  const { clo_no } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deleteCLO(clo_no, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 10. PLO Settings Endpoints
app.get('/api/plos', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const plos = await dbService.getPLOs(courseId);
    res.json(plos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/plos', async (req, res) => {
  try {
    await dbService.savePLO(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/plos/:plo_no', async (req, res) => {
  const { plo_no } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deletePLO(plo_no, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 11. Grade Thresholds Endpoints
app.get('/api/grade-thresholds', async (req, res) => {
  const courseId = req.query.course_id;
  try {
    const thresholds = await dbService.getGradeThresholds(courseId);
    res.json(thresholds);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/grade-thresholds', async (req, res) => {
  try {
    await dbService.saveGradeThreshold(req.body);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.delete('/api/grade-thresholds/:grade', async (req, res) => {
  const { grade } = req.params;
  const courseId = req.query.course_id;
  try {
    await dbService.deleteGradeThreshold(grade, courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 12. Duplicate Course Endpoint
app.post('/api/courses/:id/duplicate', async (req, res) => {
  const { id } = req.params;
  const { semester, start_date, end_date } = req.body;

  try {
    const result = await dbService.duplicateCourse(id, semester, start_date, end_date);
    res.json(result);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// 13. Delete Course Endpoint
app.delete('/api/courses/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const resDelete = await dbService.deleteCourse(id);
    if (!resDelete.success) {
      return res.status(404).json({ error: "Course not found" });
    }

    const { course } = resDelete;
    // Clean up files (local uploads or Firebase GCS buckets)
    if (course) {
      if (course.table4_path) {
        await deleteFile(course.table4_path);
      }
      if (course.portfolio_data) {
        try {
          const parsed = typeof course.portfolio_data === 'string' ? JSON.parse(course.portfolio_data) : course.portfolio_data;
          for (const key in parsed) {
            if (parsed[key].type === 'file' && parsed[key].value) {
              await deleteFile(parsed[key].value);
            }
          }
        } catch (e) {
          console.error("Failed to parse portfolio_data for file cleanup:", e);
        }
      }
    }

    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Migration endpoint to trigger SQLite -> Firestore database migration in production
app.post('/api/admin/migrate-to-firestore', async (req, res) => {
  const dbType = dbService.getDbType();
  if (dbType !== 'firestore') {
    return res.status(400).json({ error: "Server is not running in Firestore/production mode." });
  }

  const __filename = fileURLToPath(import.meta.url);
  const __dirname = path.dirname(__filename);
  const dbPath = path.resolve(__dirname, 'database.sqlite');

  if (!fs.existsSync(dbPath)) {
    return res.status(404).json({ error: `database.sqlite file not found in function container at: ${dbPath}` });
  }

  const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY);
  const sqliteAll = (sql, params = []) => {
    return new Promise((resolve, reject) => {
      sqliteDb.all(sql, params, (err, rows) => {
        if (err) reject(err);
        else resolve(rows);
      });
    });
  };

  try {
    if (admin.apps.length === 0) {
      admin.initializeApp();
    }
    const firestore = admin.firestore();

    const courses = await sqliteAll("SELECT * FROM course_info");
    const migrationSummary = [];

    for (const course of courses) {
      const courseId = String(course.id);
      
      // Migrate course_info
      await firestore.collection('courses').doc(courseId).set(course);

      // Migrate students
      const students = await sqliteAll("SELECT * FROM students WHERE course_id = ?", [course.id]);
      if (students.length > 0) {
        const batch = firestore.batch();
        students.forEach(s => {
          const ref = firestore.collection('courses').doc(courseId).collection('students').doc(String(s.matric_id));
          batch.set(ref, s);
        });
        await batch.commit();
      }

      // Migrate PLOs
      const plos = await sqliteAll("SELECT * FROM plos WHERE course_id = ?", [course.id]);
      if (plos.length > 0) {
        const batch = firestore.batch();
        plos.forEach(p => {
          const ref = firestore.collection('courses').doc(courseId).collection('plos').doc(String(p.plo_no));
          batch.set(ref, p);
        });
        await batch.commit();
      }

      // Migrate CLOs
      const clos = await sqliteAll("SELECT * FROM clos WHERE course_id = ?", [course.id]);
      if (clos.length > 0) {
        const batch = firestore.batch();
        clos.forEach(c => {
          const ref = firestore.collection('courses').doc(courseId).collection('clos').doc(String(c.clo_no));
          batch.set(ref, c);
        });
        await batch.commit();
      }

      // Migrate CLO-PLO Mappings
      const mappings = await sqliteAll("SELECT * FROM clo_plo_mappings WHERE course_id = ?", [course.id]);
      if (mappings.length > 0) {
        const batch = firestore.batch();
        mappings.forEach(m => {
          const ref = firestore.collection('courses').doc(courseId).collection('clo_plo_mappings').doc(`${m.clo_no}_${m.plo_no}`);
          batch.set(ref, m);
        });
        await batch.commit();
      }

      // Migrate Optional Groups
      const optGroups = await sqliteAll("SELECT * FROM optional_groups WHERE course_id = ?", [course.id]);
      if (optGroups.length > 0) {
        const batch = firestore.batch();
        optGroups.forEach(g => {
          const ref = firestore.collection('courses').doc(courseId).collection('optional_groups').doc(String(g.id));
          batch.set(ref, g);
        });
        await batch.commit();
      }

      // Migrate Assessments
      const assessments = await sqliteAll("SELECT * FROM assessments WHERE course_id = ?", [course.id]);
      if (assessments.length > 0) {
        const batch = firestore.batch();
        assessments.forEach(a => {
          const ref = firestore.collection('courses').doc(courseId).collection('assessments').doc(String(a.id));
          batch.set(ref, {
            ...a,
            id: Number(a.id),
            optional_group_id: a.optional_group_id ? Number(a.optional_group_id) : null
          });
        });
        await batch.commit();
      }

      // Migrate Planned Assessments
      const planned = await sqliteAll("SELECT * FROM planned_assessments WHERE course_id = ?", [course.id]);
      if (planned.length > 0) {
        const batch = firestore.batch();
        planned.forEach(p => {
          const ref = firestore.collection('courses').doc(courseId).collection('planned_assessments').doc(String(p.id));
          batch.set(ref, {
            ...p,
            id: Number(p.id)
          });
        });
        await batch.commit();
      }

      // Migrate Marks
      const marks = await sqliteAll("SELECT m.* FROM marks m JOIN assessments a ON m.assessment_id = a.id WHERE a.course_id = ?", [course.id]);
      if (marks.length > 0) {
        let batch = firestore.batch();
        let ops = 0;
        for (const m of marks) {
          const ref = firestore.collection('courses').doc(courseId).collection('marks').doc(`${m.student_matric_id}_${m.assessment_id}`);
          batch.set(ref, {
            student_matric_id: String(m.student_matric_id),
            assessment_id: Number(m.assessment_id),
            raw_mark: Number(m.raw_mark)
          });
          ops++;
          if (ops >= 400) {
            await batch.commit();
            batch = firestore.batch();
            ops = 0;
          }
        }
        if (ops > 0) {
          await batch.commit();
        }
      }

      // Migrate Attendance
      const attendance = await sqliteAll("SELECT * FROM attendance WHERE course_id = ?", [course.id]);
      if (attendance.length > 0) {
        let batch = firestore.batch();
        let ops = 0;
        for (const att of attendance) {
          const safeDate = att.session_date.replace(/[^a-zA-Z0-9]/g, '_');
          const ref = firestore.collection('courses').doc(courseId).collection('attendance').doc(`${att.student_matric_id}_${safeDate}`);
          batch.set(ref, att);
          ops++;
          if (ops >= 400) {
            await batch.commit();
            batch = firestore.batch();
            ops = 0;
          }
        }
        if (ops > 0) {
          await batch.commit();
        }
      }

      // Migrate Weekly Syllabus & Reports
      const reports = await sqliteAll("SELECT * FROM weekly_reports WHERE course_id = ?", [course.id]);
      if (reports.length > 0) {
        const batch = firestore.batch();
        reports.forEach(r => {
          const ref = firestore.collection('courses').doc(courseId).collection('weekly_reports').doc(`week_${r.week_no}`);
          batch.set(ref, r);
        });
        await batch.commit();
      }

      // Migrate Grade Thresholds
      const thresholds = await sqliteAll("SELECT * FROM grade_thresholds WHERE course_id = ?", [course.id]);
      if (thresholds.length > 0) {
        const batch = firestore.batch();
        thresholds.forEach(t => {
          const ref = firestore.collection('courses').doc(courseId).collection('grade_thresholds').doc(String(t.grade));
          batch.set(ref, t);
        });
        await batch.commit();
      }

      migrationSummary.push({
        course_id: courseId,
        course_code: course.course_code,
        students: students.length,
        assessments: assessments.length,
        marks: marks.length,
        attendance: attendance.length
      });
    }

    sqliteDb.close();
    res.json({ success: true, message: "Migration completed successfully", summary: migrationSummary });
  } catch (err) {
    sqliteDb.close();
    res.status(500).json({ error: err.message });
  }
});

// Export for Firebase Cloud Functions v2

// Catch-all to serve index.html for React SPA
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist/index.html'));
});

export const api = onRequest({ cors: true, maxInstances: 10 }, app);

// Start server locally if run directly
if (process.env.NODE_ENV !== 'production' && !process.env.FIREBASE_CONFIG && !process.env.FUNCTIONS_EMULATOR) {
  app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
  });
}
