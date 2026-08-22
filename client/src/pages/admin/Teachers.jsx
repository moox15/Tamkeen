import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Plus, Edit, UserX } from 'lucide-react';

export default function Teachers() {
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm] = useState({ full_name: '', phone: '', email: '', specialization: '', notes: '' });
  const [formError, setFormError] = useState('');
  
  const load = () => { admin.getTeachers().then(setTeachers).finally(() => setLoading(false)); };
  useEffect(() => { load(); }, []);
  
  const handleCreate = async (e) => {
    e.preventDefault(); setFormError('');
    try { await admin.createTeacher(form); setShowCreate(false); setForm({ full_name: '', phone: '', email: '', specialization: '', notes: '' }); load(); } catch (err) { setFormError(err.message); }
  };
  
  const handleDelete = async (id) => {
    if (!confirm('هل تريد تعطيل هذا المعلم؟')) return;
    try { await admin.deleteTeacher(id); load(); } catch (err) { alert(err.message); }
  };
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">إدارة المعلمين</h1>
        <button className="btn-primary-sm" onClick={() => setShowCreate(true)}><Plus size={18} /> إضافة معلم</button>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>الاسم</th><th>الهاتف</th><th>البريد</th><th>التخصص</th><th>الإجراءات</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={5} className="td-empty">جاري التحميل...</td></tr> :
            teachers.length === 0 ? <tr><td colSpan={5} className="td-empty">لا يوجد معلمون.</td></tr> :
            teachers.map(t => (
              <tr key={t.id}>
                <td className="td-name">{t.full_name}</td><td dir="ltr">{t.phone || '—'}</td><td dir="ltr">{t.email || '—'}</td><td>{t.specialization || '—'}</td>
                <td><button className="action-btn action-red" title="تعطيل" onClick={() => handleDelete(t.id)}><UserX size={16} /></button></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">إضافة معلم</h2><button className="modal-close" onClick={() => setShowCreate(false)}>✕</button></div>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">الاسم *</label><input className="form-input" value={form.full_name} onChange={e => setForm({...form, full_name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">الهاتف</label><input className="form-input" dir="ltr" value={form.phone} onChange={e => setForm({...form, phone: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">البريد</label><input className="form-input" dir="ltr" type="email" value={form.email} onChange={e => setForm({...form, email: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">التخصص</label><input className="form-input" value={form.specialization} onChange={e => setForm({...form, specialization: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>إلغاء</button><button type="submit" className="btn-primary-sm">إضافة</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
