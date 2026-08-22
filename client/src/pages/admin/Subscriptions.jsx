import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Plus, Package } from 'lucide-react';

export default function Subscriptions() {
  const [subscriptions, setSubscriptions] = useState([]);
  const [packages, setPackages] = useState([]);
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [showPkg, setShowPkg] = useState(false);
  const [form, setForm] = useState({ student_profile_id: '', package_id: '', total_lessons: '', start_date: '', expiry_date: '', notes: '' });
  const [pkgForm, setPkgForm] = useState({ name: '', lesson_count: '', price: '', description: '' });
  const [formError, setFormError] = useState('');
  
  const load = () => {
    Promise.all([admin.getSubscriptions(), admin.getPackages(), admin.getStudents({ limit: 200 })])
      .then(([subs, pkgs, studs]) => { setSubscriptions(subs); setPackages(pkgs); setStudents(studs.students); })
      .finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, []);
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await admin.createSubscription({ ...form, student_profile_id: parseInt(form.student_profile_id), package_id: form.package_id ? parseInt(form.package_id) : undefined, total_lessons: parseInt(form.total_lessons) });
      setShowCreate(false);
      load();
    } catch (err) { setFormError(err.message); }
  };
  
  const handleCreatePkg = async (e) => {
    e.preventDefault();
    try {
      await admin.createPackage({ ...pkgForm, lesson_count: parseInt(pkgForm.lesson_count), price: parseFloat(pkgForm.price) });
      setShowPkg(false);
      setPkgForm({ name: '', lesson_count: '', price: '', description: '' });
      load();
    } catch (err) { alert(err.message); }
  };
  
  const selectPackage = (pkgId) => {
    const pkg = packages.find(p => p.id === parseInt(pkgId));
    setForm({ ...form, package_id: pkgId, total_lessons: pkg ? String(pkg.lesson_count) : form.total_lessons });
  };
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1 className="page-title">الاشتراكات والباقات</h1>
        <div className="header-actions">
          <button className="btn-secondary-sm" onClick={() => setShowPkg(true)}><Package size={16} /> باقة جديدة</button>
          <button className="btn-primary-sm" onClick={() => setShowCreate(true)}><Plus size={18} /> اشتراك جديد</button>
        </div>
      </div>
      
      {/* Packages overview */}
      <div className="packages-grid">
        {packages.map(pkg => (
          <div key={pkg.id} className="package-card">
            <h3 className="package-name">{pkg.name}</h3>
            <div className="package-price">{pkg.price} <span>ر.س</span></div>
            <div className="package-lessons">{pkg.lesson_count} حصة</div>
            {pkg.description && <p className="package-desc">{pkg.description}</p>}
          </div>
        ))}
      </div>
      
      {/* Subscriptions table */}
      <div className="data-table-container" style={{ marginTop: '2rem' }}>
        <table className="data-table">
          <thead><tr><th>الطالب</th><th>الباقة</th><th>الحصص</th><th>المكتمل</th><th>المتبقي</th><th>الحالة</th><th>تاريخ البدء</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="td-empty">جاري التحميل...</td></tr> :
            subscriptions.length === 0 ? <tr><td colSpan={7} className="td-empty">لا توجد اشتراكات.</td></tr> :
            subscriptions.map(s => (
              <tr key={s.id}>
                <td className="td-name">{s.student_name}</td>
                <td>{s.package_name || '—'}</td>
                <td>{s.total_lessons}</td>
                <td>{s.completed_lessons}</td>
                <td><strong>{s.total_lessons - s.completed_lessons}</strong></td>
                <td><span className={`status-badge status-${s.status}`}>{getSubStatus(s.status)}</span></td>
                <td dir="ltr">{s.start_date}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {/* Create subscription modal */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">اشتراك جديد</h2><button className="modal-close" onClick={() => setShowCreate(false)}>✕</button></div>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">الطالب *</label><select className="form-input" value={form.student_profile_id} onChange={e => setForm({...form, student_profile_id: e.target.value})} required><option value="">اختر</option>{students.map(s => <option key={s.uuid} value={s.profile_id}>{s.full_name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">الباقة</label><select className="form-input" value={form.package_id} onChange={e => selectPackage(e.target.value)}><option value="">بدون باقة</option>{packages.map(p => <option key={p.id} value={p.id}>{p.name} ({p.price} ر.س)</option>)}</select></div>
                <div className="form-group"><label className="form-label">عدد الحصص *</label><input className="form-input" type="number" min="1" value={form.total_lessons} onChange={e => setForm({...form, total_lessons: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">تاريخ البدء *</label><input className="form-input" type="date" value={form.start_date} onChange={e => setForm({...form, start_date: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">تاريخ الانتهاء</label><input className="form-input" type="date" value={form.expiry_date} onChange={e => setForm({...form, expiry_date: e.target.value})} /></div>
              </div>
              <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>إلغاء</button><button type="submit" className="btn-primary-sm">إنشاء</button></div>
            </form>
          </div>
        </div>
      )}
      
      {/* Create package modal */}
      {showPkg && (
        <div className="modal-overlay" onClick={() => setShowPkg(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">باقة جديدة</h2><button className="modal-close" onClick={() => setShowPkg(false)}>✕</button></div>
            <form onSubmit={handleCreatePkg} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">اسم الباقة *</label><input className="form-input" value={pkgForm.name} onChange={e => setPkgForm({...pkgForm, name: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">عدد الحصص *</label><input className="form-input" type="number" min="1" value={pkgForm.lesson_count} onChange={e => setPkgForm({...pkgForm, lesson_count: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">السعر (ر.س) *</label><input className="form-input" type="number" min="0" step="0.01" value={pkgForm.price} onChange={e => setPkgForm({...pkgForm, price: e.target.value})} required /></div>
              </div>
              <div className="form-group"><label className="form-label">الوصف</label><textarea className="form-input form-textarea" value={pkgForm.description} onChange={e => setPkgForm({...pkgForm, description: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary-sm" onClick={() => setShowPkg(false)}>إلغاء</button><button type="submit" className="btn-primary-sm">إنشاء الباقة</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function getSubStatus(s) { return { active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', completed: 'مكتمل', pending_payment: 'بانتظار الدفع' }[s] || s; }
