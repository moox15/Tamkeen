import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { student } from '../../services/api';
import { BookOpen, Calendar, CheckCircle, TrendingUp, Package, Clock, FileText } from 'lucide-react';

export default function StudentDashboard() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => { student.getDashboard().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);
  
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return <div className="page-error">فشل تحميل البيانات.</div>;
  
  const { user, profile, subjects, stats, activeSub, upcomingLessons } = data;
  
  return (
    <div className="dashboard-page student-dashboard">
      {/* Welcome */}
      <div className="welcome-card">
        <div className="welcome-text">
          <h1 className="welcome-title">أهلاً {user.full_name.split(' ')[0]} 👋</h1>
          <p className="welcome-subtitle">{profile?.grade} — المواد: {subjects.map(s => s.name).join('، ') || '—'}</p>
        </div>
      </div>
      
      {/* Stats Grid */}
      <div className="student-stats-grid">
        <div className="student-stat-card stat-blue">
          <BookOpen size={24} />
          <div className="stat-info">
            <span className="stat-number">{stats.completedLessons}</span>
            <span className="stat-label">حصص مكتملة</span>
          </div>
        </div>
        <div className="student-stat-card stat-green">
          <Package size={24} />
          <div className="stat-info">
            <span className="stat-number">{stats.remainingLessons}</span>
            <span className="stat-label">حصص متبقية</span>
          </div>
        </div>
        <div className="student-stat-card stat-gold">
          <TrendingUp size={24} />
          <div className="stat-info">
            <span className="stat-number">{stats.attendanceRate}%</span>
            <span className="stat-label">نسبة الحضور</span>
          </div>
        </div>
        <div className="student-stat-card stat-purple">
          <FileText size={24} />
          <div className="stat-info">
            <span className="stat-number">{stats.avgGrade}%</span>
            <span className="stat-label">المعدل</span>
          </div>
        </div>
      </div>
      
      {/* Subscription Progress */}
      {activeSub && (
        <div className="sub-progress-card">
          <div className="sub-progress-header">
            <h3>{activeSub.package_name || 'الاشتراك الحالي'}</h3>
            <span className={`status-badge status-${activeSub.status}`}>{activeSub.status === 'active' ? 'نشط' : activeSub.status}</span>
          </div>
          <div className="progress-bar-container">
            <div className="progress-bar-bg">
              <div className="progress-bar-fill" style={{ width: `${(activeSub.completed_lessons / activeSub.total_lessons) * 100}%` }} />
            </div>
            <div className="progress-text">
              <span>{activeSub.completed_lessons} / {activeSub.total_lessons} حصة مكتملة</span>
              <span>{activeSub.remaining_lessons} متبقية</span>
            </div>
          </div>
        </div>
      )}
      
      {/* Homework stats */}
      <div className="hw-stats-card">
        <h3 className="card-title">الواجبات</h3>
        <div className="hw-stats-row">
          <div className="hw-stat"><CheckCircle size={18} className="text-green" /><span>{stats.completedHomework} مكتمل</span></div>
          <div className="hw-stat"><Clock size={18} className="text-gold" /><span>{stats.totalHomework - stats.completedHomework} معلق</span></div>
          <div className="hw-stat"><TrendingUp size={18} className="text-blue" /><span>الإنجاز: {stats.hwRate}%</span></div>
        </div>
      </div>
      
      {/* Upcoming Lessons */}
      <div className="upcoming-section">
        <div className="section-header">
          <h3 className="card-title">الحصص القادمة</h3>
          <Link to="/student/schedule" className="section-link">عرض الجدول</Link>
        </div>
        
        {upcomingLessons.length === 0 ? (
          <p className="text-muted">لا توجد حصص قادمة.</p>
        ) : (
          <div className="upcoming-lessons-list">
            {upcomingLessons.map(l => (
              <div key={l.uuid} className="upcoming-lesson-card">
                <div className="lesson-date-badge">
                  <span className="date-day">{new Date(l.date).getDate()}</span>
                  <span className="date-month">{new Date(l.date).toLocaleDateString('ar-SA', { month: 'short' })}</span>
                </div>
                <div className="lesson-info">
                  <span className="lesson-subject">{l.subject_name}</span>
                  <span className="lesson-teacher">المعلم: {l.teacher_name || '—'}</span>
                  <span className="lesson-time" dir="ltr">{l.start_time} - {l.end_time}</span>
                </div>
                {l.meeting_link && (
                  <a href={l.meeting_link} target="_blank" rel="noopener noreferrer" className="join-btn">
                    انضم للحصة
                  </a>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
