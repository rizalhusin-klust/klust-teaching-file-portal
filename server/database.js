import sqlite3 from 'sqlite3';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.resolve(__dirname, 'database.sqlite');

const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database:', err.message);
  } else {
    console.log('Connected to SQLite database at:', dbPath);
    db.serialize(() => {
      createTables();
      // Run migrations to add new columns if they do not exist
      db.run("ALTER TABLE course_info ADD COLUMN session1_day TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN session1_start TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN session1_end TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN session2_day TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN session2_start TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN session2_end TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN table4_path TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN portfolio_data TEXT", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN cw_weightage REAL DEFAULT 50.0", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN ex_weightage REAL DEFAULT 50.0", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN pass_fail_mode INTEGER DEFAULT 0", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN pass_mark REAL DEFAULT 50.0", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN synopsis TEXT", (err) => {});
      db.run("UPDATE course_info SET synopsis = 'This course introduces the concepts, principles, and theories of three-dimensional (3D) computer modeling and animation. Students will learn the technical ability to construct 3D digital objects, apply textures and lighting, map course learning outcomes, and generate dynamic digital animations using industry-standard CAD/modeling software packages.' WHERE id = 1 AND (synopsis IS NULL OR synopsis = '')", (err) => {});
      db.run("ALTER TABLE course_info ADD COLUMN references_list TEXT", (err) => {});
      db.run("UPDATE course_info SET references_list = '1. Parent, R. (2012). Computer Animation: Algorithms and Techniques (3rd Edition). Morgan Kaufmann.\n2. Kerlow, I. V. (2009). The Art of 3D Computer Animation and Effects (4th Edition). Wiley.\n3. Autodesk Maya/3ds Max Official Documentation and Learning Resources.\n4. Selected online tutorials, journals, and ACM SIGGRAPH archives.' WHERE id = 1 AND (references_list IS NULL OR references_list = '')", (err) => {});

      // Create planned_assessments and run the migration if empty
      db.run(`CREATE TABLE IF NOT EXISTS planned_assessments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT,
        type TEXT,
        weightage REAL,
        course_id INTEGER
      )`, () => {
        db.get("SELECT COUNT(*) as count FROM planned_assessments", (err, row) => {
          if (row && row.count === 0) {
            db.run("INSERT INTO planned_assessments (title, type, weightage, course_id) SELECT title, type, SUM(weightage), course_id FROM assessments GROUP BY title, course_id");
          }
        });
      });

      // Hybrid sync migration: Add tracking columns and triggers to all 12 tables
      const trackingTables = [
        { name: 'course_info', clause: 'id = NEW.id' },
        { name: 'students', clause: 'matric_id = NEW.matric_id AND course_id = NEW.course_id' },
        { name: 'plos', clause: 'plo_no = NEW.plo_no AND course_id = NEW.course_id' },
        { name: 'clos', clause: 'clo_no = NEW.clo_no AND course_id = NEW.course_id' },
        { name: 'clo_plo_mappings', clause: 'clo_no = NEW.clo_no AND plo_no = NEW.plo_no AND course_id = NEW.course_id' },
        { name: 'optional_groups', clause: 'id = NEW.id' },
        { name: 'assessments', clause: 'id = NEW.id' },
        { name: 'marks', clause: 'student_matric_id = NEW.student_matric_id AND assessment_id = NEW.assessment_id' },
        { name: 'attendance', clause: 'student_matric_id = NEW.student_matric_id AND session_date = NEW.session_date AND course_id = NEW.course_id' },
        { name: 'weekly_reports', clause: 'week_no = NEW.week_no AND course_id = NEW.course_id' },
        { name: 'grade_thresholds', clause: 'grade = NEW.grade AND course_id = NEW.course_id' },
        { name: 'planned_assessments', clause: 'id = NEW.id' }
      ];

      trackingTables.forEach(t => {
        db.run(`ALTER TABLE ${t.name} ADD COLUMN updated_at TEXT DEFAULT CURRENT_TIMESTAMP`, (err) => {});
        db.run(`ALTER TABLE ${t.name} ADD COLUMN deleted INTEGER DEFAULT 0`, (err) => {});
        
        db.run(`
          CREATE TRIGGER IF NOT EXISTS update_${t.name}_time AFTER UPDATE ON ${t.name}
          BEGIN
            UPDATE ${t.name} SET updated_at = CURRENT_TIMESTAMP WHERE ${t.clause};
          END;
        `, (err) => {});
      });

      seedData();
    });
  }
});

function createTables() {
  // Course Info Table
  db.run(`CREATE TABLE IF NOT EXISTS course_info (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    course_code TEXT,
    course_name TEXT,
    credit_hours REAL,
    lecturer TEXT,
    email TEXT,
    room_no TEXT,
    telephone TEXT,
    hp_no TEXT,
    consultation_hours TEXT,
    semester TEXT,
    start_date TEXT,
    end_date TEXT,
    session1_day TEXT,
    session1_start TEXT,
    session1_end TEXT,
    session2_day TEXT,
    session2_start TEXT,
    session2_end TEXT,
    table4_path TEXT,
    portfolio_data TEXT,
    cw_weightage REAL DEFAULT 50.0,
    ex_weightage REAL DEFAULT 50.0,
    pass_fail_mode INTEGER DEFAULT 0,
    pass_mark REAL DEFAULT 50.0
  )`);

  // Students Table
  db.run(`CREATE TABLE IF NOT EXISTS students (
    matric_id TEXT,
    name TEXT,
    programme TEXT,
    email TEXT,
    hp_no TEXT,
    course_id INTEGER,
    PRIMARY KEY(matric_id, course_id)
  )`);

  // PLOs Table
  db.run(`CREATE TABLE IF NOT EXISTS plos (
    plo_no TEXT,
    description TEXT,
    course_id INTEGER,
    PRIMARY KEY(plo_no, course_id)
  )`);

  // CLOs Table
  db.run(`CREATE TABLE IF NOT EXISTS clos (
    clo_no TEXT,
    description TEXT,
    course_id INTEGER,
    PRIMARY KEY(clo_no, course_id)
  )`);

  // CLO-PLO Mappings Grid Table
  db.run(`CREATE TABLE IF NOT EXISTS clo_plo_mappings (
    clo_no TEXT,
    plo_no TEXT,
    is_mapped INTEGER, -- 1 = true, 0 = false
    teaching_method TEXT,
    assessment_method TEXT,
    course_id INTEGER,
    PRIMARY KEY(clo_no, plo_no, course_id)
  )`);

  // Optional Question Groups Table
  db.run(`CREATE TABLE IF NOT EXISTS optional_groups (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    group_name TEXT,
    max_selectable INTEGER,
    course_id INTEGER
  )`);

  // Assessments Table
  db.run(`CREATE TABLE IF NOT EXISTS assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    type TEXT, -- 'CW' or 'E'
    title TEXT, -- e.g. 'Test 1', 'History Study', 'Final Examination'
    section TEXT, -- e.g. 'Test 1', 'HS', 'A', 'B'
    question_no TEXT, -- e.g. 'A1', 'A2', '1', 'B1'
    weightage REAL,
    max_mark REAL,
    clo_no TEXT,
    plo_no TEXT,
    optional_group_id INTEGER,
    course_id INTEGER,
    description TEXT,
    FOREIGN KEY(optional_group_id) REFERENCES optional_groups(id)
  )`);

  // Marks Table
  db.run(`CREATE TABLE IF NOT EXISTS marks (
    student_matric_id TEXT,
    assessment_id INTEGER,
    raw_mark REAL,
    PRIMARY KEY(student_matric_id, assessment_id),
    FOREIGN KEY(student_matric_id) REFERENCES students(matric_id),
    FOREIGN KEY(assessment_id) REFERENCES assessments(id)
  )`);

  // Attendance Table
  db.run(`CREATE TABLE IF NOT EXISTS attendance (
    student_matric_id TEXT,
    session_date TEXT,
    status TEXT, -- 'Y', 'N', 'MC'
    course_id INTEGER,
    PRIMARY KEY(student_matric_id, session_date, course_id),
    FOREIGN KEY(student_matric_id) REFERENCES students(matric_id)
  )`);

  // Weekly Syllabus & Reports Table
  db.run(`CREATE TABLE IF NOT EXISTS weekly_reports (
    week_no INTEGER,
    date_label TEXT,
    topics TEXT, -- actual covered topics
    syllabus_topic TEXT, -- planned syllabus topics
    f2f_hours REAL,
    nf2f_hours REAL,
    remarks TEXT,
    course_id INTEGER,
    PRIMARY KEY(week_no, course_id)
  )`);

  // Grade Thresholds Table
  db.run(`CREATE TABLE IF NOT EXISTS grade_thresholds (
    grade TEXT,
    min_mark REAL,
    course_id INTEGER,
    PRIMARY KEY(grade, course_id)
  )`);

  // Planned Assessments Table
  db.run(`CREATE TABLE IF NOT EXISTS planned_assessments (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT,
    type TEXT,
    weightage REAL,
    course_id INTEGER
  )`);
}

function seedData() {
  db.get("SELECT COUNT(*) as count FROM course_info", (err, row) => {
    if (row && row.count > 0) {
      console.log("Database already initialized.");
      return;
    }

    console.log("Seeding database with Syllabus details...");

    db.serialize(() => {
      // 1. Seed Course Info (id = 1)
      db.run(`INSERT INTO course_info (id, course_code, course_name, credit_hours, lecturer, email, room_no, telephone, hp_no, consultation_hours, semester, start_date, end_date, session1_day, session1_start, session1_end, session2_day, session2_start, session2_end, synopsis, references_list) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [1, 'ARCH 2240', 'COMPUTER ANIMATION', 2.00, 'RIZAL HUSIN', 'rizal.husin@klust.edu.my', '118 Block B', '03-98266993 ext 547', '+6011 1144 3741', 'Friday 3.00pm - 5.00pm', 'JULY 2025', '2025-07-07', '2025-10-09', 'Monday', '09:00', '11:00', 'Thursday', '14:00', '16:00', 'This course introduces the concepts, principles, and theories of three-dimensional (3D) computer modeling and animation. Students will learn the technical ability to construct 3D digital objects, apply textures and lighting, map course learning outcomes, and generate dynamic digital animations using industry-standard CAD/modeling software packages.', '1. Parent, R. (2012). Computer Animation: Algorithms and Techniques (3rd Edition). Morgan Kaufmann.\n2. Kerlow, I. V. (2009). The Art of 3D Computer Animation and Effects (4th Edition). Wiley.\n3. Autodesk Maya/3ds Max Official Documentation and Learning Resources.\n4. Selected online tutorials, journals, and ACM SIGGRAPH archives.']
      );

      // 2. Seed PLOs (course_id = 1)
      const plos = [
        ['PLO_01', 'Ability to understand and apply architectural knowledge comprising of the concept, principle and theory', 1],
        ['PLO_02', 'Ability to demonstrate problem solving skills in relevant to architectural field', 1],
        ['PLO_03', 'Ability to acquire and apply architectural skills as an architectural assistant', 1],
        ['PLO_04', 'Ability to participate in a design project, appraise ideas and work in a team to achieve target', 1],
        ['PLO_05', 'Ability to communicate ideas with appropriate communication tools', 1],
        ['PLO_06', 'Ability to use appropriate computer technology and digital software in architectural studies', 1],
        ['PLO_07', 'Ability to propose appropriate solution using scientific methods and numerical skills in architecture', 1],
        ['PLO_08', 'Ability to display capability to lead, manage a team and take responsibility in decision making', 1],
        ['PLO_09', 'Ability to integrate knowledge with lifelong learning and personal skills development', 1],
        ['PLO_10', 'Ability to understand entrepreneurship and demonstrate managerial skills in architecture', 1],
        ['PLO_11', 'Ability to practice professionalism and ethics in the architectural industry and community', 1],
        ['PLO_12', 'Communication, leadership and team working skills', 1]
      ];
      const ploStmt = db.prepare("INSERT INTO plos (plo_no, description, course_id) VALUES (?, ?, ?)");
      plos.forEach(([no, desc, cId]) => {
        ploStmt.run([no, desc, cId]);
      });
      ploStmt.finalize();

      // 3. Seed CLOs (course_id = 1)
      const clos = [
        ['CLO_01', 'Demonstrate technical ability to convert two-dimensional drawings into three-dimensional drawings using a CAD application.', 1],
        ['CLO_02', 'Produce a set of digital architectural presentation using a few CAD applications.', 1],
        ['CLO_03', 'Analyze architectural designs and structural forms using rendering methods.', 1]
      ];
      const cloStmt = db.prepare("INSERT INTO clos (clo_no, description, course_id) VALUES (?, ?, ?)");
      clos.forEach(([no, desc, cId]) => {
        cloStmt.run([no, desc, cId]);
      });
      cloStmt.finalize();

      // 4. Seed CLO-PLO Mappings Grid (course_id = 1)
      const mapStmt = db.prepare("INSERT INTO clo_plo_mappings (clo_no, plo_no, is_mapped, teaching_method, assessment_method, course_id) VALUES (?, ?, ?, ?, ?, ?)");
      clos.forEach(([cloNo]) => {
        plos.forEach(([ploNo]) => {
          let mapped = 0;
          let tm = '';
          let am = '';
          
          if (cloNo === 'CLO_01' && ploNo === 'PLO_06') {
            mapped = 1;
            tm = 'Hands on / Labs';
            am = 'Tutorial/Assignment';
          } else if (cloNo === 'CLO_02' && ploNo === 'PLO_05') {
            mapped = 1;
            tm = 'Hands on / Labs';
            am = 'Tutorial/Assignment';
          }
          
          mapStmt.run([cloNo, ploNo, mapped, tm, am, 1]);
        });
      });
      mapStmt.finalize();

      // 5. Seed Optional Question Groups (course_id = 1)
      db.run("INSERT INTO optional_groups (id, group_name, max_selectable, course_id) VALUES (?, ?, ?, ?)", [1, 'Final Exam Part B', 2, 1]);

      // 6. Seed Assessments (Questions) (course_id = 1)
      const assessments = [
        ['CW', 'Test 1', 'Test 1', 'A1', 3.0, 3, 'CLO_01', 'PLO_06', null, 1],
        ['CW', 'Test 1', 'Test 1', 'A2', 4.0, 4, 'CLO_01', 'PLO_06', null, 1],
        ['CW', 'Test 1', 'Test 1', 'A3', 3.0, 3, 'CLO_02', 'PLO_05', null, 1],
        ['CW', 'Test 2', 'Test 2', 'B1', 3.0, 3, 'CLO_02', 'PLO_05', null, 1],
        ['CW', 'Test 2', 'Test 2', 'B2', 3.0, 3, 'CLO_02', 'PLO_05', null, 1],
        ['CW', 'Test 2', 'Test 2', 'B3', 4.0, 4, 'CLO_01', 'PLO_06', null, 1],
        ['CW', 'History Study', 'HS', '1', 10.0, 10, 'CLO_01', 'PLO_06', null, 1],
        ['CW', 'History Study', 'HS', '2', 5.0, 5, 'CLO_02', 'PLO_05', null, 1],
        ['CW', 'History Study', 'HS', '3', 5.0, 5, 'CLO_02', 'PLO_05', null, 1],
        ['CW', 'History Study', 'HS', '4', 10.0, 10, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'A', 'A1', 4.29, 6.0, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'A', 'A2', 5.36, 7.5, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'A', 'A3', 5.71, 8.0, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'A', 'A4', 2.86, 4.0, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'A', 'A5', 3.21, 4.5, 'CLO_01', 'PLO_06', null, 1],
        ['E', 'Final Examination', 'B', 'B1', 14.29, 10.0, 'CLO_02', 'PLO_05', 1, 1],
        ['E', 'Final Examination', 'B', 'B2', 14.29, 10.0, 'CLO_02', 'PLO_05', 1, 1],
        ['E', 'Final Examination', 'B', 'B3', 14.29, 10.0, 'CLO_02', 'PLO_05', 1, 1],
        ['E', 'Final Examination', 'B', 'B4', 14.29, 10.0, 'CLO_02', 'PLO_05', 1, 1]
      ];

      const assStmt = db.prepare(`INSERT INTO assessments (type, title, section, question_no, weightage, max_mark, clo_no, plo_no, optional_group_id, course_id, description) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`);
      assessments.forEach(([type, title, section, qno, wt, max, clo, plo, ogId, cId]) => {
        assStmt.run([type, title, section, qno, wt, max, clo, plo, ogId, cId, 'Seeded assessment item']);
      });
      assStmt.finalize();

      // Seed Planned Assessments (course_id = 1)
      const planned = [
        ['Test 1', 'CW', 10.0, 1],
        ['Test 2', 'CW', 10.0, 1],
        ['History Study', 'CW', 30.0, 1],
        ['Final Examination', 'E', 50.0, 1]
      ];
      const planStmt = db.prepare("INSERT INTO planned_assessments (title, type, weightage, course_id) VALUES (?, ?, ?, ?)");
      planned.forEach(([title, type, weightage, cId]) => {
        planStmt.run([title, type, weightage, cId]);
      });
      planStmt.finalize();

      // 7. Seed Grade Thresholds (course_id = 1)
      const grades = [
        ['A+', 94.5, 1],
        ['A', 84.5, 1],
        ['A-', 74.5, 1],
        ['B+', 69.5, 1],
        ['B', 64.5, 1],
        ['B-', 59.5, 1],
        ['C+', 54.5, 1],
        ['C', 49.5, 1],
        ['C-', 46.5, 1],
        ['D+', 43.5, 1],
        ['D', 39.5, 1],
        ['F', 0.0, 1]
      ];
      const gradeStmt = db.prepare("INSERT INTO grade_thresholds (grade, min_mark, course_id) VALUES (?, ?, ?)");
      grades.forEach(([gr, min, cId]) => {
        gradeStmt.run([gr, min, cId]);
      });
      gradeStmt.finalize();

      // 8. Seed Students (course_id = 1)
      const students = [
        ['243925026', 'ABDULKADIR ABDIRAHMAN ABDIWELI', 'FBE301', '', '', 1],
        ['243925210', 'AL BAYATI HAJIR MUSTAFA HAMID', 'FBE301', '', '', 1],
        ['243925028', 'ALRAWEY MOHAMMED ELSIR MOHAMMED AHMED', 'FBE301', '', '', 1],
        ['243025044', 'ARISHA NAJWA BINTI BINTI ABDUL AZIZ', 'FBE301', '', '', 1],
        ['243925216', 'BASHIR MUKHTAR ELWASILA ISRAA', 'FBE301', '', '', 1],
        ['243924990', 'GAFFAR ELBASHIR ALI ALAA', 'FBE301', '', '', 1],
        ['243924946', 'HATIM ABDELHAFIZ ABDELRAHMAN HUSAMELDIN', 'FBE301', '', '', 1],
        ['243924986', 'IFTI FAHIM MAHMUD', 'FBE301', '', '', 1],
        ['243925165', 'KHALID ABDALLA GURASHI ROMISA', 'FBE301', '', '', 1],
        ['243925017', 'KUATBAYEV DANIYEL', 'FBE301', '', '', 1],
        ['243925065', 'MAHAMAT ABDELKERIM ADAM', 'FBE301', '', '', 1],
        ['241924535', 'MALAK ALI RAAMIZ', 'FBE301', '', '', 1],
        ['243924945', 'MOHAMED ELHASSAN MUSTAFA MOHAMEDELHASSAN MUSTAFA', 'FBE301', '', '', 1],
        ['243925194', 'MOHAMED GABER MOHAMED ASAWIR', 'FBE301', '', '', 1],
        ['233924172', 'MOHAMED JACFAR HASSAN', 'FBE301', '', '', 1],
        ['243925008', 'MOHAMMED ABBAS SULIMAN HAMID', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243924987', 'MOHAMMED SAMI ABDALWAHAB IDRIS', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243925046', 'NIHAL RAMADAN AWAD BASHIR', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243924976', 'RAHMAN SAMIHA AFSARA', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243924974', 'REEM MOHAMED ELSADIG ABD ELMAGEED ELAMEEN', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243924966', 'RUA ELNOUR MOHAMED ANNOUR', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243925102', 'SIDDIG GAFAR MUDAWI AHMED', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243924979', 'VANSHEEKA DEVI', 'FBE301', 'mazlina@klust.edu.my', '', 1],
        ['243925012', 'ZHOU LETONG', 'FBE301', 'mazlina@klust.edu.my', '', 1]
      ];
      const studentStmt = db.prepare("INSERT INTO students (matric_id, name, programme, email, hp_no, course_id) VALUES (?, ?, ?, ?, ?, ?)");
      students.forEach(([id, name, prog, email, hp, cId]) => {
        studentStmt.run([id, name, prog, email, hp, cId]);
      });
      studentStmt.finalize();

      // 9. Seed Marks (No schema change, links to assessments)
      const s1Marks = [3.0, 4.0, 2.0, 2.6, 3.0, 1.0, 6.0, 4.0, 4.0, 6.0, 5.5, 7.5, 7.5, 2.0, 0.0, null, 8.0, 3.5, null];
      const s2Marks = [3.0, 4.0, 3.0, 3.0, 3.0, 4.0, 10.0, 5.0, 5.0, 10.0, 6.0, 7.5, 8.0, 4.0, 4.5, 10.0, null, 10.0, null];

      const markStmt = db.prepare("INSERT INTO marks (student_matric_id, assessment_id, raw_mark) VALUES (?, ?, ?)");
      s1Marks.forEach((m, idx) => {
        if (m !== null) {
          markStmt.run(['243925026', idx + 1, m]);
        }
      });
      s2Marks.forEach((m, idx) => {
        if (m !== null) {
          markStmt.run(['243925210', idx + 1, m]);
        }
      });
      markStmt.finalize();

      // 10. Seed Attendance (course_id = 1)
      const dates = [
        '7 Jul', '10 Jul', '14 Jul', '17 Jul', '21 Jul', '24 Jul', '28 Jul', '31 Jul',
        '4 Aug', '7 Aug', '11 Aug', '14 Aug', '18 Aug', '21 Aug', '25 Aug', '28 Aug',
        '1 Sep', '4 Sep', '8 Sep', '11 Sep', '15 Sep', '18 Sep', '22 Sep', '25 Sep',
        '29 Sep', '2 Oct', '6 Oct', '9 Oct'
      ];
      const attStmt = db.prepare("INSERT INTO attendance (student_matric_id, session_date, status, course_id) VALUES (?, ?, ?, ?)");
      students.forEach(([id]) => {
        dates.forEach(d => {
          attStmt.run([id, d, 'Y', 1]);
        });
      });
      attStmt.finalize();

      // 11. Seed Weekly Syllabus & Reports (course_id = 1)
      const reports = [
        [1, '07-07-2025 (Week 1)', 'Introduction + Briefing', 'Introduction to 3D Architectural Modeling: Basic concept and outcomes', 1.0, 2.0, 'as planned', 1],
        [2, '14-07-2025 (Week 2)', 'Single Storey 1', 'Introduction to 3D Architectural Modeling: Advanced modeling tools and concepts i.e. solid modeling and surface modeling', 1.0, 2.0, 'as planned', 1],
        [3, '21-07-2025 (Week 3)', 'Single Storey 2 + Site', 'Introduction to 3D Architectural Modeling: Controlling object properties modeling tools and concepts i.e. parametric components, grid and level', 1.0, 2.0, 'as planned', 1],
        [4, '28-07-2025 (Week 4)', 'Multi Storey 1 + Group + Displacement + Staircase', '3D Architectural Modeling: The advanced 3D modeling methods for accuracy, management and editing.', 1.0, 2.0, 'as planned', 1],
        [5, '04-08-2025 (Week 5)', 'Multi Storey 2', '3D Architectural Modeling: The advanced 3D modeling methods using a 3D Application and controlling the Outcomes/Styles', 1.0, 2.0, 'as planned', 1],
        [6, '11-08-2025 (Week 6)', 'Checkpoint Test', 'Architectural Production: 2D Presentation Products i.e. Orthographic views with various styles and rendering', 2.0, 1.0, 'as planned but some students need to retake test for various reasons', 1],
        [7, '18-08-2025 (Week 7)', 'Mass Modeling + Building Analysis', 'Architectural Production: 3D Presentation Products i.e. 3D Animation Walkthrough and Perspectives with various styles and rendering', 2.0, 1.5, 'as planned', 1],
        [8, '25-08-2025 (Week 8)', 'Mass Modelling + Presentation + Document', 'Introduction to BIM: Interface, Menu, Setting, Concept and Outcomes', 1.0, 2.5, 'as planned', 1],
        [9, '01-09-2025 (Week 9)', 'Revit Families', 'Introduction to BIM: Drawing single storey building with basic parametric building elements', 1.0, 2.5, 'as planned', 1],
        [10, '08-09-2025 (Week 10)', 'Adaptive Component', 'Introduction to BIM: Interface, Menu, Setting, Concept and Outcomes', 2.0, 1.5, 'as planned', 1],
        [11, '15-09-2025 (Week 11)', 'Checkpoint Test/Project', 'Introduction to BIM: Drawing multi storey building with more parametric building elements', 2.0, 1.5, 'as planned', 1],
        [12, '22-09-2025 (Week 12)', 'Twinmotion 1: Animation', 'Advanced Modelling: Site Components and Mass Modelling', 2.0, 1.5, 'as planned', 1],
        [13, '29-09-2025 (Week 13)', 'Twinmotion 2: Virtual Presentation', 'Advanced Modelling: Creating Parametric Component and New Element Family', 2.0, 1.5, 'as planned', 1],
        [14, '06-10-2025 (Week 14)', 'Revit: Documentation', 'Generating Building Information and Analysis (3D) i.e. Exploded and Sectional Axonometric or 3D detailings', 2.0, 1.5, 'Resit Checkpoint Test were conducted well', 1]
      ];
      const reportStmt = db.prepare("INSERT INTO weekly_reports (week_no, date_label, topics, syllabus_topic, f2f_hours, nf2f_hours, remarks, course_id) VALUES (?, ?, ?, ?, ?, ?, ?, ?)");
      reports.forEach(([week, date, topics, syllabusTopic, f2f, nf2f, remarks, cId]) => {
        reportStmt.run([week, date, topics, syllabusTopic, f2f, nf2f, remarks, cId]);
      });
      reportStmt.finalize();

      console.log("Database seeded successfully with Syllabus Outline!");
    });
  });
}

export default db;
