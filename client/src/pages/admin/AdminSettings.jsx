import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';
import { auth as authApi } from '../../services/api';
import { Shield, Key, FileText, BookOpen, Package, Plus, Trash2, Edit2, Check, X, AlertCircle } from 'lucide-react';

export default function AdminSettings() {
  const { user } = useAuth();
  const [tab, setTab] = useState('subjects');
  
  // Password state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  
  // Audit logs state
  const [auditLogs, setAuditLogs] = useState([]);
  
  // Subjects state
  const [subjects, setSubjects] = useState([]);
  const [loadingSubjects, setLoadingSubjects] = useState(false);
  const [subjectForm, setSubjectForm] = useState({ name: '', name_en: '' });
  const [editingSubject, setEditingSubject] = useState(null);
  const [subjectMsg, setSubjectMsg] = useState('');
  const [subjectErr, setSubjectErr] = useState('');
  
  // Packages state
  const [packages, setPackages] = useState([]);
  const [loadingPackages, setLoadingPackages] = useState(false);
  const [packageForm, setPackageForm] = useState({ name: '', lesson_count: '', price: '', currency: 'SAR', description: '' });
  const [editingPackage, setEditingPackage] = useState(null);
  const [packageMsg, setPackageMsg] = useState('');
  const [packageErr, setPackageErr] = useState('');

  const loadSubjects = async () => {
    setLoadingSubjects(true);
    try {
      const data = await admin.getSubjects();
      setSubjects(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingSubjects(false);
    }
  };

  const loadPackages = async () => {
    setLoadingPackages(true);
    try {
      const data = await admin.getPackages();
      setPackages(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingPackages(false);
    }
  };

  const loadAuditLogs = async () => {
    try {
      const data = await admin.getAuditLogs({ limit: 50 });
      setAuditLogs(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadSubjects();
    loadPackages();
    loadAuditLogs();
  }, []);

  // Password Handler
  const changePassword = async (e) => {
    e.preventDefault();
    setPwMsg('');
    setPwErr('');
    try {
      await authApi.changePassword(currentPassword, newPassword);
      setPwMsg('تم تغيير كلمة المرور بنجاح.');
      setCurrentPassword('');
      setNewPassword('');
    } catch (err) {
      setPwErr(err.message);
    }
  };

  // Subjects Handlers
  const handleSaveSubject = async (e) => {
    e.preventDefault();
    setSubjectMsg('');
    setSubjectErr('');
    if (!subjectForm.name.trim()) return;

    try {
      if (editingSubject) {
        await admin.updateSubject(editingSubject.id, subjectForm);
        setSubjectMsg('تم تحديث المادة بنجاح.');
      } else {
        await admin.createSubject(subjectForm);
        setSubjectMsg('تم إضافة المادة بنجاح.');
      }
      setSubjectForm({ name: '', name_en: '' });
      setEditingSubject(null);
      loadSubjects();
    } catch (err) {
      setSubjectErr(err.message);
    }
  };

  const handleDeleteSubject = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف مادة "${name}"؟`)) return;
    try {
      await admin.deleteSubject(id);
      loadSubjects();
    } catch (err) {
      alert(err.message);
    }
  };

  // Packages Handlers
  const handleSavePackage = async (e) => {
    e.preventDefault();
    setPackageMsg('');
    setPackageErr('');
    if (!packageForm.name.trim() || !packageForm.lesson_count || !packageForm.price) return;

    try {
      const payload = {
        ...packageForm,
        lesson_count: parseInt(packageForm.lesson_count, 10),
        price: parseFloat(packageForm.price),
      };

      if (editingPackage) {
        await admin.updatePackage(editingPackage.id, payload);
        setPackageMsg('تم تحديث الباقة بنجاح.');
      } else {
        await admin.createPackage(payload);
        setPackageMsg('تم إنشاء الباقة بنجاح.');
      }
      setPackageForm({ name: '', lesson_count: '', price: '', currency: 'SAR', description: '' });
      setEditingPackage(null);
      loadPackages();
    } catch (err) {
      setPackageErr(err.message);
    }
  };

  const handleDeletePackage = async (id, name) => {
    if (!window.confirm(`هل أنت متأكد من حذف "${name}"؟`)) return;
    try {
      await admin.deletePackage(id);
      loadPackages();
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">الإعدادات والبيانات الأساسية</h1>
          <p className="page-subtitle">إدارة المواد الدراسية، الباقات، الأمان وسجل العمليات</p>
        </div>
      </div>
      
      <div className="tabs-bar">
        <button className={`tab-btn ${tab === 'subjects' ? 'tab-active' : ''}`} onClick={() => setTab('subjects')}>
          <BookOpen size={16} /> المواد الدراسية ({subjects.length})
        </button>
        <button className={`tab-btn ${tab === 'packages' ? 'tab-active' : ''}`} onClick={() => setTab('packages')}>
          <Package size={16} /> الباقات التعليمية ({packages.length})
        </button>
        <button className={`tab-btn ${tab === 'password' ? 'tab-active' : ''}`} onClick={() => setTab('password')}>
          <Key size={16} /> كلمة المرور والأمان
        </button>
        <button className={`tab-btn ${tab === 'audit' ? 'tab-active' : ''}`} onClick={() => setTab('audit')}>
          <FileText size={16} /> سجل العمليات
        </button>
      </div>
      
      <div className="tab-content">
        {/* ===================== SUBJECTS TAB ===================== */}
        {tab === 'subjects' && (
          <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '1.5rem' }}>
            {/* Form */}
            <div className="settings-card" style={{ height: 'fit-content' }}>
              <h3 className="info-card-title">{editingSubject ? 'تعديل مادة' : 'إضافة مادة دراسية جديدة'}</h3>
              {subjectMsg && <div className="form-success">{subjectMsg}</div>}
              {subjectErr && <div className="form-error">{subjectErr}</div>}
              
              <form onSubmit={handleSaveSubject}>
                <div className="form-group">
                  <label className="form-label">اسم المادة (بالعربية) *</label>
                  <input
                    className="form-input"
                    placeholder="مثال: الرياضيات، الفيزياء..."
                    value={subjectForm.name}
                    onChange={e => setSubjectForm({ ...subjectForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">اسم المادة (بالإنجليزية - اختياري)</label>
                  <input
                    className="form-input"
                    dir="ltr"
                    placeholder="e.g. Mathematics"
                    value={subjectForm.name_en}
                    onChange={e => setSubjectForm({ ...subjectForm, name_en: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary-sm">
                    {editingSubject ? <Check size={16} /> : <Plus size={16} />}
                    <span>{editingSubject ? 'حفظ التعديل' : 'إضافة المادة'}</span>
                  </button>
                  {editingSubject && (
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => {
                        setEditingSubject(null);
                        setSubjectForm({ name: '', name_en: '' });
                      }}
                    >
                      <X size={16} />
                      <span>إلغاء</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم المادة</th>
                    <th>الاسم بالإنجليزية</th>
                    <th style={{ width: '120px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingSubjects ? (
                    <tr><td colSpan={3} className="td-empty">جاري التحميل...</td></tr>
                  ) : subjects.length === 0 ? (
                    <tr>
                      <td colSpan={3} className="td-empty">
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          <BookOpen size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          <p>لا توجد مواد دراسية مسجلة حالياً.</p>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                            استخدم النموذج على اليمين لإضافة المواد التي تقدمها الأكاديمية.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    subjects.map(s => (
                      <tr key={s.id}>
                        <td className="td-name"><strong>{s.name}</strong></td>
                        <td dir="ltr">{s.name_en || '—'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn"
                              title="تعديل"
                              onClick={() => {
                                setEditingSubject(s);
                                setSubjectForm({ name: s.name, name_en: s.name_en || '' });
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="action-btn text-danger"
                              title="حذف"
                              onClick={() => handleDeleteSubject(s.id, s.name)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== PACKAGES TAB ===================== */}
        {tab === 'packages' && (
          <div className="settings-grid" style={{ display: 'grid', gridTemplateColumns: 'minmax(300px, 380px) 1fr', gap: '1.5rem' }}>
            {/* Form */}
            <div className="settings-card" style={{ height: 'fit-content' }}>
              <h3 className="info-card-title">{editingPackage ? 'تعديل الباقة' : 'إضافة باقة اشتراك جديدة'}</h3>
              {packageMsg && <div className="form-success">{packageMsg}</div>}
              {packageErr && <div className="form-error">{packageErr}</div>}
              
              <form onSubmit={handleSavePackage}>
                <div className="form-group">
                  <label className="form-label">اسم الباقة *</label>
                  <input
                    className="form-input"
                    placeholder="مثال: باقة 8 حصص شهرية"
                    value={packageForm.name}
                    onChange={e => setPackageForm({ ...packageForm, name: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">عدد الحصص *</label>
                  <input
                    type="number"
                    min="1"
                    className="form-input"
                    placeholder="مثال: 8"
                    value={packageForm.lesson_count}
                    onChange={e => setPackageForm({ ...packageForm, lesson_count: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">السعر (ر.س) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    className="form-input"
                    placeholder="مثال: 160"
                    value={packageForm.price}
                    onChange={e => setPackageForm({ ...packageForm, price: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الوصف (اختياري)</label>
                  <textarea
                    className="form-input form-textarea"
                    rows="2"
                    placeholder="وصف الباقة ومميزاتها..."
                    value={packageForm.description}
                    onChange={e => setPackageForm({ ...packageForm, description: e.target.value })}
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px', marginTop: '1rem' }}>
                  <button type="submit" className="btn-primary-sm">
                    {editingPackage ? <Check size={16} /> : <Plus size={16} />}
                    <span>{editingPackage ? 'حفظ التعديل' : 'إضافة الباقة'}</span>
                  </button>
                  {editingPackage && (
                    <button
                      type="button"
                      className="btn-secondary-sm"
                      onClick={() => {
                        setEditingPackage(null);
                        setPackageForm({ name: '', lesson_count: '', price: '', currency: 'SAR', description: '' });
                      }}
                    >
                      <X size={16} />
                      <span>إلغاء</span>
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List */}
            <div className="data-table-container">
              <table className="data-table">
                <thead>
                  <tr>
                    <th>اسم الباقة</th>
                    <th>عدد الحصص</th>
                    <th>السعر</th>
                    <th>الوصف</th>
                    <th style={{ width: '120px' }}>الإجراءات</th>
                  </tr>
                </thead>
                <tbody>
                  {loadingPackages ? (
                    <tr><td colSpan={5} className="td-empty">جاري التحميل...</td></tr>
                  ) : packages.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="td-empty">
                        <div style={{ padding: '2rem', textAlign: 'center' }}>
                          <Package size={36} style={{ margin: '0 auto 10px', opacity: 0.4 }} />
                          <p>لا توجد باقات مسجلة حالياً.</p>
                          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                            استخدم النموذج لإضافة باقات الحصص للطلاب.
                          </p>
                        </div>
                      </td>
                    </tr>
                  ) : (
                    packages.map(p => (
                      <tr key={p.id}>
                        <td className="td-name"><strong>{p.name}</strong></td>
                        <td>{p.lesson_count} حصة</td>
                        <td>{p.price} {p.currency || 'SAR'}</td>
                        <td style={{ color: 'rgba(255,255,255,0.7)', fontSize: '0.9rem' }}>{p.description || '—'}</td>
                        <td>
                          <div className="table-actions">
                            <button
                              className="action-btn"
                              title="تعديل"
                              onClick={() => {
                                setEditingPackage(p);
                                setPackageForm({
                                  name: p.name,
                                  lesson_count: p.lesson_count.toString(),
                                  price: p.price.toString(),
                                  currency: p.currency || 'SAR',
                                  description: p.description || '',
                                });
                              }}
                            >
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="action-btn text-danger"
                              title="حذف"
                              onClick={() => handleDeletePackage(p.id, p.name)}
                            >
                              <Trash2 size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ===================== PASSWORD TAB ===================== */}
        {tab === 'password' && (
          <div className="settings-card" style={{ maxWidth: 480 }}>
            <h3 className="info-card-title">تغيير كلمة المرور الخاصة بالمدير</h3>
            {pwMsg && <div className="form-success">{pwMsg}</div>}
            {pwErr && <div className="form-error">{pwErr}</div>}
            <form onSubmit={changePassword}>
              <div className="form-group">
                <label className="form-label">كلمة المرور الحالية *</label>
                <input
                  className="form-input"
                  type="password"
                  dir="ltr"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  required
                />
              </div>
              <div className="form-group">
                <label className="form-label">كلمة المرور الجديدة *</label>
                <input
                  className="form-input"
                  type="password"
                  dir="ltr"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  placeholder="8 أحرف على الأقل"
                />
              </div>
              <button type="submit" className="btn-primary-sm" style={{ marginTop: '0.5rem' }}>
                <Check size={16} />
                <span>تحديث كلمة المرور</span>
              </button>
            </form>
          </div>
        )}
        
        {/* ===================== AUDIT TAB ===================== */}
        {tab === 'audit' && (
          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>المسؤول</th>
                  <th>الإجراء</th>
                  <th>النوع</th>
                  <th>التاريخ</th>
                </tr>
              </thead>
              <tbody>
                {auditLogs.length === 0 ? (
                  <tr><td colSpan={4} className="td-empty">لا توجد عمليات مسجلة.</td></tr>
                ) : (
                  auditLogs.map(log => (
                    <tr key={log.id}>
                      <td>{log.admin_name || '—'}</td>
                      <td>{getActionLabel(log.action)}</td>
                      <td>{log.target_type || '—'}</td>
                      <td dir="ltr">{new Date(log.created_at).toLocaleString('ar-SA')}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

function getActionLabel(action) {
  const labels = {
    student_created: 'إنشاء طالب',
    student_updated: 'تحديث طالب',
    student_deleted: 'حذف طالب',
    student_activated: 'تفعيل طالب',
    student_deactivated: 'تعطيل طالب',
    student_password_reset: 'إعادة تعيين كلمة مرور',
    teacher_created: 'إضافة معلم',
    teacher_updated: 'تحديث معلم',
    teacher_deactivated: 'تعطيل معلم',
    lesson_created: 'إنشاء حصة',
    lesson_updated: 'تحديث حصة',
    lesson_status_changed: 'تغيير حالة حصة',
    attendance_changed: 'تسجيل حضور',
    homework_created: 'إنشاء واجب',
    homework_graded: 'تقييم واجب',
    subscription_created: 'إنشاء اشتراك',
    subscription_updated: 'تحديث اشتراك',
    payment_recorded: 'تسجيل دفعة',
    subject_deleted: 'حذف مادة',
    package_deleted: 'حذف باقة',
  };
  return labels[action] || action;
}
