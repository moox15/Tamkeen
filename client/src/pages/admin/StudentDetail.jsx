import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { admin } from '../../services/api';
import { ArrowRight, BookOpen, Calendar, FileText, CreditCard, TrendingUp, Edit, MessageSquare, User } from 'lucide-react';

const tabs = [
  { id: 'overview', label: 'نظرة عامة', icon: User },
  { id: 'lessons', label: 'الحصص', icon: BookOpen },
  { id: 'homework', label: 'الواجبات', icon: FileText },
  { id: 'payments', label: 'المدفوعات', icon: CreditCard },
  { id: 'notes', label: 'الملاحظات', icon: MessageSquare },
];

export default function StudentDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const [noteText, setNoteText] = useState('');
  
  useEffect(() => {
    admin.getStudent(uuid).then(setData).catch(() => navigate('/admin/students')).finally(() => setLoading(false));
  }, [uuid]);
  
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return null;
  
  const { user, profile, subjects, subscriptions, payments, lessons, homework, grades, notes, stats } = data;
  
  const addNote = async () => {
    if (!noteText.trim()) return;
    try {
      await admin.createStudentNote(uuid, noteText);
      setNoteText('');
      const refreshed = await admin.getStudent(uuid);
      setData(refreshed);
    } catch (err) { alert(err.message); }
  };
  
  return (
    <div className="dashboard-page">
      <button className="back-button" onClick={() => navigate('/admin/students')}>
        <ArrowRight size={18} /> العودة للطلاب
      </button>
      
      {/* Student header */}
      <div className="student-header">
        <div className="student-header-info">
          <div className="student-avatar-lg">{user.full_name.charAt(0)}</div>
          <div>
            <h1 className="page-title">{user.full_name}</h1>
            <p className="page-subtitle">{profile?.grade} — {getStageLabel(profile?.academic_stage)}</p>
            <span className={`status-badge ${user.is_active ? 'status-active' : 'status-inactive'}`}>
              {user.is_active ? 'نشط' : 'غير نشط'}
            </span>
          </div>
        </div>
        
        {/* Quick stats */}
        <div className="student-quick-stats">
          <div className="quick-stat">
            <span className="quick-stat-value">{stats.activeSub ? `${stats.activeSub.remaining_lessons}/${stats.activeSub.total_lessons}` : '—'}</span>
            <span className="quick-stat-label">الحصص المتبقية</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value">{stats.attendanceRate}%</span>
            <span className="quick-stat-label">الحضور</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value">{stats.hwRate}%</span>
            <span className="quick-stat-label">الواجبات</span>
          </div>
          <div className="quick-stat">
            <span className="quick-stat-value">{stats.avgGrade}%</span>
            <span className="quick-stat-label">المعدل</span>
          </div>
        </div>
      </div>
      
      {/* Tabs */}
      <div className="tabs-bar">
        {tabs.map(tab => (
          <button key={tab.id} className={`tab-btn ${activeTab === tab.id ? 'tab-active' : ''}`}
            onClick={() => setActiveTab(tab.id)}>
            <tab.icon size={16} />
            <span>{tab.label}</span>
          </button>
        ))}
      </div>
      
      {/* Tab content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <div className="overview-grid">
            <div className="info-card">
              <h3 className="info-card-title">المعلومات الشخصية</h3>
              <div className="info-rows">
                <div className="info-row"><span className="info-label">البريد:</span><span dir="ltr">{user.email}</span></div>
                <div className="info-row"><span className="info-label">الهاتف:</span><span dir="ltr">{user.phone || '—'}</span></div>
                <div className="info-row"><span className="info-label">تاريخ التسجيل:</span><span>{profile?.enrollment_date}</span></div>
              </div>
            </div>
            <div className="info-card">
              <h3 className="info-card-title">المواد والمعلمون</h3>
              {subjects.length === 0 ? <p className="text-muted">لم يتم تعيين مواد بعد.</p> : (
                <div className="info-rows">
                  {subjects.map(s => (
                    <div key={s.id} className="info-row">
                      <span className="info-label">{s.subject_name}</span>
                      <span>{s.teacher_name || '—'}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div className="info-card">
              <h3 className="info-card-title">الاشتراكات</h3>
              {subscriptions.length === 0 ? <p className="text-muted">لا توجد اشتراكات.</p> : (
                <div className="info-rows">
                  {subscriptions.map(s => (
                    <div key={s.id} className="info-row">
                      <span>{s.package_name || `${s.total_lessons} حصة`}</span>
                      <span className={`status-badge status-${s.status}`}>{getSubStatusLabel(s.status)}</span>
                      <span>{s.total_lessons - s.completed_lessons} متبقي</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
        
        {activeTab === 'lessons' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>التاريخ</th><th>المادة</th><th>المعلم</th><th>الوقت</th><th>الحالة</th><th>الحضور</th></tr></thead>
              <tbody>
                {lessons.map(l => (
                  <tr key={l.id}>
                    <td dir="ltr">{l.date}</td><td>{l.subject_name || '—'}</td><td>{l.teacher_name || '—'}</td>
                    <td dir="ltr">{l.start_time} - {l.end_time}</td>
                    <td><span className={`status-badge status-${l.status}`}>{getStatusLabel(l.status)}</span></td>
                    <td><span className={`status-badge attendance-${l.attendance}`}>{getAttendanceLabel(l.attendance)}</span></td>
                  </tr>
                ))}
                {lessons.length === 0 && <tr><td colSpan={6} className="td-empty">لا توجد حصص.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'homework' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>الواجب</th><th>الحصة</th><th>الحالة</th><th>الدرجة</th></tr></thead>
              <tbody>
                {homework.map(h => (
                  <tr key={h.id}>
                    <td>{h.title}</td><td>{h.lesson_title || '—'}</td>
                    <td><span className={`status-badge status-${h.submission_status || 'pending'}`}>{getHwStatusLabel(h.submission_status)}</span></td>
                    <td>{h.total_score != null ? `${h.total_score}/${h.max_grade}` : '—'}</td>
                  </tr>
                ))}
                {homework.length === 0 && <tr><td colSpan={4} className="td-empty">لا توجد واجبات.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'payments' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead><tr><th>التاريخ</th><th>المبلغ المطلوب</th><th>المدفوع</th><th>المتبقي</th><th>الطريقة</th><th>الحالة</th></tr></thead>
              <tbody>
                {payments.map(p => (
                  <tr key={p.id}>
                    <td dir="ltr">{p.payment_date || p.created_at?.split('T')[0] || '—'}</td>
                    <td>{p.amount_due} ر.س</td><td>{p.amount_paid} ر.س</td>
                    <td>{(p.amount_due - p.amount_paid).toFixed(2)} ر.س</td>
                    <td>{getPaymentMethodLabel(p.payment_method)}</td>
                    <td><span className={`status-badge status-${p.status}`}>{getPaymentStatusLabel(p.status)}</span></td>
                  </tr>
                ))}
                {payments.length === 0 && <tr><td colSpan={6} className="td-empty">لا توجد مدفوعات.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        
        {activeTab === 'notes' && (
          <div className="notes-section">
            <div className="note-input-group">
              <textarea className="form-input form-textarea" placeholder="أضف ملاحظة..." value={noteText} onChange={e => setNoteText(e.target.value)} />
              <button className="btn-primary-sm" onClick={addNote}>إضافة ملاحظة</button>
            </div>
            <div className="notes-list">
              {notes.map(n => (
                <div key={n.id} className="note-card">
                  <div className="note-meta">
                    <span className="note-author">{n.admin_name}</span>
                    <span className="note-date">{new Date(n.created_at).toLocaleDateString('ar-SA')}</span>
                  </div>
                  <p className="note-content">{n.content}</p>
                </div>
              ))}
              {notes.length === 0 && <p className="text-muted">لا توجد ملاحظات.</p>}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function getStageLabel(s) { return { primary: 'ابتدائي', middle: 'متوسط', high: 'ثانوي' }[s] || s || ''; }
function getStatusLabel(s) { return { scheduled: 'مجدولة', completed: 'مكتملة', cancelled: 'ملغية', rescheduled: 'مؤجلة' }[s] || s; }
function getAttendanceLabel(a) { return { present: 'حاضر', absent: 'غائب', excused: 'معتذر', pending: 'معلق' }[a] || a; }
function getSubStatusLabel(s) { return { active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', completed: 'مكتمل', pending_payment: 'بانتظار الدفع' }[s] || s; }
function getHwStatusLabel(s) { return { submitted: 'تم التسليم', graded: 'مصحح', pending: 'لم يسلم' }[s] || 'لم يسلم'; }
function getPaymentStatusLabel(s) { return { paid: 'مدفوع', partially_paid: 'دفع جزئي', pending: 'معلق', refunded: 'مسترد', cancelled: 'ملغي' }[s] || s; }
function getPaymentMethodLabel(m) { return { bank_transfer: 'تحويل بنكي', cash: 'نقدي', online: 'إلكتروني', other: 'أخرى' }[m] || '—'; }
