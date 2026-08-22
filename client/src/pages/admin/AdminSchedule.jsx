import { useState, useEffect } from 'react';
import { admin } from '../../services/api';

export default function AdminSchedule() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState('week');
  const [currentDate, setCurrentDate] = useState(new Date());
  
  useEffect(() => {
    const startDate = getWeekStart(currentDate);
    const endDate = new Date(startDate);
    endDate.setDate(endDate.getDate() + (view === 'day' ? 1 : view === 'week' ? 7 : 30));
    
    const params = {};
    if (view === 'day') params.date = formatDate(currentDate);
    
    admin.getLessons(params).then(setLessons).catch(() => {}).finally(() => setLoading(false));
  }, [currentDate, view]);
  
  const days = view === 'day' ? [currentDate] : view === 'week' ? getWeekDays(currentDate) : getMonthDays(currentDate);
  
  const dayNames = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
  
  const navigatePrev = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() - (view === 'day' ? 1 : view === 'week' ? 7 : 30));
    setCurrentDate(d);
  };
  
  const navigateNext = () => {
    const d = new Date(currentDate);
    d.setDate(d.getDate() + (view === 'day' ? 1 : view === 'week' ? 7 : 30));
    setCurrentDate(d);
  };
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">الجدول</h1>
        <div className="schedule-controls">
          <div className="view-tabs">
            <button className={`view-tab ${view === 'day' ? 'active' : ''}`} onClick={() => setView('day')}>يوم</button>
            <button className={`view-tab ${view === 'week' ? 'active' : ''}`} onClick={() => setView('week')}>أسبوع</button>
          </div>
          <div className="nav-arrows">
            <button className="nav-arrow" onClick={navigatePrev}>→</button>
            <span className="nav-date">{currentDate.toLocaleDateString('ar-SA', { month: 'long', year: 'numeric' })}</span>
            <button className="nav-arrow" onClick={navigateNext}>←</button>
          </div>
        </div>
      </div>
      
      <div className="schedule-grid">
        {(view === 'week' ? getWeekDays(currentDate) : [currentDate]).map(day => {
          const dateStr = formatDate(day);
          const dayLessons = lessons.filter(l => l.date === dateStr);
          
          return (
            <div key={dateStr} className="schedule-day">
              <div className="schedule-day-header">
                <span className="day-name">{dayNames[day.getDay()]}</span>
                <span className="day-date">{day.getDate()}</span>
              </div>
              <div className="schedule-day-lessons">
                {dayLessons.length === 0 ? (
                  <p className="no-lessons">لا توجد حصص</p>
                ) : dayLessons.map(l => (
                  <div key={l.uuid} className={`schedule-lesson-card schedule-${l.status}`}>
                    <div className="lesson-time" dir="ltr">{l.start_time} - {l.end_time}</div>
                    <div className="lesson-subject">{l.subject_name}</div>
                    <div className="lesson-student">{l.student_name}</div>
                    <div className="lesson-teacher">{l.teacher_name}</div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function formatDate(d) { return d.toISOString().split('T')[0]; }
function getWeekStart(d) { const day = d.getDay(); const diff = d.getDate() - day + (day === 0 ? -6 : 1); return new Date(d.getFullYear(), d.getMonth(), diff); }
function getWeekDays(d) { const start = getWeekStart(d); return Array.from({ length: 7 }, (_, i) => { const day = new Date(start); day.setDate(start.getDate() + i); return day; }); }
function getMonthDays(d) { const start = new Date(d.getFullYear(), d.getMonth(), 1); const end = new Date(d.getFullYear(), d.getMonth() + 1, 0); const days = []; for (let i = start.getDate(); i <= end.getDate(); i++) { days.push(new Date(d.getFullYear(), d.getMonth(), i)); } return days; }
