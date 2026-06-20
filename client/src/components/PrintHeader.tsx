import type { CourseInfo } from '../App';

type PrintHeaderProps = {
  title: string;
  courseInfo: CourseInfo | null;
  programName?: string;
};

export default function PrintHeader({ title, courseInfo, programName = 'Bachelor of Science (Architectural Studies)' }: PrintHeaderProps) {
  return (
    <div className="only-print teaching-file-cover-container" style={{ maxWidth: '100%', margin: '0', padding: '0 0 1rem 0', borderBottom: '2px solid #1e3a8a', marginBottom: '1.25rem', background: '#ffffff', color: '#000000' }}>
      <div style={{ textAlign: 'left', marginBottom: '1.25rem' }}>
        <h1 className="cover-title" style={{ textAlign: 'left', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: '700', margin: '0 0 0.25rem 0' }}>
          KUALA LUMPUR UNIVERSITY OF<br />SCIENCE AND TECHNOLOGY
        </h1>
        <div className="cover-subtitle" style={{ textAlign: 'left', fontSize: '1.8rem', fontWeight: '700', color: '#1e3a8a', margin: '0.6rem 0 0.4rem 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          {title}
        </div>
      </div>
      <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '1.25rem', fontSize: '0.875rem', fontWeight: 'bold' }}>
        <tbody>
          <tr>
            <td style={{ width: '22%', fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Programme</td>
            <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{programName.toUpperCase()}</td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Course</td>
            <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>
              {courseInfo?.course_code?.toUpperCase()} {courseInfo?.course_name?.toUpperCase()}
            </td>
          </tr>
          <tr>
            <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', backgroundColor: '#f8fafc', color: '#1e3a8a', textTransform: 'uppercase', textAlign: 'left' }}>Semester</td>
            <td style={{ fontWeight: 'bold', padding: '4px 8px', border: '1px solid #cbd5e1', color: '#334155', textAlign: 'left' }}>{courseInfo?.semester?.toUpperCase()}</td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
