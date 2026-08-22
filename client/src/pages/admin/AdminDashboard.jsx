import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { admin } from '../../services/api';
import {
  Users, BookOpen, Calendar, CreditCard, Package, TrendingUp,
  CheckCircle, Clock, AlertTriangle, UserCheck, UserX, FileText
} from 'lucide-react';

function KPICard({ icon: Icon, label, value, sublabel, color = 'blue', trend }) {
  return (
    <div className={`kpi-card kpi-${color}`}>
      <div className="kpi-icon-wrap">
        <Icon size={22} />
      </div>
      <div className="kpi-content">
        <span className="kpi-value">{value}</span>
        <span className="kpi-label">{label}</span>
        {sublabel && <span className="kpi-sublabel">{sublabel}</span>}
      </div>
    </div>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    admin.getDashboard()
      .then(data => setStats(data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false));
  }, []);
  
  if (loading) {
    return <div className="page-loading"><div className="loading-spinner" /><p>جاري التحميل...</p></div>;
  }
  
  if (!stats) {
    return <div className="page-error">فشل تحميل البيانات.</div>;
  }
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">لوحة التحكم</h1>
        <p className="page-subtitle">نظرة عامة على الأكاديمية</p>
      </div>
      
      {/* KPI Grid */}
      <div className="kpi-grid">
        <KPICard icon={Users} label="إجمالي الطلاب" value={stats.totalStudents} color="blue" />
        <KPICard icon={UserCheck} label="طلاب نشطون" value={stats.activeStudents} color="green" />
        <KPICard icon={UserX} label="طلاب غير نشطين" value={stats.inactiveStudents} color="red" />
        <KPICard icon={Calendar} label="حصص اليوم" value={stats.todayLessons} color="gold" />
        <KPICard icon={Clock} label="حصص قادمة" value={stats.upcomingLessons} color="blue" />
        <KPICard icon={CheckCircle} label="حصص مكتملة" value={stats.completedLessons} color="green" />
        <KPICard icon={TrendingUp} label="نسبة الحضور" value={`${stats.attendanceRate}%`} color="blue" />
        <KPICard icon={Package} label="اشتراكات نشطة" value={stats.activeSubscriptions} color="green" />
        <KPICard icon={AlertTriangle} label="اشتراكات تنتهي قريباً" value={stats.expiringSubscriptions} color="gold" />
        <KPICard icon={CreditCard} label="إجمالي المدفوعات" value={`${stats.totalPayments.toLocaleString()} ر.س`} color="green" />
        <KPICard icon={CreditCard} label="مدفوعات معلقة" value={stats.pendingPayments} color="gold" />
        <KPICard icon={FileText} label="واجبات مصححة" value={stats.gradedHomework} sublabel={`من ${stats.submittedHomework} تسليم`} color="blue" />
      </div>
      
      {/* Recent Lessons */}
      <div className="dashboard-section">
        <div className="section-header">
          <h2 className="section-title">آخر الحصص</h2>
          <Link to="/admin/lessons" className="section-link">عرض الكل</Link>
        </div>
        
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>المادة</th>
                <th>المعلم</th>
                <th>التاريخ</th>
                <th>الوقت</th>
                <th>الحالة</th>
                <th>الحضور</th>
              </tr>
            </thead>
            <tbody>
              {stats.recentLessons?.map(lesson => (
                <tr key={lesson.id}>
                  <td className="td-name">{lesson.student_name || '—'}</td>
                  <td>{lesson.subject_name || '—'}</td>
                  <td>{lesson.teacher_name || '—'}</td>
                  <td dir="ltr">{lesson.date}</td>
                  <td dir="ltr">{lesson.start_time}</td>
                  <td><span className={`status-badge status-${lesson.status}`}>{getStatusLabel(lesson.status)}</span></td>
                  <td><span className={`status-badge attendance-${lesson.attendance}`}>{getAttendanceLabel(lesson.attendance)}</span></td>
                </tr>
              ))}
              {(!stats.recentLessons || stats.recentLessons.length === 0) && (
                <tr><td colSpan={7} className="td-empty">لا توجد حصص بعد.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getStatusLabel(status) {
  const labels = { scheduled: 'مجدولة', completed: 'مكتملة', cancelled: 'ملغية', rescheduled: 'مؤجلة' };
  return labels[status] || status;
}

function getAttendanceLabel(attendance) {
  const labels = { present: 'حاضر', absent: 'غائب', excused: 'معتذر', pending: 'معلق' };
  return labels[attendance] || attendance;
}
