import sqliteDb from './database.js';

// Determine if we should use Firestore or local SQLite
let dbType = process.env.DB_TYPE || 'sqlite';
if (process.env.NODE_ENV === 'production') {
  dbType = 'firestore';
}

const firestore = null;

// SQLite Promise Helpers
const sqliteAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const sqliteGet = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
};

const sqliteRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

// Seeding helper for new courses in Firestore
const seedNewCourseFirestore = async (courseId) => {
  const batch = firestore.batch();
  
  // Seed standard grades
  const grades = [
    { grade: 'A+', min_mark: 94.5 },
    { grade: 'A', min_mark: 84.5 },
    { grade: 'A-', min_mark: 74.5 },
    { grade: 'B+', min_mark: 69.5 },
    { grade: 'B', min_mark: 64.5 },
    { grade: 'B-', min_mark: 59.5 },
    { grade: 'C+', min_mark: 54.5 },
    { grade: 'C', min_mark: 49.5 },
    { grade: 'C-', min_mark: 46.5 },
    { grade: 'D+', min_mark: 43.5 },
    { grade: 'D', min_mark: 39.5 },
    { grade: 'F', min_mark: 0.0 }
  ];

  grades.forEach(g => {
    const ref = firestore.collection('courses').doc(courseId).collection('grade_thresholds').doc(g.grade);
    batch.set(ref, g);
  });

  // Seed 14 empty weekly reports
  for (let w = 1; w <= 14; w++) {
    const ref = firestore.collection('courses').doc(courseId).collection('weekly_reports').doc(`week_${w}`);
    batch.set(ref, {
      week_no: w,
      date_label: `Week ${w}`,
      topics: '',
      syllabus_topic: '',
      f2f_hours: 1.0,
      nf2f_hours: 2.0,
      remarks: ''
    });
  }

  await batch.commit();
};

export const dbService = {
  getDbType: () => dbType,

  // 1. Course Info Methods
  getCourses: async () => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').orderBy('course_code').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return sqliteAll("SELECT * FROM course_info ORDER BY course_code ASC");
    }
  },

  getCourseById: async (courseId) => {
    if (dbType === 'firestore') {
      const doc = await firestore.collection('courses').doc(String(courseId)).get();
      return doc.exists ? { id: doc.id, ...doc.data() } : null;
    } else {
      return sqliteGet("SELECT * FROM course_info WHERE id = ?", [courseId]);
    }
  },

  getFirstCourse: async () => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').limit(1).get();
      if (snap.empty) return {};
      const doc = snap.docs[0];
      return { id: doc.id, ...doc.data() };
    } else {
      const row = await sqliteGet("SELECT * FROM course_info LIMIT 1");
      return row || {};
    }
  },

  createCourse: async (data) => {
    if (dbType === 'firestore') {
      const docRef = firestore.collection('courses').doc();
      const newId = docRef.id;
      const payload = {
        course_code: data.course_code || '',
        course_name: data.course_name || '',
        credit_hours: Number(data.credit_hours) || 0,
        lecturer: data.lecturer || '',
        email: data.email || '',
        room_no: data.room_no || '',
        telephone: data.telephone || '',
        hp_no: data.hp_no || '',
        consultation_hours: data.consultation_hours || '',
        semester: data.semester || '',
        start_date: data.start_date || '',
        end_date: data.end_date || '',
        session1_day: data.session1_day || '',
        session1_start: data.session1_start || '',
        session1_end: data.session1_end || '',
        session2_day: data.session2_day || '',
        session2_start: data.session2_start || '',
        session2_end: data.session2_end || '',
        cw_weightage: data.cw_weightage !== undefined ? Number(data.cw_weightage) : 50.0,
        ex_weightage: data.ex_weightage !== undefined ? Number(data.ex_weightage) : 50.0,
        pass_fail_mode: data.pass_fail_mode !== undefined ? Number(data.pass_fail_mode) : 0,
        pass_mark: data.pass_mark !== undefined ? Number(data.pass_mark) : 50.0,
        table4_path: '',
        portfolio_data: '',
        synopsis: data.synopsis || '',
        references_list: data.references_list || ''
      };
      await docRef.set(payload);
      await seedNewCourseFirestore(newId);
      return { success: true, id: newId };
    } else {
      const res = await sqliteRun(`INSERT INTO course_info 
        (course_code, course_name, credit_hours, lecturer, email, room_no, telephone, hp_no, consultation_hours, semester, start_date, end_date, session1_day, session1_start, session1_end, session2_day, session2_start, session2_end, cw_weightage, ex_weightage, pass_fail_mode, pass_mark, synopsis, references_list) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          data.course_code, data.course_name, Number(data.credit_hours), data.lecturer, data.email, data.room_no, data.telephone, data.hp_no, data.consultation_hours, data.semester, data.start_date, data.end_date, data.session1_day, data.session1_start, data.session1_end, data.session2_day, data.session2_start, data.session2_end,
          data.cw_weightage !== undefined ? Number(data.cw_weightage) : 50.0,
          data.ex_weightage !== undefined ? Number(data.ex_weightage) : 50.0,
          data.pass_fail_mode !== undefined ? Number(data.pass_fail_mode) : 0,
          data.pass_mark !== undefined ? Number(data.pass_mark) : 50.0,
          data.synopsis || '',
          data.references_list || ''
        ]
      );
      const newId = res.lastID;
      
      // Seed SQLite thresholds and weekly reports
      const grades = [
        ['A+', 94.5, newId], ['A', 84.5, newId], ['A-', 74.5, newId],
        ['B+', 69.5, newId], ['B', 64.5, newId], ['B-', 59.5, newId],
        ['C+', 54.5, newId], ['C', 49.5, newId], ['C-', 46.5, newId],
        ['D+', 43.5, newId], ['D', 39.5, newId], ['F', 0.0, newId]
      ];
      const gradeStmt = sqliteDb.prepare("INSERT INTO grade_thresholds (grade, min_mark, course_id) VALUES (?, ?, ?)");
      grades.forEach(([gr, min, cId]) => {
        gradeStmt.run([gr, min, cId]);
      });
      gradeStmt.finalize();

      const reportStmt = sqliteDb.prepare("INSERT INTO weekly_reports (week_no, date_label, topics, syllabus_topic, f2f_hours, nf2f_hours, remarks, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      for (let w = 1; w <= 14; w++) {
        reportStmt.run([w, `Week ${w}`, '', '', 1.0, 2.0, '', newId]);
      }
      reportStmt.finalize();

      return { success: true, id: newId };
    }
  },

  updateCourse: async (courseId, data) => {
    if (dbType === 'firestore') {
      const cleanData = {};
      const fields = [
        'course_code', 'course_name', 'credit_hours', 'lecturer', 'email', 'room_no', 'telephone', 'hp_no', 'consultation_hours', 'semester', 'start_date', 'end_date', 'session1_day', 'session1_start', 'session1_end', 'session2_day', 'session2_start', 'session2_end', 'cw_weightage', 'ex_weightage', 'pass_fail_mode', 'pass_mark', 'table4_path', 'portfolio_data', 'synopsis', 'references_list'
      ];
      fields.forEach(field => {
        if (data[field] !== undefined) {
          if (field === 'credit_hours' || field === 'cw_weightage' || field === 'ex_weightage' || field === 'pass_fail_mode' || field === 'pass_mark') {
            cleanData[field] = Number(data[field]);
          } else {
            cleanData[field] = data[field];
          }
        }
      });
      await firestore.collection('courses').doc(String(courseId)).update(cleanData);
      return { success: true };
    } else {
      await sqliteRun(`UPDATE course_info SET 
        course_code = COALESCE(?, course_code),
        course_name = COALESCE(?, course_name),
        credit_hours = COALESCE(?, credit_hours),
        lecturer = COALESCE(?, lecturer),
        email = COALESCE(?, email),
        room_no = COALESCE(?, room_no),
        telephone = COALESCE(?, telephone),
        hp_no = COALESCE(?, hp_no),
        consultation_hours = COALESCE(?, consultation_hours),
        semester = COALESCE(?, semester),
        start_date = COALESCE(?, start_date),
        end_date = COALESCE(?, end_date),
        session1_day = COALESCE(?, session1_day),
        session1_start = COALESCE(?, session1_start),
        session1_end = COALESCE(?, session1_end),
        session2_day = COALESCE(?, session2_day),
        session2_start = COALESCE(?, session2_start),
        session2_end = COALESCE(?, session2_end),
        cw_weightage = COALESCE(?, cw_weightage),
        ex_weightage = COALESCE(?, ex_weightage),
        pass_fail_mode = COALESCE(?, pass_fail_mode),
        pass_mark = COALESCE(?, pass_mark),
        table4_path = COALESCE(?, table4_path),
        portfolio_data = COALESCE(?, portfolio_data),
        synopsis = COALESCE(?, synopsis),
        references_list = COALESCE(?, references_list)
        WHERE id = ?`,
        [
          data.course_code, data.course_name, data.credit_hours, data.lecturer, data.email, data.room_no, data.telephone, data.hp_no, data.consultation_hours, data.semester, data.start_date, data.end_date, data.session1_day, data.session1_start, data.session1_end, data.session2_day, data.session2_start, data.session2_end, data.cw_weightage, data.ex_weightage, data.pass_fail_mode, data.pass_mark, data.table4_path, data.portfolio_data, data.synopsis, data.references_list,
          courseId
        ]
      );
      return { success: true };
    }
  },

  deleteCourse: async (courseId) => {
    if (dbType === 'firestore') {
      const courseRef = firestore.collection('courses').doc(String(courseId));
      const courseSnap = await courseRef.get();
      if (!courseSnap.exists) return { success: false };
      const courseData = { id: courseSnap.id, ...courseSnap.data() };

      // Helper to delete a collection
      const deleteCollection = async (collectionRef) => {
        const snap = await collectionRef.limit(100).get();
        if (snap.empty) return;
        const batch = firestore.batch();
        snap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
        await deleteCollection(collectionRef); // Recurse if more than 100
      };

      // Delete all subcollections
      const subcollections = ['students', 'plos', 'clos', 'clo_plo_mappings', 'optional_groups', 'assessments', 'planned_assessments', 'marks', 'attendance', 'weekly_reports', 'grade_thresholds'];
      for (const sub of subcollections) {
        await deleteCollection(courseRef.collection(sub));
      }

      // Delete main document
      await courseRef.delete();
      return { success: true, course: courseData };
    } else {
      const course = await sqliteGet("SELECT table4_path, portfolio_data FROM course_info WHERE id = ?", [courseId]);
      await sqliteRun("BEGIN TRANSACTION");
      try {
        await sqliteRun("DELETE FROM course_info WHERE id = ?", [courseId]);
        await sqliteRun("DELETE FROM students WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM plos WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM clos WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM clo_plo_mappings WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM optional_groups WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM assessments WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM marks WHERE assessment_id IN (SELECT id FROM assessments WHERE course_id = ?)", [courseId]);
        await sqliteRun("DELETE FROM attendance WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM weekly_reports WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM grade_thresholds WHERE course_id = ?", [courseId]);
        await sqliteRun("DELETE FROM planned_assessments WHERE course_id = ?", [courseId]);
        await sqliteRun("COMMIT");
        return { success: true, course };
      } catch (err) {
        await sqliteRun("ROLLBACK").catch(() => {});
        throw err;
      }
    }
  },

  duplicateCourse: async (sourceCourseId, semester, start_date, end_date) => {
    if (dbType === 'firestore') {
      const srcRef = firestore.collection('courses').doc(String(sourceCourseId));
      const srcSnap = await srcRef.get();
      if (!srcSnap.exists) throw new Error("Source course not found");
      const srcData = srcSnap.data();

      // Create new course
      const destRef = firestore.collection('courses').doc();
      const newCourseId = destRef.id;

      const newPayload = {
        ...srcData,
        semester,
        start_date,
        end_date,
        table4_path: '',
        portfolio_data: ''
      };
      await destRef.set(newPayload);

      // Duplicate all subcollections
      const subcollections = ['plos', 'clos', 'clo_plo_mappings', 'optional_groups', 'assessments', 'planned_assessments', 'weekly_reports', 'grade_thresholds'];
      
      for (const sub of subcollections) {
        const snap = await srcRef.collection(sub).get();
        if (!snap.empty) {
          const batch = firestore.batch();
          snap.docs.forEach(doc => {
            const data = doc.data();
            // In weekly_reports, clear the dynamic lecture notes on duplication
            if (sub === 'weekly_reports') {
              data.topics = '';
              data.remarks = '';
            }
            const docRef = destRef.collection(sub).doc(doc.id);
            batch.set(docRef, data);
          });
          await batch.commit();
        }
      }

      // Handle duplicating Table 4 PDF URL if it exists
      if (srcData.table4_path && srcData.table4_path.startsWith('https://storage.googleapis.com/')) {
        try {
          const bucket = admin.storage().bucket();
          const urlParts = srcData.table4_path.split(`${bucket.name}/`);
          if (urlParts.length > 1) {
            const srcPath = urlParts[1];
            const destPath = `courses/${newCourseId}/table4/course_${newCourseId}_table4.pdf`;
            const srcFile = bucket.file(srcPath);
            const [exists] = await srcFile.exists();
            if (exists) {
              await srcFile.copy(bucket.file(destPath));
              await bucket.file(destPath).makePublic();
              const newUrl = `https://storage.googleapis.com/${bucket.name}/${destPath}`;
              await destRef.update({ table4_path: newUrl });
            }
          }
        } catch (e) {
          console.error("Failed to copy Table 4 PDF in Storage:", e);
        }
      }

      return { success: true, id: newCourseId };
    } else {
      const origCourse = await sqliteGet("SELECT * FROM course_info WHERE id = ?", [sourceCourseId]);
      if (!origCourse) throw new Error("Source course not found");

      await sqliteRun("BEGIN TRANSACTION");
      try {
        const insertCourseRes = await sqliteRun(`INSERT INTO course_info 
          (course_code, course_name, credit_hours, lecturer, email, room_no, telephone, hp_no, consultation_hours, semester, start_date, end_date, session1_day, session1_start, session1_end, session2_day, session2_start, session2_end, cw_weightage, ex_weightage, pass_fail_mode, pass_mark)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            origCourse.course_code, origCourse.course_name, origCourse.credit_hours, origCourse.lecturer, origCourse.email, origCourse.room_no, origCourse.telephone, origCourse.hp_no, origCourse.consultation_hours, semester, start_date, end_date, origCourse.session1_day, origCourse.session1_start, origCourse.session1_end, origCourse.session2_day, origCourse.session2_start, origCourse.session2_end, origCourse.cw_weightage, origCourse.ex_weightage, origCourse.pass_fail_mode || 0, origCourse.pass_mark !== undefined ? origCourse.pass_mark : 50.0
          ]
        );
        const newCourseId = insertCourseRes.lastID;

        const clos = await sqliteAll("SELECT * FROM clos WHERE course_id = ?", [sourceCourseId]);
        for (const clo of clos) {
          await sqliteRun("INSERT INTO clos (clo_no, description, course_id) VALUES (?, ?, ?)", [clo.clo_no, clo.description, newCourseId]);
        }

        const plos = await sqliteAll("SELECT * FROM plos WHERE course_id = ?", [sourceCourseId]);
        for (const plo of plos) {
          await sqliteRun("INSERT INTO plos (plo_no, description, course_id) VALUES (?, ?, ?)", [plo.plo_no, plo.description, newCourseId]);
        }

        const mappings = await sqliteAll("SELECT * FROM clo_plo_mappings WHERE course_id = ?", [sourceCourseId]);
        for (const m of mappings) {
          await sqliteRun("INSERT INTO clo_plo_mappings (clo_no, plo_no, is_mapped, teaching_method, assessment_method, course_id) VALUES (?, ?, ?, ?, ?, ?)",
            [m.clo_no, m.plo_no, m.is_mapped, m.teaching_method, m.assessment_method, newCourseId]
          );
        }

        const optGroups = await sqliteAll("SELECT * FROM optional_groups WHERE course_id = ?", [sourceCourseId]);
        const optGroupMap = {};
        for (const g of optGroups) {
          const gRes = await sqliteRun("INSERT INTO optional_groups (group_name, max_selectable, course_id) VALUES (?, ?, ?)",
            [g.group_name, g.max_selectable, newCourseId]
          );
          optGroupMap[g.id] = gRes.lastID;
        }

        const assessments = await sqliteAll("SELECT * FROM assessments WHERE course_id = ?", [sourceCourseId]);
        for (const a of assessments) {
          const newOptGroupId = a.optional_group_id ? optGroupMap[a.optional_group_id] : null;
          await sqliteRun(`INSERT INTO assessments 
            (type, title, section, question_no, weightage, max_mark, clo_no, plo_no, optional_group_id, course_id, description)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            [a.type, a.title, a.section, a.question_no, a.weightage, a.max_mark, a.clo_no, a.plo_no, newOptGroupId, newCourseId, a.description]
          );
        }

        const reports = await sqliteAll("SELECT * FROM weekly_reports WHERE course_id = ?", [sourceCourseId]);
        for (const r of reports) {
          await sqliteRun(`INSERT INTO weekly_reports 
            (week_no, date_label, topics, syllabus_topic, f2f_hours, nf2f_hours, remarks, course_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            [r.week_no, r.date_label, '', r.syllabus_topic, r.f2f_hours, r.nf2f_hours, '', newCourseId]
          );
        }

        const thresholds = await sqliteAll("SELECT * FROM grade_thresholds WHERE course_id = ?", [sourceCourseId]);
        for (const t of thresholds) {
          await sqliteRun("INSERT INTO grade_thresholds (grade, min_mark, course_id) VALUES (?, ?, ?)",
            [t.grade, t.min_mark, newCourseId]
          );
        }

        const plannedAssessments = await sqliteAll("SELECT * FROM planned_assessments WHERE course_id = ?", [sourceCourseId]);
        for (const p of plannedAssessments) {
          await sqliteRun("INSERT INTO planned_assessments (title, type, weightage, course_id) VALUES (?, ?, ?, ?)",
            [p.title, p.type, p.weightage, newCourseId]
          );
        }

        await sqliteRun("COMMIT");
        return { success: true, id: newCourseId };
      } catch (err) {
        await sqliteRun("ROLLBACK").catch(() => {});
        throw err;
      }
    }
  },

  // 2. Student Methods
  getStudents: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('students').orderBy('name').get();
      return snap.docs.map(doc => doc.data());
    } else {
      return sqliteAll("SELECT * FROM students WHERE course_id = ? ORDER BY name ASC", [courseId]);
    }
  },

  saveStudent: async (student) => {
    const courseId = String(student.course_id);
    const matricId = String(student.matric_id);
    if (dbType === 'firestore') {
      const payload = {
        matric_id: matricId,
        name: student.name || '',
        programme: student.programme || '',
        email: student.email || '',
        hp_no: student.hp_no || '',
        course_id: student.course_id
      };
      await firestore.collection('courses').doc(courseId).collection('students').doc(matricId).set(payload);
      return { success: true };
    } else {
      await sqliteRun(`INSERT OR REPLACE INTO students (matric_id, name, programme, email, hp_no, course_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [matricId, student.name, student.programme, student.email, student.hp_no, student.course_id]
      );
      return { success: true };
    }
  },

  saveStudentsBulk: async (studentsList, courseId) => {
    const cidStr = String(courseId);
    if (dbType === 'firestore') {
      // Write in batches of 400 docs (Firestore limit is 500)
      const batches = [];
      let currentBatch = firestore.batch();
      let count = 0;

      for (const s of studentsList) {
        const ref = firestore.collection('courses').doc(cidStr).collection('students').doc(String(s.matric_id));
        currentBatch.set(ref, {
          matric_id: String(s.matric_id),
          name: s.name || '',
          programme: s.programme || 'FBE301',
          email: s.email || '',
          hp_no: s.hp_no || '',
          course_id: courseId
        });
        count++;
        if (count >= 400) {
          batches.push(currentBatch.commit());
          currentBatch = firestore.batch();
          count = 0;
        }
      }
      if (count > 0) {
        batches.push(currentBatch.commit());
      }
      await Promise.all(batches);
      return { success: true, count: studentsList.length };
    } else {
      return new Promise((resolve, reject) => {
        sqliteDb.serialize(() => {
          sqliteDb.run("BEGIN TRANSACTION");
          const stmt = sqliteDb.prepare("INSERT OR REPLACE INTO students (matric_id, name, programme, email, hp_no, course_id) VALUES (?, ?, ?, ?, ?, ?)");
          studentsList.forEach(s => {
            stmt.run([s.matric_id, s.name, s.programme || 'FBE301', s.email || '', s.hp_no || '', courseId]);
          });
          stmt.finalize();
          sqliteDb.run("COMMIT", (err) => {
            if (err) reject(err);
            else resolve({ success: true, count: studentsList.length });
          });
        });
      });
    }
  },

  deleteStudent: async (matricId, courseId) => {
    const cidStr = String(courseId);
    const midStr = String(matricId);
    if (dbType === 'firestore') {
      const studentRef = firestore.collection('courses').doc(cidStr).collection('students').doc(midStr);
      await studentRef.delete();

      // Clean up marks
      const marksSnap = await firestore.collection('courses').doc(cidStr).collection('marks')
        .where('student_matric_id', '==', midStr).get();
      if (!marksSnap.empty) {
        const batch = firestore.batch();
        marksSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Clean up attendance
      const attSnap = await firestore.collection('courses').doc(cidStr).collection('attendance')
        .where('student_matric_id', '==', midStr).get();
      if (!attSnap.empty) {
        const batch = firestore.batch();
        attSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      return { success: true };
    } else {
      await sqliteRun("DELETE FROM students WHERE matric_id = ? AND course_id = ?", [matricId, courseId]);
      await sqliteRun("DELETE FROM marks WHERE student_matric_id = ? AND assessment_id IN (SELECT id FROM assessments WHERE course_id = ?)", [matricId, courseId]);
      await sqliteRun("DELETE FROM attendance WHERE student_matric_id = ? AND course_id = ?", [matricId, courseId]);
      return { success: true };
    }
  },

  // 3. Assessment Methods
  getAssessments: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('assessments').get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      // Sort type DESC, title ASC, id ASC
      list.sort((a, b) => {
        if (a.type !== b.type) return b.type.localeCompare(a.type);
        if (a.title !== b.title) return a.title.localeCompare(b.title);
        return String(a.id).localeCompare(String(b.id));
      });
      return list;
    } else {
      return sqliteAll("SELECT * FROM assessments WHERE course_id = ? ORDER BY type DESC, title ASC, id ASC", [courseId]);
    }
  },

  saveAssessment: async (assessment) => {
    const courseId = String(assessment.course_id);
    if (dbType === 'firestore') {
      let docRef;
      if (assessment.id) {
        docRef = firestore.collection('courses').doc(courseId).collection('assessments').doc(String(assessment.id));
      } else {
        docRef = firestore.collection('courses').doc(courseId).collection('assessments').doc();
      }
      const payload = {
        id: assessment.id || docRef.id,
        type: assessment.type || '',
        title: assessment.title || '',
        section: assessment.section || '',
        question_no: assessment.question_no || '',
        weightage: Number(assessment.weightage) || 0,
        max_mark: Number(assessment.max_mark) || 0,
        clo_no: assessment.clo_no || null,
        plo_no: assessment.plo_no || null,
        optional_group_id: assessment.optional_group_id || null,
        course_id: assessment.course_id,
        description: assessment.description || ''
      };
      await docRef.set(payload);
      return { success: true };
    } else {
      if (assessment.id) {
        await sqliteRun(`UPDATE assessments SET 
          type = ?, title = ?, section = ?, question_no = ?, weightage = ?, max_mark = ?, clo_no = ?, plo_no = ?, optional_group_id = ?, description = ?
          WHERE id = ?`,
          [assessment.type, assessment.title, assessment.section, assessment.question_no, Number(assessment.weightage), Number(assessment.max_mark), assessment.clo_no, assessment.plo_no, assessment.optional_group_id, assessment.description, assessment.id]
        );
      } else {
        await sqliteRun(`INSERT INTO assessments 
          (type, title, section, question_no, weightage, max_mark, clo_no, plo_no, optional_group_id, course_id, description) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [assessment.type, assessment.title, assessment.section, assessment.question_no, Number(assessment.weightage), Number(assessment.max_mark), assessment.clo_no, assessment.plo_no, assessment.optional_group_id, assessment.course_id, assessment.description]
        );
      }
      return { success: true };
    }
  },

  deleteAssessment: async (assessmentId, courseId) => {
    if (dbType === 'firestore') {
      const cidStr = String(courseId);
      const aidStr = String(assessmentId);
      await firestore.collection('courses').doc(cidStr).collection('assessments').doc(aidStr).delete();
      
      // Delete marks
      const marksSnap = await firestore.collection('courses').doc(cidStr).collection('marks')
        .where('assessment_id', '==', isNaN(Number(aidStr)) ? aidStr : Number(aidStr)).get();
      if (!marksSnap.empty) {
        const batch = firestore.batch();
        marksSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }
      return { success: true };
    } else {
      await sqliteRun("DELETE FROM assessments WHERE id = ?", [assessmentId]);
      await sqliteRun("DELETE FROM marks WHERE assessment_id = ?", [assessmentId]);
      return { success: true };
    }
  },

  // 4. Planned Assessments
  getPlannedAssessments: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('planned_assessments').get();
      const list = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      list.sort((a, b) => String(a.id).localeCompare(String(b.id)));
      return list;
    } else {
      return sqliteAll("SELECT * FROM planned_assessments WHERE course_id = ? ORDER BY id ASC", [courseId]);
    }
  },

  savePlannedAssessment: async (planned) => {
    const courseId = String(planned.course_id);
    if (dbType === 'firestore') {
      let docRef;
      if (planned.id) {
        docRef = firestore.collection('courses').doc(courseId).collection('planned_assessments').doc(String(planned.id));
      } else {
        docRef = firestore.collection('courses').doc(courseId).collection('planned_assessments').doc();
      }
      const payload = {
        id: planned.id || docRef.id,
        title: planned.title || '',
        type: planned.type || '',
        weightage: Number(planned.weightage) || 0,
        course_id: planned.course_id
      };
      await docRef.set(payload);
      return { success: true };
    } else {
      if (planned.id) {
        await sqliteRun(`UPDATE planned_assessments SET 
          title = ?, type = ?, weightage = ?
          WHERE id = ?`,
          [planned.title, planned.type, Number(planned.weightage), planned.id]
        );
      } else {
        await sqliteRun(`INSERT INTO planned_assessments (title, type, weightage, course_id) 
          VALUES (?, ?, ?, ?)`,
          [planned.title, planned.type, Number(planned.weightage), planned.course_id]
        );
      }
      return { success: true };
    }
  },

  deletePlannedAssessment: async (plannedId, courseId) => {
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(String(courseId)).collection('planned_assessments').doc(String(plannedId)).delete();
      return { success: true };
    } else {
      await sqliteRun("DELETE FROM planned_assessments WHERE id = ?", [plannedId]);
      return { success: true };
    }
  },

  // 5. Optional Groups
  getOptionalGroups: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('optional_groups').get();
      return snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
    } else {
      return sqliteAll("SELECT * FROM optional_groups WHERE course_id = ?", [courseId]);
    }
  },

  // 6. Marks Methods
  getMarks: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('marks').get();
      return snap.docs.map(doc => doc.data());
    } else {
      return sqliteAll("SELECT m.* FROM marks m JOIN assessments a ON m.assessment_id = a.id WHERE a.course_id = ?", [courseId]);
    }
  },

  saveMark: async (studentMatricId, assessmentId, rawMark, courseId) => {
    const cidStr = String(courseId);
    const key = `${studentMatricId}_${assessmentId}`;
    if (dbType === 'firestore') {
      const ref = firestore.collection('courses').doc(cidStr).collection('marks').doc(key);
      if (rawMark === null || rawMark === '') {
        await ref.delete();
      } else {
        await ref.set({
          student_matric_id: String(studentMatricId),
          assessment_id: isNaN(Number(assessmentId)) ? assessmentId : Number(assessmentId),
          raw_mark: Number(rawMark)
        });
      }
      return { success: true };
    } else {
      if (rawMark === null || rawMark === '') {
        await sqliteRun("DELETE FROM marks WHERE student_matric_id = ? AND assessment_id = ?", [studentMatricId, assessmentId]);
      } else {
        await sqliteRun(`INSERT OR REPLACE INTO marks (student_matric_id, assessment_id, raw_mark) 
          VALUES (?, ?, ?)`,
          [studentMatricId, assessmentId, Number(rawMark)]
        );
      }
      return { success: true };
    }
  },

  // 7. Attendance Methods
  getAttendance: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('attendance').get();
      return snap.docs.map(doc => doc.data());
    } else {
      return sqliteAll("SELECT * FROM attendance WHERE course_id = ?", [courseId]);
    }
  },

  saveAttendance: async (studentMatricId, sessionDate, status, courseId) => {
    const cidStr = String(courseId);
    // Escape standard slashes or spaces for key safekeeping
    const safeDate = sessionDate.replace(/[^a-zA-Z0-9]/g, '_');
    const key = `${studentMatricId}_${safeDate}`;

    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(cidStr).collection('attendance').doc(key).set({
        student_matric_id: String(studentMatricId),
        session_date: sessionDate,
        status: status || 'Y',
        course_id: courseId
      });
      return { success: true };
    } else {
      await sqliteRun(`INSERT OR REPLACE INTO attendance (student_matric_id, session_date, status, course_id) 
        VALUES (?, ?, ?, ?)`,
        [studentMatricId, sessionDate, status, courseId]
      );
      return { success: true };
    }
  },

  // 8. Weekly Lecture Reports
  getWeeklyReports: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('weekly_reports').get();
      const list = snap.docs.map(doc => doc.data());
      list.sort((a, b) => Number(a.week_no) - Number(b.week_no));
      return list;
    } else {
      return sqliteAll("SELECT * FROM weekly_reports WHERE course_id = ? ORDER BY week_no ASC", [courseId]);
    }
  },

  saveWeeklyReport: async (report) => {
    const courseId = String(report.course_id);
    const weekNo = Number(report.week_no);
    const origWeekNo = report.original_week_no !== undefined ? Number(report.original_week_no) : null;

    if (dbType === 'firestore') {
      const colRef = firestore.collection('courses').doc(courseId).collection('weekly_reports');
      
      if (origWeekNo !== null && origWeekNo !== weekNo) {
        // Delete old document and write next one
        await colRef.doc(`week_${origWeekNo}`).delete();
      }

      await colRef.doc(`week_${weekNo}`).set({
        week_no: weekNo,
        date_label: report.date_label || '',
        topics: report.topics || '',
        syllabus_topic: report.syllabus_topic || '',
        f2f_hours: Number(report.f2f_hours) || 0,
        nf2f_hours: Number(report.nf2f_hours) || 0,
        remarks: report.remarks || '',
        course_id: report.course_id
      });
      return { success: true };
    } else {
      if (origWeekNo !== null && origWeekNo !== weekNo) {
        await sqliteRun(`UPDATE weekly_reports SET 
          week_no = ?, date_label = ?, topics = ?, syllabus_topic = ?, f2f_hours = ?, nf2f_hours = ?, remarks = ?
          WHERE week_no = ? AND course_id = ?`,
          [weekNo, report.date_label, report.topics, report.syllabus_topic, report.f2f_hours, report.nf2f_hours, report.remarks, origWeekNo, report.course_id]
        );
      } else {
        await sqliteRun(`INSERT OR REPLACE INTO weekly_reports (week_no, date_label, topics, syllabus_topic, f2f_hours, nf2f_hours, remarks, course_id) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [weekNo, report.date_label, report.topics, report.syllabus_topic, report.f2f_hours, report.nf2f_hours, report.remarks, report.course_id]
        );
      }
      return { success: true };
    }
  },

  // 9. CLO-PLO Mappings
  getCLOPLOMappings: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('clo_plo_mappings').get();
      return snap.docs.map(doc => doc.data());
    } else {
      return sqliteAll("SELECT * FROM clo_plo_mappings WHERE course_id = ?", [courseId]);
    }
  },

  saveCLOPLOMapping: async (mapping) => {
    const courseId = String(mapping.course_id);
    const key = `${mapping.clo_no}_${mapping.plo_no}`;
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(courseId).collection('clo_plo_mappings').doc(key).set({
        clo_no: mapping.clo_no,
        plo_no: mapping.plo_no,
        is_mapped: Number(mapping.is_mapped) || 0,
        teaching_method: mapping.teaching_method || '',
        assessment_method: mapping.assessment_method || '',
        course_id: mapping.course_id
      });
      return { success: true };
    } else {
      await sqliteRun(`INSERT OR REPLACE INTO clo_plo_mappings (clo_no, plo_no, is_mapped, teaching_method, assessment_method, course_id) 
        VALUES (?, ?, ?, ?, ?, ?)`,
        [mapping.clo_no, mapping.plo_no, Number(mapping.is_mapped), mapping.teaching_method, mapping.assessment_method, mapping.course_id]
      );
      return { success: true };
    }
  },

  // 10. CLOs Methods
  getCLOs: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('clos').get();
      const list = snap.docs.map(doc => doc.data());
      list.sort((a, b) => a.clo_no.localeCompare(b.clo_no));
      return list;
    } else {
      return sqliteAll("SELECT * FROM clos WHERE course_id = ? ORDER BY clo_no ASC", [courseId]);
    }
  },

  saveCLO: async (clo) => {
    const courseId = String(clo.course_id);
    const cloNo = String(clo.clo_no);
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(courseId).collection('clos').doc(cloNo).set({
        clo_no: cloNo,
        description: clo.description || '',
        course_id: clo.course_id
      });
      return { success: true };
    } else {
      await sqliteRun("INSERT OR REPLACE INTO clos (clo_no, description, course_id) VALUES (?, ?, ?)", [cloNo, clo.description, clo.course_id]);
      return { success: true };
    }
  },

  deleteCLO: async (cloNo, courseId) => {
    const cidStr = String(courseId);
    const cloStr = String(cloNo);
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(cidStr).collection('clos').doc(cloStr).delete();

      // Delete associated mappings
      const mapsSnap = await firestore.collection('courses').doc(cidStr).collection('clo_plo_mappings')
        .where('clo_no', '==', cloStr).get();
      if (!mapsSnap.empty) {
        const batch = firestore.batch();
        mapsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Update assessments with matching CLO
      const assSnap = await firestore.collection('courses').doc(cidStr).collection('assessments')
        .where('clo_no', '==', cloStr).get();
      if (!assSnap.empty) {
        const batch = firestore.batch();
        assSnap.docs.forEach(doc => batch.update(doc.ref, { clo_no: null }));
        await batch.commit();
      }
      return { success: true };
    } else {
      await sqliteRun("BEGIN TRANSACTION");
      try {
        await sqliteRun("DELETE FROM clos WHERE clo_no = ? AND course_id = ?", [cloNo, courseId]);
        await sqliteRun("DELETE FROM clo_plo_mappings WHERE clo_no = ? AND course_id = ?", [cloNo, courseId]);
        await sqliteRun("UPDATE assessments SET clo_no = NULL WHERE clo_no = ? AND course_id = ?", [cloNo, courseId]);
        await sqliteRun("COMMIT");
        return { success: true };
      } catch (err) {
        await sqliteRun("ROLLBACK").catch(() => {});
        throw err;
      }
    }
  },

  // 11. PLOs Methods
  getPLOs: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('plos').get();
      const list = snap.docs.map(doc => doc.data());
      list.sort((a, b) => a.plo_no.localeCompare(b.plo_no));
      return list;
    } else {
      return sqliteAll("SELECT * FROM plos WHERE course_id = ? ORDER BY plo_no ASC", [courseId]);
    }
  },

  savePLO: async (plo) => {
    const courseId = String(plo.course_id);
    const ploNo = String(plo.plo_no);
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(courseId).collection('plos').doc(ploNo).set({
        plo_no: ploNo,
        description: plo.description || '',
        course_id: plo.course_id
      });
      return { success: true };
    } else {
      await sqliteRun("INSERT OR REPLACE INTO plos (plo_no, description, course_id) VALUES (?, ?, ?)", [ploNo, plo.description, plo.course_id]);
      return { success: true };
    }
  },

  deletePLO: async (ploNo, courseId) => {
    const cidStr = String(courseId);
    const ploStr = String(ploNo);
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(cidStr).collection('plos').doc(ploStr).delete();

      // Delete associated mappings
      const mapsSnap = await firestore.collection('courses').doc(cidStr).collection('clo_plo_mappings')
        .where('plo_no', '==', ploStr).get();
      if (!mapsSnap.empty) {
        const batch = firestore.batch();
        mapsSnap.docs.forEach(doc => batch.delete(doc.ref));
        await batch.commit();
      }

      // Update assessments with matching PLO
      const assSnap = await firestore.collection('courses').doc(cidStr).collection('assessments')
        .where('plo_no', '==', ploStr).get();
      if (!assSnap.empty) {
        const batch = firestore.batch();
        assSnap.docs.forEach(doc => batch.update(doc.ref, { plo_no: null }));
        await batch.commit();
      }
      return { success: true };
    } else {
      await sqliteRun("BEGIN TRANSACTION");
      try {
        await sqliteRun("DELETE FROM plos WHERE plo_no = ? AND course_id = ?", [ploNo, courseId]);
        await sqliteRun("DELETE FROM clo_plo_mappings WHERE plo_no = ? AND course_id = ?", [ploNo, courseId]);
        await sqliteRun("UPDATE assessments SET plo_no = NULL WHERE plo_no = ? AND course_id = ?", [ploNo, courseId]);
        await sqliteRun("COMMIT");
        return { success: true };
      } catch (err) {
        await sqliteRun("ROLLBACK").catch(() => {});
        throw err;
      }
    }
  },

  // 12. Grade Thresholds
  getGradeThresholds: async (courseId) => {
    if (dbType === 'firestore') {
      const snap = await firestore.collection('courses').doc(String(courseId)).collection('grade_thresholds').get();
      const list = snap.docs.map(doc => doc.data());
      list.sort((a, b) => Number(b.min_mark) - Number(a.min_mark));
      return list;
    } else {
      return sqliteAll("SELECT * FROM grade_thresholds WHERE course_id = ? ORDER BY min_mark DESC", [courseId]);
    }
  },

  saveGradeThreshold: async (threshold) => {
    const courseId = String(threshold.course_id);
    const grade = String(threshold.grade);
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(courseId).collection('grade_thresholds').doc(grade).set({
        grade: grade,
        min_mark: Number(threshold.min_mark) || 0,
        course_id: threshold.course_id
      });
      return { success: true };
    } else {
      await sqliteRun("INSERT OR REPLACE INTO grade_thresholds (grade, min_mark, course_id) VALUES (?, ?, ?)", [grade, Number(threshold.min_mark), threshold.course_id]);
      return { success: true };
    }
  },

  deleteGradeThreshold: async (grade, courseId) => {
    if (dbType === 'firestore') {
      await firestore.collection('courses').doc(String(courseId)).collection('grade_thresholds').doc(String(grade)).delete();
      return { success: true };
    } else {
      await sqliteRun("DELETE FROM grade_thresholds WHERE grade = ? AND course_id = ?", [grade, courseId]);
      return { success: true };
    }
  }
};
