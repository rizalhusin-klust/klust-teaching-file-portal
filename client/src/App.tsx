import { useState, useEffect, useRef } from 'react';
import Dashboard from './components/Dashboard';
import Roster from './components/Roster';
import MainTables from './components/MainTables';
import AssessmentSetup from './components/AssessmentSetup';
import MarksGrid from './components/MarksGrid';
import ObeDashboard from './components/ObeDashboard';
import AttendanceRegistry from './components/AttendanceRegistry';
import LecturerReport from './components/LecturerReport';
import SyllabusSetup from './components/SyllabusSetup';
import TeachingPlan from './components/TeachingPlan';
import LecturerTimetable from './components/LecturerTimetable';
import TeachingMaterials from './components/TeachingMaterials';
import CourseworkDocs from './components/CourseworkDocs';
import FinalExamDocs from './components/FinalExamDocs';
import CoursePortfolio from './components/CoursePortfolio';
import FinalResultDocs from './components/FinalResultDocs';
import MiscDocs from './components/MiscDocs';
import PrintHeader from './components/PrintHeader';

export type Student = {
  matric_id: string;
  name: string;
  programme: string;
  email: string;
  hp_no: string;
};

export type Assessment = {
  id: number;
  type: 'CW' | 'E';
  title: string;
  section: string;
  question_no: string;
  weightage: number;
  max_mark: number;
  clo_no: string;
  plo_no: string;
  optional_group_id: number | null;
  description?: string;
};

export type OptionalGroup = {
  id: number;
  group_name: string;
  max_selectable: number;
};

export type CourseInfo = {
  id: number;
  course_code: string;
  course_name: string;
  credit_hours: number;
  lecturer: string;
  email: string;
  room_no: string;
  telephone: string;
  hp_no: string;
  consultation_hours: string;
  semester: string;
  start_date?: string;
  end_date?: string;
  session1_day?: string;
  session1_start?: string;
  session1_end?: string;
  session2_day?: string;
  session2_start?: string;
  session2_end?: string;
  table4_path?: string;
  portfolio_data?: string;
  cw_weightage?: number;
  ex_weightage?: number;
  pass_fail_mode?: number;
  pass_mark?: number;
  synopsis?: string;
  references_list?: string;
};

export type MarkRecord = {
  student_matric_id: string;
  assessment_id: number;
  raw_mark: number;
};

export type AttendanceRecord = {
  student_matric_id: string;
  session_date: string;
  status: 'Y' | 'N' | 'MC';
};

export type WeeklyReport = {
  week_no: number;
  date_label: string;
  topics: string;
  syllabus_topic: string;
  f2f_hours: number;
  nf2f_hours: number;
  remarks: string;
};

export type CloPloMapping = {
  clo_no: string;
  plo_no: string;
  is_mapped: number;
  teaching_method: string;
  assessment_method: string;
};

export type CLO = {
  clo_no: string;
  description: string;
};

export type PLO = {
  plo_no: string;
  description: string;
};

export type GradeThreshold = {
  grade: string;
  min_mark: number;
};

export type PlannedAssessment = {
  id: number;
  title: string;
  type: 'CW' | 'E';
  weightage: number;
};

const API_BASE = 'http://localhost:3001/api';


const PrintSeparator = ({ number, title }: { number: number | string; title: string }) => (
  <div className="print-separator-section" style={{ border: 'none', boxShadow: 'none', width: '100%', maxWidth: '100%', height: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'flex-end', textAlign: 'right', margin: 0, padding: '4rem', boxSizing: 'border-box' }}>
    <div style={{ fontFamily: '"Segoe UI", -apple-system, sans-serif', fontWeight: 900, color: 'transparent', WebkitTextStroke: '3px black', fontSize: '9rem', lineHeight: 1, margin: 0, letterSpacing: '-0.02em' }}>
      {number}
    </div>
    <div style={{ width: '100%', height: '2px', backgroundColor: 'black', marginTop: '1rem', marginBottom: '0.75rem' }}></div>
    <div style={{ fontFamily: '"SegoeUI-Light", "Segoe UI Light", "Segoe UI", -apple-system, sans-serif', fontSize: '40px', fontWeight: 300, lineHeight: 1.2, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'black', marginTop: '0.25rem', marginBottom: '0.25rem', maxWidth: '100%' }}>
      {title}
    </div>
    <div style={{ width: '100%', height: '2px', backgroundColor: 'black', marginTop: '0.75rem', marginBottom: 0 }}></div>
  </div>
);

function App() {
  const [activeTab, setActiveTab] = useState<string>('setup');
  const [isObeMenuOpen, setIsObeMenuOpen] = useState<boolean>(true);
  const [isPlanMenuOpen, setIsPlanMenuOpen] = useState<boolean>(true);
  const [isCourseworkMenuOpen, setIsCourseworkMenuOpen] = useState<boolean>(true);
  const [isExamMenuOpen, setIsExamMenuOpen] = useState<boolean>(true);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [activeCourseId, setActiveCourseId] = useState<number | null>(null);
  const [courseInfo, setCourseInfo] = useState<CourseInfo | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [assessments, setAssessments] = useState<Assessment[]>([]);
  const [optionalGroups, setOptionalGroups] = useState<OptionalGroup[]>([]);
  const [marks, setMarks] = useState<MarkRecord[]>([]);
  const [attendance, setAttendance] = useState<AttendanceRecord[]>([]);
  const [reports, setReports] = useState<WeeklyReport[]>([]);
  const [cloPloMappings, setCloPloMappings] = useState<CloPloMapping[]>([]);
  const [gradesData, setGradesData] = useState<any[]>([]);
  const [obeMetrics, setObeMetrics] = useState<any>(null);
  const [clos, setClos] = useState<CLO[]>([]);
  const [plos, setPlos] = useState<PLO[]>([]);
  const [gradeThresholds, setGradeThresholds] = useState<GradeThreshold[]>([]);
  const [plannedAssessments, setPlannedAssessments] = useState<PlannedAssessment[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [isPrintingAll, setIsPrintingAll] = useState<boolean>(false);
  const [isExportingHtml, setIsExportingHtml] = useState<boolean>(false);
  const printAllRef = useRef<HTMLDivElement>(null);

  const [theme, setTheme] = useState<'dark' | 'light'>(() => {
    const saved = localStorage.getItem('theme');
    return (saved === 'light' || saved === 'dark') ? saved : 'dark';
  });

  const [sidebarCollapsed, setSidebarCollapsed] = useState<boolean>(() => {
    return localStorage.getItem('sidebarCollapsed') === 'true';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem('sidebarCollapsed', String(sidebarCollapsed));
  }, [sidebarCollapsed]);

  const fetchCourses = async () => {
    try {
      const res = await fetch(`${API_BASE}/courses`);
      const data = await res.json();
      setCourses(data);
      if (data.length > 0 && activeCourseId === null) {
        setActiveCourseId(data[0].id);
      }
      return data;
    } catch (err) {
      console.error('Error fetching courses list:', err);
      return [];
    }
  };

  const fetchData = async (cId: number | null = activeCourseId) => {
    if (cId === null) return;
    try {
      setLoading(true);
      const q = `?course_id=${cId}`;
      const [infoRes, stuRes, assRes, optRes, marksRes, attRes, repRes, mapRes, gradesRes, obeRes, closRes, plosRes, thresholdsRes, plannedRes] = await Promise.all([
        fetch(`${API_BASE}/course-info${q}`),
        fetch(`${API_BASE}/students${q}`),
        fetch(`${API_BASE}/assessments${q}`),
        fetch(`${API_BASE}/optional-groups${q}`),
        fetch(`${API_BASE}/marks${q}`),
        fetch(`${API_BASE}/attendance${q}`),
        fetch(`${API_BASE}/reports${q}`),
        fetch(`${API_BASE}/clo-plo-mappings${q}`),
        fetch(`${API_BASE}/grades${q}`),
        fetch(`${API_BASE}/obe-metrics${q}`),
        fetch(`${API_BASE}/clos${q}`),
        fetch(`${API_BASE}/plos${q}`),
        fetch(`${API_BASE}/grade-thresholds${q}`),
        fetch(`${API_BASE}/planned-assessments${q}`)
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
  };

  const refreshAll = async () => {
    const freshCourses = await fetchCourses();
    let currentId = activeCourseId;
    if (currentId === null && freshCourses.length > 0) {
      currentId = freshCourses[0].id;
      setActiveCourseId(currentId);
    }
    if (currentId !== null) {
      await fetchData(currentId);
    }
  };

  const handlePrintAll = () => {
    setIsPrintingAll(true);
    document.body.classList.add('print-all-mode');
    const cleanup = () => {
      setIsPrintingAll(false);
      document.body.classList.remove('print-all-mode');
      window.removeEventListener('afterprint', cleanup);
    };
    window.addEventListener('afterprint', cleanup);
    setTimeout(() => {
      window.print();
      setTimeout(cleanup, 10000);
    }, 400);
  };

  const handleExportHtml = async () => {
    setIsExportingHtml(true);
    setIsPrintingAll(true);

    // Wait for React to fully render the overlay
    await new Promise(r => setTimeout(r, 500));

    const sections = printAllRef.current?.querySelectorAll('.print-all-section');
    if (!sections || sections.length === 0) {
      setIsExportingHtml(false);
      setIsPrintingAll(false);
      return;
    }

    // Get LMS result PDF path from course portfolio
    let lmsResultPdfUrl = '';
    let timetablePdfUrl = '';
    let attendancePdfUrls: string[] = [];
    if (courseInfo?.portfolio_data) {
      try {
        const parsed = JSON.parse(courseInfo.portfolio_data);
        if (parsed.lms_result && parsed.lms_result.type === 'file' && parsed.lms_result.value) {
          lmsResultPdfUrl = parsed.lms_result.value;
        }
        if (parsed.timetable && parsed.timetable.type === 'file' && parsed.timetable.value) {
          timetablePdfUrl = parsed.timetable.value;
        }
        for (let i = 1; i <= 5; i++) {
          const k = `attendance_pdf_${i}`;
          if (parsed[k] && parsed[k].type === 'file' && parsed[k].value) {
            attendancePdfUrls.push(parsed[k].value);
          }
        }
      } catch (e) {
        console.error('Failed to parse portfolio_data:', e);
      }
    }
    const serverUrl = API_BASE.replace('/api', '');
    const fullPdfUrl = lmsResultPdfUrl ? `${serverUrl}${lmsResultPdfUrl}` : '';
    const fullTimetableUrl = timetablePdfUrl ? `${serverUrl}${timetablePdfUrl}` : '';
    const fullAttendancePdfUrls = attendancePdfUrls.map(url => `${serverUrl}${url}`);

    const tabDefs = [
      { icon: '📄', label: 'Cover Page' },
      { icon: '📄', label: '1. Details of Students\' Results' },
      { icon: '📄', label: '2. OBE Assessment' },
      { icon: '📄', label: '3. Course Syllabus' },
      { icon: '📄', label: '4. Teaching Plan' },
      { icon: '📄', label: '5. Time-Table of Lecturer' },
      { icon: '📄', label: '6. Student Monthly Attendance' },
      { icon: '📄', label: '7. Report by Lecturer' },
      { icon: '📄', label: '8. Teaching Materials' },
      { icon: '📄', label: '9. Moderated Final Exam' },
      { icon: '📄', label: '10. Final Exam Scripts' },
      { icon: '📄', label: '11. Coursework & Marking' },
      { icon: '📄', label: '12. Samples of Coursework' },
      { icon: '📄', label: '13. Miscellaneous Records' }
    ];

    const courseCode = courseInfo?.course_code || 'COURSE';
    const courseName = courseInfo?.course_name || '';
    const semester   = courseInfo?.semester || '';
    const lecturer   = courseInfo?.lecturer || '';

    // Build tab nav HTML
    const tabNavHtml = tabDefs.map((t, i) =>
      `<button class="tab-btn${i === 0 ? ' active' : ''}" onclick="showTab(${i})" title="${t.label}">
        <span class="tab-icon">${t.icon}</span>
        <span class="tab-label">${t.label}</span>
      </button>`
    ).join('\n');

    // Build section panels HTML
    // print-all-section JSX order:
    //   0=Cover, 1=TOS, 2=OBE, 3=Syllabus, 4=TeachingPlan,
    //   5=Attendance, 6=LecturerReport, 7=Portfolio
    const sectionHtmls = Array.from(sections).map(sec => sec.innerHTML);
    const panels: string[] = [];

    // Panel 0: Cover Page (sectionHtmls[0])
    panels.push(
      `<section id="panel-0" class="panel active">
        <div class="panel-inner">${sectionHtmls[0]}</div>
      </section>`
    );

    // Panel 1: LMS Results PDF (special – PDF iframe)
    const lmsPanelContent = fullPdfUrl
      ? `<iframe class="export-only" src="${fullPdfUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Detail of Student Result (LMS)"></iframe>
         <div class="print-link-only" style="margin-top: 20px;">📄 <strong>Detail of Student Result (LMS):</strong> <a href="${fullPdfUrl}" style="color: blue; text-decoration: underline;">${fullPdfUrl}</a></div>`
      : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
          <div style="font-size:4rem;margin-bottom:16px;">📄</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Result PDF Uploaded</h2>
          <p style="font-size:0.95rem;color:#64748b;max-width:400px;line-height:1.5;">The LMS Student Result Detail PDF has not been uploaded yet.</p>
        </div>`;
    panels.push(
      `<section id="panel-1" class="panel">
        <div class="panel-inner" style="padding:16px;height:100%;box-sizing:border-box;background:#f8fafc !important;">
          ${lmsPanelContent}
        </div>
      </section>`
    );

    // Panel 2: Table of Specification (sectionHtmls[1])
    panels.push(
      `<section id="panel-2" class="panel">
        <div class="panel-inner">${sectionHtmls[1]}</div>
      </section>`
    );

    // Panel 3: OBE CLO/PLO (sectionHtmls[2])
    panels.push(
      `<section id="panel-3" class="panel">
        <div class="panel-inner">${sectionHtmls[2]}</div>
      </section>`
    );

    // Panel 4: Syllabus Outline (Table 4 PDF)
    const fullSyllabusPdfUrl = courseInfo?.table4_path ? `${serverUrl}${courseInfo.table4_path}` : '';
    const syllabusPanelContent = fullSyllabusPdfUrl
      ? `<iframe class="export-only" src="${fullSyllabusPdfUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Table 4 (Syllabus Outline PDF Document)"></iframe>
         <div class="print-link-only" style="margin-top: 20px;">📄 <strong>Syllabus Outline PDF:</strong> <a href="${fullSyllabusPdfUrl}" style="color: blue; text-decoration: underline;">${fullSyllabusPdfUrl}</a></div>`
      : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
          <div style="font-size:4rem;margin-bottom:16px;">📄</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Syllabus Outline PDF Uploaded</h2>
          <p style="font-size:0.95rem;color:#64748b;max-width:400px;line-height:1.5;">The Table 4 (Syllabus Outline PDF Document) has not been uploaded yet.</p>
        </div>`;
    panels.push(
      `<section id="panel-4" class="panel">
        <div class="panel-inner" style="padding:16px;height:100%;box-sizing:border-box;background:#f8fafc !important;">
          ${syllabusPanelContent}
        </div>
      </section>`
    );

    // Panel 5: Teaching Plan (sectionHtmls[4])
    panels.push(
      `<section id="panel-5" class="panel">
        <div class="panel-inner">${sectionHtmls[4]}</div>
      </section>`
    );

    // Panel 6: Teaching Materials (sectionHtmls[5])
    panels.push(
      `<section id="panel-6" class="panel">
        <div class="panel-inner">${sectionHtmls[5]}</div>
      </section>`
    );

    // Panel 7: Timetable of Lecturer (special – PDF iframe)
    const timetablePanelContent = fullTimetableUrl
      ? `<iframe class="export-only" src="${fullTimetableUrl}" style="width:100%;height:100vh;page-break-after:always;break-after:page;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Timetable of Lecturer"></iframe>
         <div class="print-link-only" style="margin-top: 20px;">📄 <strong>Timetable of Lecturer:</strong> <a href="${fullTimetableUrl}" style="color: blue; text-decoration: underline;">${fullTimetableUrl}</a></div>`
      : `<div style="display:flex;flex-direction:column;align-items:center;justify-content:center;height:calc(100vh - 120px);text-align:center;color:#475569;padding:20px;box-sizing:border-box;">
          <div style="font-size:4rem;margin-bottom:16px;">🗓️</div>
          <h2 style="font-size:1.5rem;font-weight:700;color:#1e293b;margin-bottom:8px;">No Timetable Uploaded</h2>
          <p style="font-size:0.95rem;color:#64748b;max-width:400px;line-height:1.5;">The Timetable Schedule PDF has not been uploaded to the Course Portfolio yet.</p>
        </div>`;
    panels.push(
      `<section id="panel-7" class="panel">
        <div class="panel-inner" style="padding:16px;height:100%;box-sizing:border-box;background:#f8fafc !important;">
          ${timetablePanelContent}
        </div>
      </section>`
    );

    // Panel 8: Student Monthly Attendance (sectionHtmls[6])
    const attendancePdfHtml = fullAttendancePdfUrls.length > 0
      ? `<div style="margin-top: 32px;"><h3 style="font-size:1.25rem;font-weight:600;margin-bottom:16px;">Student Monthly Attendance PDFs</h3>` + 
        fullAttendancePdfUrls.map((url, idx) => `<div class="export-only" style="margin-bottom: 24px; height: 100vh; width: 100%; display: flex; flex-direction: column; page-break-after: always; break-after: page;"><h4 style="font-size:1rem;color:#475569;margin-bottom:8px;">Month ${idx + 1}</h4><iframe src="${url}" style="width:100%;flex:1;border:none;border-radius:8px;box-shadow:0 4px 6px -1px rgba(0,0,0,0.1);background-color:#525659;" title="Student Monthly Attendance Month ${idx + 1}"></iframe></div><div class="print-link-only" style="margin-bottom: 10px;">📄 <strong>Attendance Month ${idx + 1}:</strong> <a href="${url}" style="color: blue; text-decoration: underline;">${url}</a></div>`).join('') +
        `</div>`
      : '';
    panels.push(
      `<section id="panel-8" class="panel">
        <div class="panel-inner">${sectionHtmls[6]}${attendancePdfHtml}</div>
      </section>`
    );

    // Panel 9: Weekly Reports (sectionHtmls[7])
    panels.push(
      `<section id="panel-9" class="panel">
        <div class="panel-inner">${sectionHtmls[7]}</div>
      </section>`
    );

    // Panel 10: Coursework Docs (sectionHtmls[8])
    panels.push(
      `<section id="panel-10" class="panel">
        <div class="panel-inner">${sectionHtmls[8]}</div>
      </section>`
    );

    // Panel 11: Final Exam Docs (sectionHtmls[9])
    panels.push(
      `<section id="panel-11" class="panel">
        <div class="panel-inner">${sectionHtmls[9]}</div>
      </section>`
    );

    // Panel 12: Course Portfolio (sectionHtmls[10])
    panels.push(
      `<section id="panel-12" class="panel">
        <div class="panel-inner">${sectionHtmls[10]}</div>
      </section>`
    );

    const panelsHtml = panels.join('\n');

    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${courseCode} ${courseName} — Course Portfolio</title>
  <style>
    *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: 'Segoe UI', system-ui, sans-serif;
      background: #0f1624;
      color: #e2e8f0;
      display: flex;
      height: 100vh;
      overflow: hidden;
    }

    /* ── Sidebar ───────────────────────────────── */
    .sidebar {
      width: 230px;
      min-width: 230px;
      background: #141c2e;
      border-right: 1px solid #1e2d45;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      flex-shrink: 0;
    }
    .sidebar-header {
      padding: 20px 16px 14px;
      border-bottom: 1px solid #1e2d45;
    }
    .brand {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 14px;
    }
    .brand-icon {
      width: 32px; height: 32px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border-radius: 8px;
      display: flex; align-items: center; justify-content: center;
      font-weight: 800; font-size: 1rem; color: white;
    }
    .brand-name {
      font-size: 0.8rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.08em;
      color: #e2e8f0;
    }
    .course-badge {
      background: linear-gradient(135deg, rgba(99,102,241,0.15), rgba(139,92,246,0.15));
      border: 1px solid rgba(99,102,241,0.3);
      border-radius: 8px;
      padding: 10px 12px;
    }
    .course-code {
      font-size: 1rem; font-weight: 800;
      color: #818cf8;
      letter-spacing: 0.04em;
    }
    .course-name {
      font-size: 0.72rem; color: #94a3b8;
      margin-top: 2px; line-height: 1.3;
    }
    .course-meta {
      font-size: 0.68rem; color: #64748b;
      margin-top: 6px;
    }

    /* ── Tab Buttons ───────────────────────────── */
    .tabs {
      padding: 12px 8px;
      display: flex;
      flex-direction: column;
      gap: 2px;
    }
    .tabs-label {
      font-size: 0.65rem; font-weight: 700;
      text-transform: uppercase; letter-spacing: 0.1em;
      color: #475569;
      padding: 4px 8px 6px;
    }
    .tab-btn {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 10px 12px;
      border: none;
      background: transparent;
      color: #94a3b8;
      border-radius: 8px;
      cursor: pointer;
      text-align: left;
      font-size: 0.82rem;
      font-family: inherit;
      transition: background 0.15s, color 0.15s;
      width: 100%;
    }
    .tab-btn:hover {
      background: rgba(255,255,255,0.05);
      color: #e2e8f0;
    }
    .tab-btn.active {
      background: linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.2));
      color: #a5b4fc;
      font-weight: 600;
      border-left: 3px solid #6366f1;
      padding-left: 9px;
    }
    .tab-icon { font-size: 1rem; flex-shrink: 0; }
    .tab-label { line-height: 1.25; }

    /* ── Footer ────────────────────────────────── */
    .sidebar-footer {
      margin-top: auto;
      padding: 12px 16px;
      border-top: 1px solid #1e2d45;
      font-size: 0.68rem;
      color: #475569;
      line-height: 1.5;
    }
    .print-all-btn {
      display: block;
      width: 100%;
      padding: 9px 12px;
      margin-top: 8px;
      background: linear-gradient(135deg, #6366f1, #8b5cf6);
      border: none;
      border-radius: 8px;
      color: white;
      font-size: 0.8rem;
      font-weight: 700;
      cursor: pointer;
      font-family: inherit;
      transition: opacity 0.15s;
    }
    .print-all-btn:hover { opacity: 0.85; }

    /* ── Content Area ──────────────────────────── */
    .content {
      flex: 1;
      overflow-y: auto;
      background: #f8fafc;
    }
    .panel {
      display: none;
      min-height: 100%;
    }
    .panel.active {
      display: block;
    }
    .panel-inner {
      background: white;
      min-height: 100%;
      padding: 32px 40px;
      color: black;
    }

    /* ── Content Normalisation ─────────────────── */
    .panel-inner * {
      color: black !important;
      background: white !important;
      box-shadow: none !important;
    }
    .panel-inner h1, .panel-inner h2, .panel-inner h3 {
      color: #1e3a8a !important;
      margin-bottom: 8px;
    }
    .panel-inner h2 { font-size: 1.1rem; padding-bottom: 6px; border-bottom: 2px solid #e2e8f0; margin-bottom: 14px; }
    .panel-inner table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
      font-size: 0.85rem;
    }
    .panel-inner th {
      background: #f1f5f9 !important;
      color: #1e3a8a !important;
      font-weight: 700;
      padding: 7px 10px;
      border: 1px solid #cbd5e1;
      text-align: left;
      font-size: 0.8rem;
    }
    .panel-inner td {
      padding: 6px 10px;
      border: 1px solid #e2e8f0;
      vertical-align: top;
      line-height: 1.4;
    }
    .panel-inner tr:nth-child(even) td {
      background: #f8fafc !important;
    }
    .panel-inner .view-card {
      border: 1px solid #e2e8f0 !important;
      border-radius: 8px !important;
      padding: 20px !important;
      margin-bottom: 20px !important;
      background: white !important;
    }
    /* Hide interactive controls */
    .panel-inner button,
    .panel-inner .btn,
    .panel-inner .no-print,
    .panel-inner form,
    .panel-inner .alert { display: none !important; }
    /* Show print-only elements */
    .panel-inner .only-print { display: block !important; }
    /* Attendance cells */
    .panel-inner .attendance-cell {
      display: inline-flex !important;
      align-items: center !important;
      justify-content: center !important;
      width: 22px; height: 22px;
      border-radius: 4px;
      font-size: 0.65rem;
      font-weight: 700;
    }
    .panel-inner .attendance-cell.Y { background: #10b981 !important; color: white !important; }
    .panel-inner .attendance-cell.N { background: #ef4444 !important; color: white !important; }
    .panel-inner .attendance-cell.MC { background: #f59e0b !important; color: white !important; }
    /* Spreadsheet / overflow tables */
    .panel-inner .spreadsheet-grid,
    .panel-inner .table-container {
      max-height: none !important;
      overflow: visible !important;
      overflow-x: auto !important;
    }
    /* Inline inputs rendered as text */
    .panel-inner .inline-input,
    .panel-inner .inline-textarea {
      border: none !important;
      background: transparent !important;
      padding: 0 !important;
      font-size: 0.85rem !important;
      width: 100%;
      resize: none;
    }
    /* KLUST F28 print pages shown inline */
    .panel-inner .print-page {
      border: 1px solid #ddd !important;
      padding: 20px !important;
      margin-bottom: 20px !important;
      border-radius: 4px !important;
    }
    .panel-inner .print-only { display: block !important; }
    .panel-inner .only-print { display: block !important; }
    .panel-inner .screen-only { display: none !important; }
    .panel-inner .no-print { display: none !important; }

    /* ── Print this page ───────────────────────── */
    @media print {
      .sidebar { display: none !important; }
      .content { overflow: visible !important; }
      .panel { display: none !important; }
      .panel.active { display: block !important; }
    }
  </style>
</head>
<body class="export-html-mode">
  <nav class="sidebar">
    <div class="sidebar-header">
      <div class="brand">
        <div class="brand-icon">K</div>
        <div class="brand-name">KLUST TF PORTAL <span style="color:#818cf8;font-weight:800">v.1</span></div>
      </div>
      <div class="course-badge">
        <div class="course-code">${courseCode}</div>
        <div class="course-name">${courseName}</div>
        <div class="course-meta">${semester}${lecturer ? ' · ' + lecturer : ''}</div>
      </div>
    </div>
    <div class="tabs">
      <div class="tabs-label">Documents</div>
      ${tabNavHtml}
    </div>
    <div class="sidebar-footer">
      <div>📁 Course Portfolio Export</div>
      <div style="margin-top:4px">Generated ${new Date().toLocaleDateString('en-MY', { day:'2-digit', month:'short', year:'numeric' })}</div>
      <button class="print-all-btn" onclick="window.print()">🖨️ Print Active Document</button>
    </div>
  </nav>

  <div class="content">
    ${panelsHtml}
  </div>

  <script>
    function showTab(n) {
      document.querySelectorAll('.panel').forEach(function(el, i) {
        el.classList.toggle('active', i === n);
      });
      document.querySelectorAll('.tab-btn').forEach(function(el, i) {
        el.classList.toggle('active', i === n);
      });
      document.querySelector('.content').scrollTop = 0;
    }
  <\/script>
</body>
</html>`;

    // Trigger download
    const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${courseCode}_portfolio.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    // Cleanup overlay
    setIsPrintingAll(false);
    setIsExportingHtml(false);
  };

  useEffect(() => {
    refreshAll();
  }, []);

  useEffect(() => {
    if (activeCourseId !== null) {
      fetchData(activeCourseId);
    }
  }, [activeCourseId]);

  const handleUpdateMarks = async (studentMatricId: string, assessmentId: number, rawMark: number | null) => {
    if (activeCourseId === null) return;
    try {
      await fetch(`${API_BASE}/marks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_matric_id: studentMatricId, assessment_id: assessmentId, raw_mark: rawMark })
      });
      // Refresh grades & marks
      const q = `?course_id=${activeCourseId}`;
      const [mRes, gRes, oRes] = await Promise.all([
        fetch(`${API_BASE}/marks${q}`),
        fetch(`${API_BASE}/grades${q}`),
        fetch(`${API_BASE}/obe-metrics${q}`)
      ]);
      setMarks(await mRes.json());
      setGradesData(await gRes.json());
      setObeMetrics(await oRes.json());
    } catch (err) {
      console.error('Error saving mark:', err);
    }
  };

  const handleUpdateAttendance = async (studentMatricId: string, date: string, status: 'Y' | 'N' | 'MC') => {
    if (activeCourseId === null) return;
    try {
      await fetch(`${API_BASE}/attendance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ student_matric_id: studentMatricId, session_date: date, status, course_id: activeCourseId })
      });
      const attRes = await fetch(`${API_BASE}/attendance?course_id=${activeCourseId}`);
      setAttendance(await attRes.json());
    } catch (err) {
      console.error('Error saving attendance:', err);
    }
  };

  if (loading && !courseInfo) {
    return (
      <div style={{ display: 'flex', minHeight: '100vh', alignItems: 'center', justifyContent: 'center', backgroundColor: '#090d16', color: '#fff' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ fontFamily: 'Outfit', marginBottom: '16px' }}>Loading Course Manager...</h2>
          <div className="logo-icon" style={{ margin: '0 auto', animation: 'spin 2s linear infinite' }}>C</div>
          <style>{`@keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }`}</style>
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard':
        return <Dashboard API_BASE={API_BASE} gradesData={gradesData} obeMetrics={obeMetrics} courseInfo={courseInfo} />;
      case 'roster':
        return <Roster students={students} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} courseInfo={courseInfo} />;
      case 'setup':
        return (
          <MainTables
            courseInfo={courseInfo}
            courses={courses}
            activeCourseId={activeCourseId}
            setActiveCourseId={setActiveCourseId}
            clos={clos}
            plos={plos}
            gradeThresholds={gradeThresholds}
            onRefresh={refreshAll}
            API_BASE={API_BASE}
          />
        );
      case 'assessments':
        return (
          <AssessmentSetup
            assessments={assessments}
            optionalGroups={optionalGroups}
            clos={clos}
            plos={plos}
            onRefresh={refreshAll}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            plannedAssessments={plannedAssessments}
            courseInfo={courseInfo}

          />
        );
      case 'marks':
        return (
          <MarksGrid
            students={students}
            assessments={assessments}
            optionalGroups={optionalGroups}
            marks={marks}
            gradesData={gradesData}
            onUpdateMark={handleUpdateMarks}
          />
        );
      case 'syllabus':
        return (
          <SyllabusSetup
            clos={clos}
            plos={plos}
            cloPloMappings={cloPloMappings}
            onRefresh={refreshAll}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            courseInfo={courseInfo}
          />
        );
      case 'teaching_plan':
        return (
          <TeachingPlan
            reports={reports}
            onRefresh={refreshAll}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            courseInfo={courseInfo}
            students={students}
            clos={clos}
            plos={plos}
            plannedAssessments={plannedAssessments}
            cloPloMappings={cloPloMappings}
          />
        );
            case 'time_table':
        return <LecturerTimetable courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />;
      case 'teaching_materials':
        return (
          <TeachingMaterials
            courseInfo={courseInfo}
            onRefresh={refreshAll}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
          />
        );
      case 'obe':
        return <ObeDashboard assessments={assessments} optionalGroups={optionalGroups} obeMetrics={obeMetrics} gradesData={gradesData} courseInfo={courseInfo} API_BASE={API_BASE} activeCourseId={activeCourseId} onRefresh={refreshAll} />;
      case 'attendance':
        return <AttendanceRegistry students={students} attendance={attendance} onUpdateAttendance={handleUpdateAttendance} courseInfo={courseInfo} API_BASE={API_BASE} activeCourseId={activeCourseId} />;
      case 'reports':
        return <LecturerReport courseInfo={courseInfo} reports={reports} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} />;
      case 'coursework_docs':
        return <CourseworkDocs courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />;
      case 'final_exam_docs':
        return <FinalExamDocs courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />;
      case 'coursework_samples':
          return <CoursePortfolio courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="coursework" />;
        case 'exam_scripts':
          return <CoursePortfolio courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="exam" />;
        case 'final_result':
          return <FinalResultDocs courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />;
        case 'misc_record':
          return <MiscDocs courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />;
        case 'portfolio':
        return <CoursePortfolio courseInfo={courseInfo} onRefresh={refreshAll} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} />;
      default:
        return <Dashboard API_BASE={API_BASE} gradesData={gradesData} obeMetrics={obeMetrics} courseInfo={courseInfo} />;
    }
  };

  const programCode = students.find(s => s.programme)?.programme || 'FBE301';
  const programName = programCode.toUpperCase() === 'FBE301' ? 'Bachelor of Science (Architectural Studies)' : programCode;

  return (
    <>
      <div className="app-container">
      {/* Sidebar navigation */}
      <aside className={`sidebar${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        <div className="logo-container" style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '18px', marginBottom: '24px' }}>
          <div className="logo-icon" style={{ borderRadius: '6px', background: 'var(--primary)', fontWeight: 'bold' }}>K</div>
          <span className="logo-text" style={{ fontSize: '0.85rem', letterSpacing: '0.05em', textTransform: 'uppercase', color: 'var(--text-active)', fontWeight: '700', lineHeight: '1.2' }}>KLUST TF PORTAL <span style={{ color: 'var(--primary)', fontWeight: '800' }}>v.1</span></span>
        </div>
        <ul className="nav-links">
          <li>
            <div className={`nav-item ${activeTab === 'setup' ? 'active' : ''}`} onClick={() => setActiveTab('setup')}>
              <span className="nav-icon">⚙️</span> Main Tables
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'dashboard' ? 'active' : ''}`} onClick={() => setActiveTab('dashboard')}>
              <span className="nav-icon">📊</span> Dashboard
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'roster' ? 'active' : ''}`} onClick={() => setActiveTab('roster')}>
              <span className="nav-icon">👥</span> List of Student
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'syllabus' ? 'active' : ''}`} onClick={() => setActiveTab('syllabus')}>
              <span className="nav-icon">📖</span> Syllabus Outline
            </div>
          </li>
          <li>
            <div className={`nav-item ${(activeTab === 'teaching_plan' || activeTab === 'time_table' || activeTab === 'attendance') ? 'active' : ''}`} onClick={() => { setActiveTab('teaching_plan'); setIsPlanMenuOpen(!isPlanMenuOpen); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="nav-icon">🗓️</span> Teaching Plan
              </div>
              <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isPlanMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            </div>
            {isPlanMenuOpen && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li>
                  <div className={`nav-item ${activeTab === 'teaching_plan' ? 'active' : ''}`} onClick={() => setActiveTab('teaching_plan')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Teaching Plan
                  </div>
                </li>
                <li>
                  <div className={`nav-item ${activeTab === 'time_table' ? 'active' : ''}`} onClick={() => setActiveTab('time_table')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Lecturer Timetable
                  </div>
                </li>
                <li>
                  <div className={`nav-item ${activeTab === 'attendance' ? 'active' : ''}`} onClick={() => setActiveTab('attendance')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Student Monthly Attendance
                  </div>
                </li>
              </ul>
            )}
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'teaching_materials' ? 'active' : ''}`} onClick={() => setActiveTab('teaching_materials')}>
              <span className="nav-icon">🔗</span> Teaching Materials
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'marks' ? 'active' : ''}`} onClick={() => setActiveTab('marks')}>
              <span className="nav-icon">📝</span> Marks Entry
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'obe' ? 'active' : ''}`} onClick={() => { setActiveTab('obe'); setIsObeMenuOpen(!isObeMenuOpen); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="nav-icon">🎯</span> OBE Assessment
              </div>
              <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isObeMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            </div>
            {/* Submenu for OBE Assessment */}
            {isObeMenuOpen && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li>
                  <div className={`nav-item ${activeTab === 'assessments' ? 'active' : ''}`} onClick={() => setActiveTab('assessments')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Table of Specification
                  </div>
                </li>
                <li>
                  <div className={`nav-item ${activeTab === 'obe' ? 'active' : ''}`} onClick={() => setActiveTab('obe')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Analysis
                  </div>
                </li>
              </ul>
            )}
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'reports' ? 'active' : ''}`} onClick={() => setActiveTab('reports')}>
              <span className="nav-icon">📝</span> Weekly Reports
            </div>
          </li>
          <li>
            <div className={`nav-item ${(activeTab === 'coursework_docs' || activeTab === 'coursework_samples') ? 'active' : ''}`} onClick={() => { setActiveTab('coursework_docs'); setIsCourseworkMenuOpen(!isCourseworkMenuOpen); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="nav-icon">📑</span> Coursework Docs
              </div>
              <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isCourseworkMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            </div>
            {isCourseworkMenuOpen && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li>
                  <div className={`nav-item ${activeTab === 'coursework_docs' ? 'active' : ''}`} onClick={() => setActiveTab('coursework_docs')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Coursework Docs
                  </div>
                </li>
                <li>
                  <div className={`nav-item ${activeTab === 'coursework_samples' ? 'active' : ''}`} onClick={() => setActiveTab('coursework_samples')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Coursework Samples
                  </div>
                </li>
              </ul>
            )}
          </li>
          <li>
            <div className={`nav-item ${(activeTab === 'final_exam_docs' || activeTab === 'exam_scripts') ? 'active' : ''}`} onClick={() => { setActiveTab('final_exam_docs'); setIsExamMenuOpen(!isExamMenuOpen); }} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="nav-icon">📄</span> Examination Docs
              </div>
              <span style={{ fontSize: '0.8rem', opacity: 0.5, transform: isExamMenuOpen ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }}>▶</span>
            </div>
            {isExamMenuOpen && (
              <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
                <li>
                  <div className={`nav-item ${activeTab === 'final_exam_docs' ? 'active' : ''}`} onClick={() => setActiveTab('final_exam_docs')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Examination Docs
                  </div>
                </li>
                <li>
                  <div className={`nav-item ${activeTab === 'exam_scripts' ? 'active' : ''}`} onClick={() => setActiveTab('exam_scripts')} style={{ paddingLeft: '42px', fontSize: '0.78rem', minHeight: '34px', opacity: 0.85 }}>
                    <span className="nav-icon" style={{ fontSize: '0.8rem' }}>↳</span> Examination Scripts
                  </div>
                </li>
              </ul>
            )}
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'final_result' ? 'active' : ''}`} onClick={() => setActiveTab('final_result')}>
              <span className="nav-icon">📊</span> Final Result
            </div>
          </li>
          <li>
            <div className={`nav-item ${activeTab === 'misc_record' ? 'active' : ''}`} onClick={() => setActiveTab('misc_record')}>
              <span className="nav-icon">🗂️</span> Miscellaneous Record
            </div>
          </li>
          
        </ul>
      </aside>

      {/* Main Panel */}
      <main className={`main-content${sidebarCollapsed ? ' sidebar-collapsed' : ''}`}>
        {/* ── Row 1: Course Banner ── */}
        <div className="header-banner no-print">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarCollapsed(prev => !prev)}
            title={sidebarCollapsed ? 'Show sidebar' : 'Hide sidebar'}
          >
            {sidebarCollapsed ? '☰' : '✕'}
          </button>
          <div className="header-banner-info">
            <h1>{courseInfo?.course_code || 'ARCH 2240'} – {courseInfo?.course_name || 'COMPUTER ANIMATION'}</h1>
            <p>Lecturer: {courseInfo?.lecturer || 'RIZAL HUSIN'}  ·  Semester: {courseInfo?.semester || 'JUNE 2024'}</p>
          </div>
          <div className="header-banner-select">
            <label htmlFor="course-select">Active Course:</label>
            <select
              id="course-select"
              value={activeCourseId || ''}
              onChange={(e) => setActiveCourseId(Number(e.target.value))}
            >
              {courses.map(c => (
                <option key={c.id} value={c.id}>
                  {c.course_code} - {c.course_name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* ── Row 2: Action Toolbar ── */}
        <div className="header-toolbar no-print">
          <button className="btn btn-secondary" onClick={refreshAll}>🔄 Refresh</button>
          <button
            className="btn btn-secondary"
            onClick={() => setTheme(prev => prev === 'dark' ? 'light' : 'dark')}
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
          >
            {theme === 'dark' ? '☀️ Light' : '🌙 Dark'}
          </button>
          <button className="btn btn-secondary" onClick={() => window.print()} title="Print current tab view">
            {activeTab === 'dashboard' ? '🖨️ Print Cover' : '🖨️ Print'}
          </button>
          {activeTab === 'setup' && (
            <>
              <button
                className="btn btn-primary"
                onClick={handlePrintAll}
                disabled={isPrintingAll || isExportingHtml}
                title="Print all documents in sequence"
                style={{
                  background: isPrintingAll
                    ? 'linear-gradient(135deg, #4b4b8a, #6b4ba6)'
                    : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                  border: 'none',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  opacity: (isPrintingAll || isExportingHtml) ? 0.75 : 1,
                  cursor: (isPrintingAll || isExportingHtml) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isPrintingAll ? '⏳ Preparing...' : '🖨️ Print All'}
              </button>
              <button
                className="btn btn-primary"
                onClick={handleExportHtml}
                disabled={isPrintingAll || isExportingHtml}
                title="Export all documents as a single HTML file"
                style={{
                  background: isExportingHtml
                    ? 'linear-gradient(135deg, #166534, #14532d)'
                    : 'linear-gradient(135deg, #16a34a, #059669)',
                  border: 'none',
                  fontWeight: '700',
                  letterSpacing: '0.03em',
                  opacity: (isPrintingAll || isExportingHtml) ? 0.75 : 1,
                  cursor: (isPrintingAll || isExportingHtml) ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                {isExportingHtml ? '⏳ Exporting...' : '📥 Export HTML'}
              </button>
            </>
          )}
        </div>

        {renderContent()}

        {/* ── Copyright Footer ─────────────────────────────────────── */}
        <footer className="app-footer no-print">
          <span>Copyright &copy; Rizal Husin 2026</span>
          <span className="app-footer-sep">·</span>
          <a href="mailto:rizal.husin@klust.edu.my" className="app-footer-link">rizal.husin@klust.edu.my</a>
          <span className="app-footer-sep">·</span>
          <span>KLUST TF PORTAL v.1</span>
        </footer>
      </main>
    </div>

    {/* ============================================================
        PRINT ALL OVERLAY
        Sits as a SIBLING of .app-container (not inside it).
        During print-all mode: app-container is hidden, this is shown.
        ============================================================ */}
    <div
      ref={printAllRef}
      className="print-all-overlay"
      aria-hidden={!isPrintingAll}
      >
        {/* Print-All CSS: screen hides overlay; print shows it and hides app shell */}
        <style>{`
          .print-all-overlay {
            display: none !important;
          }
          @media print {
            body.print-all-mode .app-container {
              display: none !important;
            }
            body.print-all-mode .print-all-overlay {
              display: block !important;
              background: white;
              color: black;
            }
            .print-separator-section { page-break-after: always; break-after: page; background: white !important; color: black !important; padding: 0.5in 0.5in 0.3in 0.5in; }
            .print-all-section {
              page-break-after: always;
              break-after: page;
              background: white !important;
              color: black !important;
              padding: 0.5in 0.5in 0.3in 0.5in;
              box-sizing: border-box;
            }
            .print-all-section:last-child {
              page-break-after: auto;
              break-after: auto;
            }
            .print-all-section .view-card {
              padding: 0 !important;
              margin-bottom: 16px !important;
              border: none !important;
              box-shadow: none !important;
              background: white !important;
              color: black !important;
            }
            .print-all-section .no-print { display: none !important; }
            .print-all-section .only-print { display: block !important; }
            .print-all-section table {
              width: 100% !important;
              border-collapse: collapse !important;
              color: black !important;
              background: white !important;
            }
            .print-all-section th {
              background: #f3f4f6 !important;
              color: black !important;
              border: 1px solid #999 !important;
              padding: 5px 8px !important;
              font-size: 0.8rem !important;
              white-space: normal !important;
              word-break: break-word !important;
            }
            .print-all-section td {
              border: 1px solid #ccc !important;
              padding: 5px 8px !important;
              color: black !important;
              background: white !important;
            }
          }
        `}</style>

        {/* Document separator label */}
        <div style={{ display: 'none' }}>Print All: {courseInfo?.course_code}</div>

        {/* 0. Cover Page */}
        <div className="print-all-section">
          <Dashboard
            API_BASE={API_BASE}
            gradesData={gradesData}
            obeMetrics={obeMetrics}
            courseInfo={courseInfo}
          />
        </div>

        {/* 1. Final Result */}
        <PrintSeparator number={1} title={"Final Result"} />
        <div className="print-all-section">
          <FinalResultDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 2. Table of Specification */}
        <PrintSeparator number={2} title={"Table of Specification"} />
        <div className="print-all-section">
          <PrintHeader title="Table of Specification" courseInfo={courseInfo} programName={programName} />
          <AssessmentSetup
            assessments={assessments}
            optionalGroups={optionalGroups}
            clos={clos}
            plos={plos}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            plannedAssessments={plannedAssessments}
            courseInfo={courseInfo}
          />
        </div>

        {/* 3. OBE Assessment */}
        <PrintSeparator number={3} title={"OBE Assessment"} />
        <div className="print-all-section">
          <PrintHeader title="OBE Assessment" courseInfo={courseInfo} programName={programName} />
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 4. Course Syllabus */}
        <PrintSeparator number={4} title={"Course Syllabus"} />
        <div className="print-all-section">
          <PrintHeader title="Syllabus Outline" courseInfo={courseInfo} programName={programName} />
          <SyllabusSetup
            clos={clos}
            plos={plos}
            cloPloMappings={cloPloMappings}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            courseInfo={courseInfo}
          />
        </div>

        {/* 5. Teaching Plan */}
        <PrintSeparator number={5} title={"Teaching Plan"} />
        <div className="print-all-section">
          <PrintHeader title="Teaching Plan" courseInfo={courseInfo} programName={programName} />
          <TeachingPlan
            reports={reports}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            courseInfo={courseInfo}
            students={students}
            clos={clos}
            plos={plos}
            plannedAssessments={plannedAssessments}
            cloPloMappings={cloPloMappings}
          />
        </div>

        {/* 6. Lecturer Timetable */}
        <PrintSeparator number={6} title={"Time-Table of Lecturer"} />
        <div className="print-all-section">
          <PrintHeader title="Lecturer Timetable" courseInfo={courseInfo} programName={programName} />
          <LecturerTimetable courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} hidePrintHeader={true} />
        </div>

        {/* 7. Student Monthly Attendance */}
        <PrintSeparator number={7} title={"Student Monthly Attendance"} />
        <div className="print-all-section">
          <PrintHeader title="Student Monthly Attendance" courseInfo={courseInfo} programName={programName} />
          <AttendanceRegistry
            students={students}
            attendance={attendance}
            onUpdateAttendance={() => {}}
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
          />
        </div>

        {/* 8. Report by Lecturer */}
        <PrintSeparator number={8} title={"Report by Lecturer"} />
        <div className="print-all-section">
          <PrintHeader title="Weekly Reports (KLUST F28)" courseInfo={courseInfo} programName={programName} />
          <LecturerReport
            courseInfo={courseInfo}
            reports={reports}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
          />
        </div>

        {/* 9. Teaching Materials */}
        <PrintSeparator number={9} title={"Teaching Materials"} />
        <div className="print-all-section">
          <PrintHeader title="Teaching Materials" courseInfo={courseInfo} programName={programName} />
          <TeachingMaterials
            courseInfo={courseInfo}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
          />
        </div>

        {/* 10. Moderated Final Exam */}
        <PrintSeparator number={10} title={"Moderated Final Exam"} />
        <div className="print-all-section">
          <FinalExamDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 11. Final Exam Scripts */}
        <PrintSeparator number={11} title={"Final Exam Scripts"} />
        <div className="print-all-section">
          <PrintHeader title="Examination Script Samples Portfolio" courseInfo={courseInfo} programName={programName} />
          <CoursePortfolio courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="exam" isPrintMode={true} />
        </div>

        {/* 12. Coursework Docs */}
        <PrintSeparator number={12} title={"Coursework Docs"} />
        <div className="print-all-section">
          <CourseworkDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 13. Coursework Samples */}
        <PrintSeparator number={13} title={"Samples of Student Coursework"} />
        <div className="print-all-section">
          <PrintHeader title="Coursework Student Samples Portfolio" courseInfo={courseInfo} programName={programName} />
          <CoursePortfolio courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="coursework" isPrintMode={true} />
        </div>

        {/* 14. Miscellaneous Records */}
        <PrintSeparator number={14} title={"Miscellaneous Records"} />
        <div className="print-all-section">
          <PrintHeader title="Miscellaneous Records" courseInfo={courseInfo} programName={programName} />
          <MiscDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} hidePrintHeader={true} />
        </div>
      </div>
    </>
    );
  }

export default App;
