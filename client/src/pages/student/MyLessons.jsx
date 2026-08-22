import { useState, useEffect } from 'react';
import { student } from '../../services/api';

export default function MyLessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { student.getLessons().then(setLessons).catch(console.error).finally(() => setLoading(false)); }, []);
  
  return (
    <div className="dashboard-page">
      <div className="page-header"><h1 className="page-title">دروسي</h1><p className="page-subtitle">{lessons.length} حصة</p></div>
      {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
        <div className="lessons-list">
          {lessons.length === 0 ? <p className="text-muted" style={{textAlign:'center',padding:'3rem'}}>لا توجد حصص بعد.</p> :
          lessons.map(l => (
            <div key={l.uuid} className={`lesson-card-student lesson-${l.status}`}>
              <div className="lesson-card-date">
                <span className="lcd-day">{new Date(l.date).getDate()}</span>
                <span className="lcd-month">{new Date(l.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
              </div>
              <div className="lesson-card-body">
                <div className="lesson-card-top">
                  <h3>{l.subject_name || 'حصة'}</h3>
                  <span className={`status-badge status-${l.status}`}>{{scheduled:'مجدولة',completed:'مكتملة',cancelled:'ملغية',rescheduled:'مؤجلة'}[l.status]}</span>
                </div>
                <div className="lesson-card-meta">
                  <span>المعلم: {l.teacher_name || '—'}</span>
                  <span dir="ltr">{l.start_time} - {l.end_time}</span>
                  <span className={`attendance-${l.attendance}`}>{{present:'حاضر',absent:'غائب',excused:'معتذر',pending:'—'}[l.attendance]}</span>
                </div>
                {l.meeting_link && l.status === 'scheduled' && (
                  <a href={l.meeting_link} target="_blank" rel="noopener noreferrer" className="join-btn-sm">انضم للحصة</a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
