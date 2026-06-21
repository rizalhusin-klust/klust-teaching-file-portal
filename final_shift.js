const fs = require('fs');

let c = fs.readFileSync('client/src/App.tsx', 'utf8');

// 1. Replace tabDefs
const newTabDefs = `
      const tabDefs = [
        { id: 'dashboard', icon: '📄', label: 'Cover Page' },
        { id: 'final_result', icon: '📄', label: '1.0 Final Result' },
        { id: 'assessments', icon: '📄', label: '2.1 Table of Specification' },
        { id: 'clo', icon: '📄', label: '2.2 CLO Analysis' },
        { id: 'plo', icon: '📄', label: '2.3 PLO Analysis' },
        { id: 'student_clo', icon: '📄', label: '2.4 Student CLO' },
        { id: 'student_plo', icon: '📄', label: '2.5 Student PLO' },
        { id: 'cqi', icon: '📄', label: '2.6 CQI Report' },
        { id: 'syllabus', icon: '📄', label: '3. Course Syllabus' },
        { id: 'teaching_plan', icon: '📄', label: '4. Teaching Plan' },
        { id: 'time_table', icon: '📄', label: '5. Time-Table of Lecturer' },
        { id: 'attendance', icon: '📄', label: '6. Student Monthly Attendance' },
        { id: 'reports', icon: '📄', label: '7. Report by Lecturer' },
        { id: 'teaching_materials', icon: '📄', label: '8. Teaching Materials' },
        { id: 'final_exam_docs', icon: '📄', label: '9. Examination Docs' },
        { id: 'exam_scripts', icon: '📄', label: '10. Examination Scripts' },
        { id: 'coursework_docs', icon: '📄', label: '11. Coursework Docs' },
        { id: 'coursework_samples', icon: '📄', label: '12. Coursework Samples' },
        { id: 'misc_record', icon: '📄', label: '13. Miscellaneous Records' }
      ];`;

c = c.replace(/const tabDefs = \[\s*\{[\s\S]*?\}\s*\];/, newTabDefs.trim());

// 2. Replace print-all-overlay sections
const newPrintAllOverlay = `
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

        {/* 1.0 Final Result */}
        <PrintSeparator number={"1.0"} title={"Final Result"} />
        <div className="print-all-section">
          <FinalResultDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 2.1 Table of Specification */}
        <PrintSeparator number={"2.1"} title={"Table of Specification"} />
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

        {/* 2.2 CLO Analysis */}
        <PrintSeparator number={"2.2"} title={"CLO Analysis"} />
        <div className="print-all-section">
          <PrintHeader title="CLO Analysis" courseInfo={courseInfo} programName={programName} />
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            printSection="clo"
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 2.3 PLO Analysis */}
        <PrintSeparator number={"2.3"} title={"PLO Analysis"} />
        <div className="print-all-section">
          <PrintHeader title="PLO Analysis" courseInfo={courseInfo} programName={programName} />
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            printSection="plo"
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 2.4 Student CLO */}
        <PrintSeparator number={"2.4"} title={"Student CLO Breakdown"} />
        <div className="print-all-section">
          <PrintHeader title="Student CLO Breakdown" courseInfo={courseInfo} programName={programName} />
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            printSection="student-clo"
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 2.5 Student PLO */}
        <PrintSeparator number={"2.5"} title={"Student PLO Breakdown"} />
        <div className="print-all-section">
          <PrintHeader title="Student PLO Breakdown" courseInfo={courseInfo} programName={programName} />
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            printSection="student-plo"
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 2.6 CQI Report */}
        <PrintSeparator number={"2.6"} title={"CQI Report"} />
        <div className="print-all-section">
          <ObeDashboard
            assessments={assessments}
            optionalGroups={optionalGroups}
            obeMetrics={obeMetrics}
            gradesData={gradesData}
            isPrintMode={true}
            printSection="cqi"
            courseInfo={courseInfo}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
            onRefresh={() => {}}
          />
        </div>

        {/* 3. Course Syllabus */}
        <PrintSeparator number={3} title={"Course Syllabus"} />
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

        {/* 4. Teaching Plan */}
        <PrintSeparator number={4} title={"Teaching Plan"} />
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

        {/* 5. Lecturer Timetable */}
        <PrintSeparator number={5} title={"Time-Table of Lecturer"} />
        <div className="print-all-section">
          <PrintHeader title="Lecturer Timetable" courseInfo={courseInfo} programName={programName} />
          <LecturerTimetable courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} hidePrintHeader={true} />
        </div>

        {/* 6. Student Monthly Attendance */}
        <PrintSeparator number={6} title={"Student Monthly Attendance"} />
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

        {/* 7. Report by Lecturer */}
        <PrintSeparator number={7} title={"Report by Lecturer"} />
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

        {/* 8. Teaching Materials */}
        <PrintSeparator number={8} title={"Teaching Materials"} />
        <div className="print-all-section">
          <PrintHeader title="Teaching Materials" courseInfo={courseInfo} programName={programName} />
          <TeachingMaterials
            courseInfo={courseInfo}
            onRefresh={() => {}}
            API_BASE={API_BASE}
            activeCourseId={activeCourseId}
          />
        </div>

        {/* 9. Moderated Final Exam */}
        <PrintSeparator number={9} title={"Moderated Final Exam"} />
        <div className="print-all-section">
          <FinalExamDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 10. Final Exam Scripts */}
        <PrintSeparator number={10} title={"Final Exam Scripts"} />
        <div className="print-all-section">
          <PrintHeader title="Examination Script Samples Portfolio" courseInfo={courseInfo} programName={programName} />
          <CoursePortfolio courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="exam" isPrintMode={true} />
        </div>

        {/* 11. Coursework Docs */}
        <PrintSeparator number={11} title={"Coursework Docs"} />
        <div className="print-all-section">
          <CourseworkDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} />
        </div>

        {/* 12. Coursework Samples */}
        <PrintSeparator number={12} title={"Samples of Student Coursework"} />
        <div className="print-all-section">
          <PrintHeader title="Coursework Student Samples Portfolio" courseInfo={courseInfo} programName={programName} />
          <CoursePortfolio courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} students={students} printMode="coursework" isPrintMode={true} />
        </div>

        {/* 13. Miscellaneous Records */}
        <PrintSeparator number={13} title={"Miscellaneous Records"} />
        <div className="print-all-section">
          <PrintHeader title="Miscellaneous Records" courseInfo={courseInfo} programName={programName} />
          <MiscDocs courseInfo={courseInfo} onRefresh={() => {}} API_BASE={API_BASE} activeCourseId={activeCourseId} programName={programName} hidePrintHeader={true} />
        </div>
`;

c = c.replace(/\{\/\* Document separator label \*\/\}[\s\S]*?(?=<\/div>\s*<\/React.Fragment>|<\/div>\s*<\/>)/, newPrintAllOverlay);

fs.writeFileSync('client/src/App.tsx', c, 'utf8');
