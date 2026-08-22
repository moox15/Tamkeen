import { useState, useEffect } from 'react';
import { student } from '../../services/api';
import { auth as authApi } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function MyProfile() {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [subjects, setSubjects] = useState([]);
  const [phone, setPhone] = useState('');
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState('');
  
  // Password change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [pwMsg, setPwMsg] = useState('');
  const [pwErr, setPwErr] = useState('');
  
  useEffect(() => {
    student.getProfile().then(d => {
      setProfile(d.profile);
      setSubjects(d.subjects);
      setPhone(d.user.phone || '');
    });
  }, []);
  
  const saveProfile = async () => {
    setSaving(true); setMsg('');
    try { await student.updateProfile({ phone }); setMsg('تم تحديث الملف الشخصي.'); } catch (err) { alert(err.message); }
    setSaving(false);
  };
  
  const changePassword = async (e) => {
    e.preventDefault(); setPwMsg(''); setPwErr('');
    try { await authApi.changePassword(currentPassword, newPassword); setPwMsg('تم تغيير كلمة المرور.'); setCurrentPassword(''); setNewPassword(''); } catch (err) { setPwErr(err.message); }
  };
  
  return (
    <div className="dashboard-page">
      <div className="page-header"><h1 className="page-title">حسابي</h1></div>
      
      <div className="profile-section">
        <div className="info-card">
          <h3 className="info-card-title">المعلومات الشخصية</h3>
          <div className="info-rows">
            <div className="info-row"><span className="info-label">الاسم:</span><span>{user?.full_name}</span></div>
            <div className="info-row"><span className="info-label">البريد:</span><span dir="ltr">{user?.email}</span></div>
            <div className="info-row"><span className="info-label">الصف:</span><span>{profile?.grade || '—'}</span></div>
            <div className="info-row"><span className="info-label">المرحلة:</span><span>{{ primary:'ابتدائي', middle:'متوسط', high:'ثانوي' }[profile?.academic_stage] || '—'}</span></div>
          </div>
          
          <div className="form-group" style={{ marginTop: '1rem' }}>
            <label className="form-label">الهاتف</label>
            <input className="form-input" dir="ltr" value={phone} onChange={e => setPhone(e.target.value)} />
          </div>
          {msg && <div className="form-success">{msg}</div>}
          <button className="btn-primary-sm" onClick={saveProfile} disabled={saving}>{saving ? 'جاري الحفظ...' : 'حفظ'}</button>
        </div>
        
        <div className="info-card">
          <h3 className="info-card-title">المواد والمعلمون</h3>
          {subjects.length === 0 ? <p className="text-muted">لم يتم تعيين مواد.</p> :
          <div className="info-rows">{subjects.map((s, i) => <div key={i} className="info-row"><span className="info-label">{s.name}</span><span>{s.teacher_name || '—'}</span></div>)}</div>}
        </div>
        
        <div className="info-card">
          <h3 className="info-card-title">تغيير كلمة المرور</h3>
          {pwMsg && <div className="form-success">{pwMsg}</div>}
          {pwErr && <div className="form-error">{pwErr}</div>}
          <form onSubmit={changePassword}>
            <div className="form-group"><label className="form-label">كلمة المرور الحالية</label><input className="form-input" type="password" dir="ltr" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} required /></div>
            <div className="form-group"><label className="form-label">كلمة المرور الجديدة</label><input className="form-input" type="password" dir="ltr" value={newPassword} onChange={e => setNewPassword(e.target.value)} required minLength={8} /></div>
            <button type="submit" className="btn-primary-sm">تحديث كلمة المرور</button>
          </form>
        </div>
      </div>
    </div>
  );
}
