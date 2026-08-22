import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Plus, CheckCircle, XCircle, Clock, UserCheck } from 'lucide-react';

export default function Lessons() {
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [students, setStudents] = useState([]);
  const [subjects, setSubjects] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [dateFilter, setDateFilter] = useState('');
  const [form, setForm] = useState({ student_profile_id: '', subject_id: '', teacher_id: '', date: '', start_time: '', end_time: '', title: '', meeting_link: '', notes: '' });
  const [formError, setFormError] = useState('');
  
  const loadLessons = async () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    if (dateFilter) params.date = dateFilter;
    try {
      const data = await admin.getLessons(params);
      setLessons(data);
    } catch (err) { console.error(err); }
    setLoading(false);
  };
  
  useEffect(() => { loadLessons(); }, [statusFilter, dateFilter]);
  useEffect(() => {
    admin.getStudents({ limit: 200 }).then(d => setStudents(d.students));
    admin.getSubjects().then(setSubjects);
    admin.getTeachers().then(setTeachers);
  }, []);
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await admin.createLesson({
        ...form,
        student_profile_id: parseInt(form.student_profile_id),
        subject_id: parseInt(form.subject_id),
        teacher_id: form.teacher_id ? parseInt(form.teacher_id) : undefined,
      });
      setShowCreate(false);
      setForm({ student_profile_id: '', subject_id: '', teacher_id: '', date: '', start_time: '', end_time: '', title: '', meeting_link: '', notes: '' });
      loadLessons();
    } catch (err) { setFormError(err.message); }
  };
  
  const updateStatus = async (uuid, status) => {
    try {
      await admin.updateLessonStatus(uuid, status);
      loadLessons();
    } catch (err) { alert(err.message); }
  };
  
  const updateAttendance = async (uuid, attendance) => {
    try {
      await admin.updateAttendance(uuid, attendance);
      loadLessons();
    } catch (err) { alert(err.message); }
  };
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الحصص</h1>
          <p className="page-subtitle">{lessons.length} حصة</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowCreate(true)}>
          <Plus size={18} /><span>إضافة حصة</span>
        </button>
      </div>
      
      <div className="filters-bar">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">جميع الحالات</option>
          <option value="scheduled">مجدولة</option>
          <option value="completed">مكتملة</option>
          <option value="cancelled">ملغية</option>
          <option value="rescheduled">مؤجلة</option>
        </select>
        <input type="date" value={dateFilter} onChange={e => setDateFilter(e.target.value)} className="filter-select" />
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr><th>الطالب</th><th>المادة</th><th>المعلم</th><th>التاريخ</th><th>الوقت</th><th>الحالة</th><th>الحضور</th><th>الإجراءات</th></tr>
          </thead>
          <tbody>
            {loading ? <tr><td colSpan={8} className="td-empty">جاري التحميل...</td></tr> :
            lessons.length === 0 ? <tr><td colSpan={8} className="td-empty">لا توجد حصص.</td></tr> :
            lessons.map(l => (
              <tr key={l.uuid}>
                <td className="td-name">{l.student_name || '—'}</td>
                <td>{l.subject_name || '—'}</td>
                <td>{l.teacher_name || '—'}</td>
                <td dir="ltr">{l.date}</td>
                <td dir="ltr">{l.start_time}-{l.end_time}</td>
                <td>
                  <select value={l.status} onChange={e => updateStatus(l.uuid, e.target.value)} className="inline-select">
                    <option value="scheduled">مجدولة</option>
                    <option value="completed">مكتملة</option>
                    <option value="cancelled">ملغية</option>
                    <option value="rescheduled">مؤجلة</option>
                  </select>
                </td>
                <td>
                  <select value={l.attendance} onChange={e => updateAttendance(l.uuid, e.target.value)} className="inline-select">
                    <option value="pending">معلق</option>
                    <option value="present">حاضر</option>
                    <option value="absent">غائب</option>
                    <option value="excused">معتذر</option>
                  </select>
                </td>
                <td>
                  {l.status === 'scheduled' && (
                    <button className="action-btn action-green" title="إكمال" onClick={() => updateStatus(l.uuid, 'completed')}>
                      <CheckCircle size={16} />
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">إضافة حصة جديدة</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الطالب *</label>
                  <select className="form-input" value={form.student_profile_id} onChange={e => setForm({...form, student_profile_id: e.target.value})} required>
                    <option value="">اختر الطالب</option>
                    {students.map(s => <option key={s.uuid} value={s.profile_id}>{s.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المادة *</label>
                  <select className="form-input" value={form.subject_id} onChange={e => setForm({...form, subject_id: e.target.value})} required>
                    <option value="">اختر المادة</option>
                    {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المعلم</label>
                  <select className="form-input" value={form.teacher_id} onChange={e => setForm({...form, teacher_id: e.target.value})}>
                    <option value="">اختر المعلم</option>
                    {teachers.map(t => <option key={t.id} value={t.id}>{t.full_name}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">التاريخ *</label>
                  <input className="form-input" type="date" value={form.date} onChange={e => setForm({...form, date: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت البداية *</label>
                  <input className="form-input" type="time" value={form.start_time} onChange={e => setForm({...form, start_time: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">وقت النهاية *</label>
                  <input className="form-input" type="time" value={form.end_time} onChange={e => setForm({...form, end_time: e.target.value})} required />
                </div>
              </div>
              <div className="form-group">
                <label className="form-label">رابط الحصة</label>
                <input className="form-input" dir="ltr" value={form.meeting_link} onChange={e => setForm({...form, meeting_link: e.target.value})} placeholder="https://zoom.us/..." />
              </div>
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              <div className="modal-actions">
                <button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>إلغاء</button>
                <button type="submit" className="btn-primary-sm">إنشاء الحصة</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
