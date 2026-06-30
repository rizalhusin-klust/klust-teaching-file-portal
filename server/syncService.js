import { createClient } from '@supabase/supabase-js';
import dbService from './dbService.js';
import sqliteDb from './database.js';

// Helper to wrap SQLite run/get in Promise
const sqliteRun = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve(this);
    });
  });
};

const sqliteAll = (sql, params = []) => {
  return new Promise((resolve, reject) => {
    sqliteDb.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
};

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://japjageoksjvedzoafaf.supabase.co';
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || '';

export async function synchronizeUserDatabase(userToken, userId) {
  // Create user-scoped Supabase client (respects Row Level Security)
  const userSupabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    global: {
      headers: {
        Authorization: `Bearer ${userToken}`
      }
    }
  });

  console.log(`[Sync] Starting sync for user ${userId}...`);

  // 1. Sync Courses
  const localCourses = await sqliteAll("SELECT * FROM course_info");
  const { data: cloudCourses, error: courseErr } = await userSupabase
    .from('course_info')
    .select('*');

  if (courseErr) {
    throw new Error(`Failed to fetch courses from cloud: ${courseErr.message}`);
  }

  await syncTable(
    'course_info',
    localCourses,
    cloudCourses || [],
    ['id'],
    null,
    userId,
    userSupabase,
    async (rec) => {
      await sqliteRun(
        `INSERT OR REPLACE INTO course_info (id, course_code, course_name, credit_hours, lecturer, email, room_no, hp_no, semester, updated_at, deleted) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [rec.id, rec.course_code, rec.course_name, rec.credit_hours, rec.lecturer, rec.email, rec.room_no, rec.hp_no, rec.semester, rec.updated_at, rec.deleted ? 1 : 0]
      );
    },
    async (rec) => {
      // Map to Supabase structure
      return {
        id: rec.id,
        user_id: userId,
        course_code: rec.course_code,
        course_name: rec.course_name,
        credit_hours: rec.credit_hours,
        lecturer: rec.lecturer,
        email: rec.email,
        room_no: rec.room_no,
        hp_no: rec.hp_no,
        semester: rec.semester,
        updated_at: rec.updated_at,
        deleted: rec.deleted === 1
      };
    }
  );

  // Sync related child tables for each local course
  const currentCourses = await sqliteAll("SELECT * FROM course_info WHERE deleted = 0");
  for (const course of currentCourses) {
    const q = `?course_id=${course.id}`;
    const courseId = course.id;

    // A. Sync Students
    const localStudents = await sqliteAll("SELECT * FROM students WHERE course_id = ?", [courseId]);
    const { data: cloudStudents } = await userSupabase.from('students').select('*').eq('course_id', courseId);
    await syncTable(
      'students',
      localStudents,
      cloudStudents || [],
      ['matric_id', 'course_id'],
      courseId,
      userId,
      userSupabase,
      async (rec) => {
        await sqliteRun(
          `INSERT OR REPLACE INTO students (matric_id, name, programme, email, hp_no, course_id, updated_at, deleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          [rec.matric_id, rec.name, rec.programme, rec.email, rec.hp_no, rec.course_id, rec.updated_at, rec.deleted ? 1 : 0]
        );
      },
      async (rec) => {
        return {
          matric_id: rec.matric_id,
          course_id: courseId,
          user_id: userId,
          name: rec.name,
          programme: rec.programme,
          email: rec.email,
          hp_no: rec.hp_no,
          updated_at: rec.updated_at,
          deleted: rec.deleted === 1
        };
      }
    );

    // B. Sync Assessments
    const localAssessments = await sqliteAll("SELECT * FROM assessments WHERE course_id = ?", [courseId]);
    const { data: cloudAssessments } = await userSupabase.from('assessments').select('*').eq('course_id', courseId);
    await syncTable(
      'assessments',
      localAssessments,
      cloudAssessments || [],
      ['id'],
      courseId,
      userId,
      userSupabase,
      async (rec) => {
        await sqliteRun(
          `INSERT OR REPLACE INTO assessments (id, type, title, section, question_no, weightage, max_mark, clo_no, plo_no, course_id, description, updated_at, deleted) 
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [rec.id, rec.type, rec.title, rec.section, rec.question_no, rec.weightage, rec.max_mark, rec.clo_no, rec.plo_no, rec.course_id, rec.description, rec.updated_at, rec.deleted ? 1 : 0]
        );
      },
      async (rec) => {
        return {
          id: rec.id,
          course_id: courseId,
          user_id: userId,
          type: rec.type,
          title: rec.title,
          section: rec.section,
          question_no: rec.question_no,
          weightage: rec.weightage,
          max_mark: rec.max_mark,
          clo_no: rec.clo_no,
          plo_no: rec.plo_no,
          description: rec.description,
          updated_at: rec.updated_at,
          deleted: rec.deleted === 1
        };
      }
    );

    // C. Sync Marks
    // Note: SQLite marks table does not have course_id natively, we get it by joining students
    const localMarks = await sqliteAll(
      `SELECT m.* FROM marks m 
       JOIN students s ON m.student_matric_id = s.matric_id 
       WHERE s.course_id = ?`,
      [courseId]
    );
    const { data: cloudMarks } = await userSupabase.from('marks').select('*').eq('course_id', courseId);
    await syncTable(
      'marks',
      localMarks,
      cloudMarks || [],
      ['student_matric_id', 'assessment_id'],
      courseId,
      userId,
      userSupabase,
      async (rec) => {
        await sqliteRun(
          `INSERT OR REPLACE INTO marks (student_matric_id, assessment_id, raw_mark, updated_at, deleted) 
           VALUES (?, ?, ?, ?, ?)`,
          [rec.student_matric_id, rec.assessment_id, rec.raw_mark, rec.updated_at, rec.deleted ? 1 : 0]
        );
      },
      async (rec) => {
        return {
          student_matric_id: rec.student_matric_id,
          assessment_id: rec.assessment_id,
          course_id: courseId,
          user_id: userId,
          raw_mark: rec.raw_mark,
          updated_at: rec.updated_at,
          deleted: rec.deleted === 1
        };
      }
    );

    // D. Sync Attendance
    const localAttendance = await sqliteAll("SELECT * FROM attendance WHERE course_id = ?", [courseId]);
    const { data: cloudAttendance } = await userSupabase.from('attendance').select('*').eq('course_id', courseId);
    await syncTable(
      'attendance',
      localAttendance,
      cloudAttendance || [],
      ['student_matric_id', 'session_date', 'course_id'],
      courseId,
      userId,
      userSupabase,
      async (rec) => {
        await sqliteRun(
          `INSERT OR REPLACE INTO attendance (student_matric_id, session_date, status, course_id, updated_at, deleted) 
           VALUES (?, ?, ?, ?, ?, ?)`,
          [rec.student_matric_id, rec.session_date, rec.status, rec.course_id, rec.updated_at, rec.deleted ? 1 : 0]
        );
      },
      async (rec) => {
        return {
          student_matric_id: rec.student_matric_id,
          session_date: rec.session_date,
          status: rec.status,
          course_id: courseId,
          user_id: userId,
          updated_at: rec.updated_at,
          deleted: rec.deleted === 1
        };
      }
    );
  }

  console.log(`[Sync] Finished sync for user ${userId} successfully.`);
}

// Generic sync handler for a table
async function syncTable(tableName, localList, cloudList, pkKeys, courseId, userId, userSupabase, saveLocal, buildCloudRecord) {
  const localMap = new Map();
  localList.forEach(rec => {
    const key = pkKeys.map(k => rec[k]).join('|');
    localMap.set(key, rec);
  });

  const cloudMap = new Map();
  cloudList.forEach(rec => {
    const key = pkKeys.map(k => rec[k]).join('|');
    cloudMap.set(key, rec);
  });

  // 1. Process Local updates
  for (const [key, localRec] of localMap.entries()) {
    const cloudRec = cloudMap.get(key);
    
    if (!cloudRec) {
      // Not in cloud: upload if not deleted locally
      if (localRec.deleted !== 1) {
        const payload = await buildCloudRecord(localRec);
        await userSupabase.from(tableName).upsert(payload);
      }
    } else {
      // In both: check updated_at timestamp
      const localTime = new Date(localRec.updated_at).getTime();
      const cloudTime = new Date(cloudRec.updated_at).getTime();
      
      if (localTime > cloudTime) {
        // Local is newer: push to cloud
        const payload = await buildCloudRecord(localRec);
        await userSupabase.from(tableName).upsert(payload);
      } else if (cloudTime > localTime) {
        // Cloud is newer: pull to local
        await saveLocal(cloudRec);
      }
    }
  }

  // 2. Process Cloud updates (not in local)
  for (const [key, cloudRec] of cloudMap.entries()) {
    const localRec = localMap.get(key);
    if (!localRec) {
      // Not in local: download if not deleted in cloud
      if (!cloudRec.deleted) {
        await saveLocal(cloudRec);
      }
    }
  }
}
