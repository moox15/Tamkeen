import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { admin } from '../../services/api';
import { Plus, Search, Filter, Eye, Edit, UserCheck, UserX, Trash2 } from 'lucide-react';

export default function Students() {
  const [students, setStudents] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [showCreate, setShowCreate] = useState(false);
  const [subjects, setSubjects] = useState([]);
  const [form, setForm] = useState({ email: '', password: '', full_name: '', phone: '', grade: '', academic_stage: 'primary', notes: '', subject_ids: [] });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);
  const navigate = useNavigate();
  
  const loadStudents = async () => {
    setLoading(true);
    try {
      const params = {};
      if (search) params.search = search;
      if (statusFilter) params.status = statusFilter;
      const data = await admin.getStudents(params);
      setStudents(data.students);
      setTotal(data.total);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  useEffect(() => { loadStudents(); }, [statusFilter]);
  useEffect(() => { admin.getSubjects().then(setSubjects).catch(() => {}); }, []);
  
  const handleSearch = (e) => {
    e.preventDefault();
    loadStudents();
  };
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await admin.createStudent(form);
      setShowCreate(false);
      setForm({ email: '', password: '', full_name: '', phone: '', grade: '', academic_stage: 'primary', notes: '', subject_ids: [] });
      loadStudents();
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };
  
  const toggleStatus = async (student) => {
    try {
      await admin.updateStudentStatus(student.uuid, !student.is_active);
      loadStudents();
    } catch (err) {
      alert(err.message);
    }
  };
  
  const grades = ['الصف الأول', 'الصف الثاني', 'الصف الثالث', 'الصف الرابع', 'الصف الخامس', 'الصف السادس',
    'الصف الأول متوسط', 'الصف الثاني متوسط', 'الصف الثالث متوسط',
    'الصف الأول ثانوي', 'الصف الثاني ثانوي', 'الصف الثالث ثانوي'];
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة الطلاب</h1>
          <p className="page-subtitle">{total} طالب مسجل</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          <span>إضافة طالب</span>
        </button>
      </div>
      
      {/* Search and filters */}
      <div className="filters-bar">
        <form onSubmit={handleSearch} className="search-form">
          <Search size={18} className="search-icon" />
          <input type="text" value={search} onChange={e => setSearch(e.target.value)} placeholder="بحث بالاسم، البريد، أو الهاتف..." className="search-input" />
        </form>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">جميع الحالات</option>
          <option value="active">نشط</option>
          <option value="inactive">غير نشط</option>
        </select>
      </div>
      
      {/* Students table */}
      <div className="data-table-container">
        <table className="data-table">
          <thead>
            <tr>
              <th>الاسم</th>
              <th>البريد</th>
              <th>الهاتف</th>
              <th>الصف</th>
              <th>المرحلة</th>
              <th>الحالة</th>
              <th>الإجراءات</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={7} className="td-empty">جاري التحميل...</td></tr>
            ) : students.length === 0 ? (
              <tr><td colSpan={7} className="td-empty">لا توجد نتائج.</td></tr>
            ) : students.map(s => (
              <tr key={s.uuid}>
                <td className="td-name">
                  <Link to={`/admin/students/${s.uuid}`} className="table-link">{s.full_name}</Link>
                </td>
                <td dir="ltr">{s.email}</td>
                <td dir="ltr">{s.phone || '—'}</td>
                <td>{s.grade || '—'}</td>
                <td>{getStageLabel(s.academic_stage)}</td>
                <td>
                  <span className={`status-badge ${s.is_active ? 'status-active' : 'status-inactive'}`}>
                    {s.is_active ? 'نشط' : 'غير نشط'}
                  </span>
                </td>
                <td>
                  <div className="table-actions">
                    <button className="action-btn" title="عرض" onClick={() => navigate(`/admin/students/${s.uuid}`)}>
                      <Eye size={16} />
                    </button>
                    <button className="action-btn" title={s.is_active ? 'تعطيل' : 'تفعيل'} onClick={() => toggleStatus(s)}>
                      {s.is_active ? <UserX size={16} /> : <UserCheck size={16} />}
                    </button>
                    <button
                      className="action-btn text-danger"
                      title="حذف نهائي"
                      onClick={async () => {
                        if (window.confirm(`هل أنت متأكد من حذف الطالب "${s.full_name}" وجميع بياناته نهائياً؟`)) {
                          try {
                            await admin.deleteStudent(s.uuid);
                            loadStudents();
                          } catch (err) {
                            alert(err.message);
                          }
                        }
                      }}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Create student modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">إضافة طالب جديد</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>
            
            {formError && <div className="form-error">{formError}</div>}
            
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الاسم الكامل *</label>
                  <input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">البريد الإلكتروني *</label>
                  <input className="form-input" type="email" dir="ltr" value={form.email} onChange={e => setForm({...form, email: e.target.value})} required />
                </div>
                <div className="form-group">
                  <label className="form-label">كلمة المرور *</label>
                  <input className="form-input" type="password" dir="ltr" value={form.password} onChange={e => setForm({...form, password: e.target.value})} required minLength={8} />
                </div>
                <div className="form-group">
                  <label className="form-label">الهاتف</label>
                  <input className="form-input" dir="ltr" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} />
                </div>
                <div className="form-group">
                  <label className="form-label">الصف *</label>
                  <select className="form-input" value={form.grade} onChange={e => setForm({...form, grade: e.target.value})} required>
                    <option value="">اختر الصف</option>
                    {grades.map(g => <option key={g} value={g}>{g}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">المرحلة الدراسية *</label>
                  <select className="form-input" value={form.academic_stage} onChange={e => setForm({...form, academic_stage: e.target.value})} required>
                    <option value="primary">ابتدائي</option>
                    <option value="middle">متوسط</option>
                    <option value="high">ثانوي</option>
                  </select>
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">المواد</label>
                <div className="checkbox-grid">
                  {subjects.map(s => (
                    <label key={s.id} className="checkbox-label">
                      <input type="checkbox" checked={form.subject_ids.includes(s.id)}
                        onChange={e => {
                          const ids = e.target.checked ? [...form.subject_ids, s.id] : form.subject_ids.filter(id => id !== s.id);
                          setForm({...form, subject_ids: ids});
                        }} />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              
              <div className="form-group">
                <label className="form-label">ملاحظات</label>
                <textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} />
              </div>
              
              <div className="modal-actions">
                <button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>إلغاء</button>
                <button type="submit" className="btn-primary-sm" disabled={formLoading}>
                  {formLoading ? 'جاري الإنشاء...' : 'إنشاء الطالب'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getStageLabel(stage) {
  const labels = { primary: 'ابتدائي', middle: 'متوسط', high: 'ثانوي' };
  return labels[stage] || stage || '—';
}
