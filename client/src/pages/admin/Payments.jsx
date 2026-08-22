import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { Plus } from 'lucide-react';

export default function Payments() {
  const [payments, setPayments] = useState([]);
  const [students, setStudents] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [statusFilter, setStatusFilter] = useState('');
  const [form, setForm] = useState({ student_profile_id: '', subscription_id: '', amount_due: '', amount_paid: '', payment_date: '', payment_method: '', notes: '' });
  const [formError, setFormError] = useState('');
  
  const load = () => {
    setLoading(true);
    const params = {};
    if (statusFilter) params.status = statusFilter;
    Promise.all([admin.getPayments(params), admin.getStudents({ limit: 200 }), admin.getSubscriptions()])
      .then(([p, s, subs]) => { setPayments(p); setStudents(s.students); setSubscriptions(subs); })
      .finally(() => setLoading(false));
  };
  
  useEffect(() => { load(); }, [statusFilter]);
  
  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    try {
      await admin.createPayment({
        ...form,
        student_profile_id: parseInt(form.student_profile_id),
        subscription_id: form.subscription_id ? parseInt(form.subscription_id) : undefined,
        amount_due: parseFloat(form.amount_due),
        amount_paid: parseFloat(form.amount_paid),
      });
      setShowCreate(false);
      setForm({ student_profile_id: '', subscription_id: '', amount_due: '', amount_paid: '', payment_date: '', payment_method: '', notes: '' });
      load();
    } catch (err) { setFormError(err.message); }
  };
  
  const totalDue = payments.reduce((s, p) => s + p.amount_due, 0);
  const totalPaid = payments.reduce((s, p) => s + p.amount_paid, 0);
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">المدفوعات</h1>
          <p className="page-subtitle">الإجمالي: {totalPaid.toLocaleString()} / {totalDue.toLocaleString()} ر.س</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowCreate(true)}><Plus size={18} /> تسجيل دفعة</button>
      </div>
      
      <div className="filters-bar">
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="filter-select">
          <option value="">جميع الحالات</option>
          <option value="paid">مدفوع</option>
          <option value="partially_paid">دفع جزئي</option>
          <option value="pending">معلق</option>
          <option value="refunded">مسترد</option>
        </select>
      </div>
      
      <div className="data-table-container">
        <table className="data-table">
          <thead><tr><th>الطالب</th><th>المبلغ المطلوب</th><th>المدفوع</th><th>المتبقي</th><th>التاريخ</th><th>الطريقة</th><th>الحالة</th></tr></thead>
          <tbody>
            {loading ? <tr><td colSpan={7} className="td-empty">جاري التحميل...</td></tr> :
            payments.length === 0 ? <tr><td colSpan={7} className="td-empty">لا توجد مدفوعات.</td></tr> :
            payments.map(p => (
              <tr key={p.id}>
                <td className="td-name">{p.student_name}</td>
                <td>{p.amount_due} ر.س</td>
                <td>{p.amount_paid} ر.س</td>
                <td>{(p.amount_due - p.amount_paid).toFixed(2)} ر.س</td>
                <td dir="ltr">{p.payment_date || '—'}</td>
                <td>{{ bank_transfer: 'تحويل بنكي', cash: 'نقدي', online: 'إلكتروني', other: 'أخرى' }[p.payment_method] || '—'}</td>
                <td><span className={`status-badge status-${p.status}`}>{{ paid: 'مدفوع', partially_paid: 'جزئي', pending: 'معلق', refunded: 'مسترد', cancelled: 'ملغي' }[p.status]}</span></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal" onClick={e => e.stopPropagation()}>
            <div className="modal-header"><h2 className="modal-title">تسجيل دفعة</h2><button className="modal-close" onClick={() => setShowCreate(false)}>✕</button></div>
            {formError && <div className="form-error">{formError}</div>}
            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group"><label className="form-label">الطالب *</label><select className="form-input" value={form.student_profile_id} onChange={e => setForm({...form, student_profile_id: e.target.value})} required><option value="">اختر</option>{students.map(s => <option key={s.uuid} value={s.profile_id}>{s.full_name}</option>)}</select></div>
                <div className="form-group"><label className="form-label">الاشتراك</label><select className="form-input" value={form.subscription_id} onChange={e => setForm({...form, subscription_id: e.target.value})}><option value="">بدون ربط</option>{subscriptions.map(s => <option key={s.id} value={s.id}>{s.student_name} - {s.total_lessons} حصة</option>)}</select></div>
                <div className="form-group"><label className="form-label">المبلغ المطلوب *</label><input className="form-input" type="number" min="0" step="0.01" value={form.amount_due} onChange={e => setForm({...form, amount_due: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">المبلغ المدفوع *</label><input className="form-input" type="number" min="0" step="0.01" value={form.amount_paid} onChange={e => setForm({...form, amount_paid: e.target.value})} required /></div>
                <div className="form-group"><label className="form-label">تاريخ الدفع</label><input className="form-input" type="date" value={form.payment_date} onChange={e => setForm({...form, payment_date: e.target.value})} /></div>
                <div className="form-group"><label className="form-label">طريقة الدفع</label><select className="form-input" value={form.payment_method} onChange={e => setForm({...form, payment_method: e.target.value})}><option value="">اختر</option><option value="bank_transfer">تحويل بنكي</option><option value="cash">نقدي</option><option value="online">إلكتروني</option><option value="other">أخرى</option></select></div>
              </div>
              <div className="form-group"><label className="form-label">ملاحظات</label><textarea className="form-input form-textarea" value={form.notes} onChange={e => setForm({...form, notes: e.target.value})} /></div>
              <div className="modal-actions"><button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>إلغاء</button><button type="submit" className="btn-primary-sm">تسجيل الدفعة</button></div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
