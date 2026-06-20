import sqlite3 from 'sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import admin from 'firebase-admin';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');
const serviceAccountPath = path.resolve(__dirname, 'serviceAccountKey.json');

// Initialize Firebase Admin
if (fs.existsSync(serviceAccountPath)) {
  console.log("Loading Firebase credentials from serviceAccountKey.json...");
  const serviceAccount = JSON.parse(fs.readFileSync(serviceAccountPath, 'utf8'));
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount)
  });
} else {
  console.log("No serviceAccountKey.json found. Initializing with default application credentials...");
  admin.initializeApp();
}

const firestore = admin.firestore();

// Connect to SQLite
if (!fs.existsSync(dbPath)) {
  console.error(`SQLite database file not found at: ${dbPath}`);
  process.exit(1);
}

const sqliteDb = new sqlite3.Database(dbPath, sqlite3.OPEN_READONLY, (err) => {
  if (err) {
    console.error('Error opening SQLite database:', err.message);
    process.exit(1);
  }
  console.log('Connected to SQLite database at:', dbPath);
});

// SQLite Promise helpers
const sqliteAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

async function runMigration() {
  try {
    console.log("Starting migration to Firestore...");

    // 1. Fetch all courses
    const courses = await sqliteAll("SELECT * FROM course_info");
    console.log(`Found ${courses.length} courses to migrate.`);

    for (const course of courses) {
      const courseId = String(course.id);
      console.log(`\nMigrating Course [ID: ${courseId}] - ${course.course_code}: ${course.course_name}...`);

      // Upload main course document
      await firestore.collection('courses').doc(courseId).set(course);
      console.log(`  -> Main course info migrated.`);

      // 2. Migrate Students
      const students = await sqliteAll("SELECT * FROM students WHERE course_id = ?", [course.id]);
      if (students.length > 0) {
        const batch = firestore.batch();
        students.forEach(s => {
          const ref = firestore.collection('courses').doc(courseId).collection('students').doc(String(s.matric_id));
          batch.set(ref, s);
        });
        await batch.commit();
        console.log(`  -> Migrated ${students.length} students.`);
      }

      // 3. Migrate PLOs
      const plos = await sqliteAll("SELECT * FROM plos WHERE course_id = ?", [course.id]);
      if (plos.length > 0) {
        const batch = firestore.batch();
        plos.forEach(p => {
          const ref = firestore.collection('courses').doc(courseId).collection('plos').doc(String(p.plo_no));
          batch.set(ref, p);
        });
        await batch.commit();
        console.log(`  -> Migrated ${plos.length} PLOs.`);
      }

      // 4. Migrate CLOs
      const clos = await sqliteAll("SELECT * FROM clos WHERE course_id = ?", [course.id]);
      if (clos.length > 0) {
        const batch = firestore.batch();
        clos.forEach(c => {
          const ref = firestore.collection('courses').doc(courseId).collection('clos').doc(String(c.clo_no));
          batch.set(ref, c);
        });
        await batch.commit();
        console.log(`  -> Migrated ${clos.length} CLOs.`);
      }

      // 5. Migrate CLO-PLO Mappings
      const mappings = await sqliteAll("SELECT * FROM clo_plo_mappings WHERE course_id = ?", [course.id]);
      if (mappings.length > 0) {
        const batch = firestore.batch();
        mappings.forEach(m => {
          const ref = firestore.collection('courses').doc(courseId).collection('clo_plo_mappings').doc(`${m.clo_no}_${m.plo_no}`);
          batch.set(ref, m);
        });
        await batch.commit();
        console.log(`  -> Migrated ${mappings.length} CLO-PLO mappings.`);
      }

      // 6. Migrate Optional Groups
      const optGroups = await sqliteAll("SELECT * FROM optional_groups WHERE course_id = ?", [course.id]);
      if (optGroups.length > 0) {
        const batch = firestore.batch();
        optGroups.forEach(g => {
          const ref = firestore.collection('courses').doc(courseId).collection('optional_groups').doc(String(g.id));
          batch.set(ref, g);
        });
        await batch.commit();
        console.log(`  -> Migrated ${optGroups.length} optional question groups.`);
      }

      // 7. Migrate Assessments
      const assessments = await sqliteAll("SELECT * FROM assessments WHERE course_id = ?", [course.id]);
      if (assessments.length > 0) {
        const batch = firestore.batch();
        assessments.forEach(a => {
          const ref = firestore.collection('courses').doc(courseId).collection('assessments').doc(String(a.id));
          batch.set(ref, {
            ...a,
            id: Number(a.id), // ensure numeric
            optional_group_id: a.optional_group_id ? Number(a.optional_group_id) : null
          });
        });
        await batch.commit();
        console.log(`  -> Migrated ${assessments.length} assessment questions.`);
      }

      // 8. Migrate Planned Assessments
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
        console.log(`  -> Migrated ${planned.length} planned assessments.`);
      }

      // 9. Migrate Marks
      const marks = await sqliteAll("SELECT m.* FROM marks m JOIN assessments a ON m.assessment_id = a.id WHERE a.course_id = ?", [course.id]);
      if (marks.length > 0) {
        // Write marks in chunks since GCS batch limit is 500
        let batch = firestore.batch();
        let ops = 0;
        let batchCount = 0;

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
            batchCount++;
            ops = 0;
          }
        }
        if (ops > 0) {
          await batch.commit();
          batchCount++;
        }
        console.log(`  -> Migrated ${marks.length} mark cells (committed in ${batchCount} Firestore batches).`);
      }

      // 10. Migrate Attendance
      const attendance = await sqliteAll("SELECT * FROM attendance WHERE course_id = ?", [course.id]);
      if (attendance.length > 0) {
        let batch = firestore.batch();
        let ops = 0;
        let batchCount = 0;

        for (const att of attendance) {
          const safeDate = att.session_date.replace(/[^a-zA-Z0-9]/g, '_');
          const ref = firestore.collection('courses').doc(courseId).collection('attendance').doc(`${att.student_matric_id}_${safeDate}`);
          batch.set(ref, att);
          ops++;
          if (ops >= 400) {
            await batch.commit();
            batch = firestore.batch();
            batchCount++;
            ops = 0;
          }
        }
        if (ops > 0) {
          await batch.commit();
          batchCount++;
        }
        console.log(`  -> Migrated ${attendance.length} attendance rows (committed in ${batchCount} Firestore batches).`);
      }

      // 11. Migrate Weekly Lecture Reports
      const reports = await sqliteAll("SELECT * FROM weekly_reports WHERE course_id = ?", [course.id]);
      if (reports.length > 0) {
        const batch = firestore.batch();
        reports.forEach(r => {
          const ref = firestore.collection('courses').doc(courseId).collection('weekly_reports').doc(`week_${r.week_no}`);
          batch.set(ref, r);
        });
        await batch.commit();
        console.log(`  -> Migrated ${reports.length} weekly report weeks.`);
      }

      // 12. Migrate Grade Thresholds
      const thresholds = await sqliteAll("SELECT * FROM grade_thresholds WHERE course_id = ?", [course.id]);
      if (thresholds.length > 0) {
        const batch = firestore.batch();
        thresholds.forEach(t => {
          const ref = firestore.collection('courses').doc(courseId).collection('grade_thresholds').doc(String(t.grade));
          batch.set(ref, t);
        });
        await batch.commit();
        console.log(`  -> Migrated ${thresholds.length} grade thresholds.`);
      }
    }

    console.log("\n=== Migration completed successfully! ===");
    sqliteDb.close();
    process.exit(0);

  } catch (error) {
    console.error("Migration failed with error:", error);
    sqliteDb.close();
    process.exit(1);
  }
}

runMigration();
