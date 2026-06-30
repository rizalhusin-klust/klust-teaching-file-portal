import type { CourseInfo } from '../App';

type PrintHeaderProps = {
  title: string;
  courseInfo: CourseInfo | null;
  programName?: string;
  centerAlign?: boolean;
  hideMetadata?: boolean;
};

export default function PrintHeader({
  title,
  courseInfo,
  programName = 'Bachelor of Science (Architectural Studies)',
  centerAlign = false,
  hideMetadata = false
}: PrintHeaderProps) {
  return (
    <div className="only-print teaching-file-cover-container" style={{ maxWidth: '100%', margin: '0', padding: '0 0 1rem 0', borderBottom: '2px solid #1e3a8a', marginBottom: '1.25rem', background: '#ffffff', color: '#000000' }}>
      {centerAlign ? (
        /* Lecturer Report Centered Column Layout (Logo centered above titles) */
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '15px', marginBottom: '1.25rem', textAlign: 'center' }}>
          <img
            src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png"
            alt="KLUST Logo"
            style={{ width: '95px', height: 'auto', display: 'block', flexShrink: 0, marginBottom: '0.25rem' }}
          />
          <div style={{ textAlign: 'center' }}>
            <h1 className="cover-title" style={{ textAlign: 'center', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: '700', margin: '0 0 0.25rem 0', lineHeight: '1.2' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>KUALA LUMPUR UNIVERSITY</span>{' '}
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>OF SCIENCE AND TECHNOLOGY</span>
            </h1>
            <div className="cover-subtitle" style={{ textAlign: 'center', fontFamily: '"Segoe UI Light", "Segoe UI", sans-serif', fontWeight: '300', fontSize: '20px', whiteSpace: 'nowrap', color: '#1e3a8a', margin: '0.4rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </div>
          </div>
        </div>
      ) : (
        /* Standard Row Layout (Logo on the far right, text on the left) */
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '20px', marginBottom: '1.25rem' }}>
          <div style={{ textAlign: 'left' }}>
            <h1 className="cover-title" style={{ textAlign: 'left', fontSize: '1.4rem', color: '#1e3a8a', fontWeight: '700', margin: '0 0 0.25rem 0', lineHeight: '1.2' }}>
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>KUALA LUMPUR UNIVERSITY</span>{' '}
              <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>OF SCIENCE AND TECHNOLOGY</span>
            </h1>
            <div className="cover-subtitle" style={{ textAlign: 'left', fontFamily: '"Segoe UI Light", "Segoe UI", sans-serif', fontWeight: '300', fontSize: '20px', whiteSpace: 'nowrap', color: '#1e3a8a', margin: '0.4rem 0 0 0', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
              {title}
            </div>
          </div>
          <img
            src="https://raw.githubusercontent.com/rizalhusin-klust/klust-images/main/KLUST%20%20logo%20only.png"
            alt="KLUST Logo"
            style={{ width: '95px', height: 'auto', display: 'block', flexShrink: 0 }}
          />
        </div>
      )}
      {!hideMetadata && (
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
      )}
    </div>
  );
}
