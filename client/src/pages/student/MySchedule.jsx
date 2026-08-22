import { useState, useEffect } from 'react';
import { student } from '../../services/api';

export default function MySchedule() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  useEffect(() => { student.getSchedule().then(setLessons).catch(console.error).finally(() => setLoading(false)); }, []);
  
  const weekDays = getWeekDays(currentDate);
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">جدولي</h1>
        <div className="nav-arrows">
          <button className="nav-arrow" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() - 7); setCurrentDate(d); }}>→</button>
          <span className="nav-date">{currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
          <button className="nav-arrow" onClick={() => { const d = new Date(currentDate); d.setDate(d.getDate() + 7); setCurrentDate(d); }}>←</button>
        </div>
      </div>
      
      {loading ? <div className="page-loading"><div className="loading-spinner" /></div> : (
        <div className="schedule-grid student-schedule">
          {weekDays.map(day => {
            const dateStr = day.toISOString().split('T')[0];
            const dayLessons = lessons.filter(l => l.date === dateStr);
            const isToday = dateStr === new Date().toISOString().split('T')[0];
            
            return (
              <div key={dateStr} className={`schedule-day ${isToday ? 'schedule-today' : ''}`}>
                <div className="schedule-day-header">
                  <span className="day-name">{dayNames[day.getDay()]}</span>
                  <span className="day-date">{day.getDate()}</span>
                </div>
                <div className="schedule-day-lessons">
                  {dayLessons.length === 0 ? <p className="no-lessons">لا توجد حصص</p> :
                  dayLessons.map(l => (
                    <div key={l.uuid} className={`schedule-lesson-card schedule-${l.status}`}>
                      <div className="lesson-time" dir="ltr">{l.start_time} - {l.end_time}</div>
                      <div className="lesson-subject">{l.subject_name}</div>
                      <div className="lesson-teacher">المعلم: {l.teacher_name}</div>
                      {l.meeting_link && l.status === 'scheduled' && (
                        <a href={l.meeting_link} target="_blank" rel="noopener noreferrer" className="join-btn-sm">انضم</a>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getWeekStart(d) { const day = d.getDay(); const diff = d.getDate() - day; return new Date(d.getFullYear(), d.getMonth(), diff); }
function getWeekDays(d) { const s = getWeekStart(d); return Array.from({ length: 7 }, (_, i) => { const day = new Date(s); day.setDate(s.getDate() + i); return day; }); }
