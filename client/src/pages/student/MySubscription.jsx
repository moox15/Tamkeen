import { useState, useEffect } from 'react';
import { student } from '../../services/api';

export default function MySubscription() {
  const [subs, setSubs] = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => { student.getSubscription().then(setSubs).catch(console.error).finally(() => setLoading(false)); }, []);
  
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  
  return (
    <div className="dashboard-page">
      <div className="page-header"><h1 className="page-title">اشتراكي</h1></div>
      
      {subs.length === 0 ? <p className="text-muted" style={{textAlign:'center',padding:'3rem'}}>لا يوجد اشتراك حالياً.</p> :
      <div className="subscription-cards">
        {subs.map(s => (
          <div key={s.uuid} className={`sub-card sub-${s.status}`}>
            <div className="sub-card-header">
              <h3>{s.package_name || `${s.total_lessons} حصة`}</h3>
              <span className={`status-badge status-${s.status}`}>{{ active: 'نشط', expired: 'منتهي', cancelled: 'ملغي', completed: 'مكتمل', pending_payment: 'بانتظار الدفع' }[s.status]}</span>
            </div>
            <div className="sub-card-body">
              <div className="sub-detail"><span>إجمالي الحصص:</span><strong>{s.total_lessons}</strong></div>
              <div className="sub-detail"><span>حصص مكتملة:</span><strong>{s.completed_lessons}</strong></div>
              <div className="sub-detail"><span>حصص متبقية:</span><strong className="text-green">{s.remaining_lessons}</strong></div>
              <div className="sub-detail"><span>تاريخ البدء:</span><span dir="ltr">{s.start_date}</span></div>
              {s.expiry_date && <div className="sub-detail"><span>تاريخ الانتهاء:</span><span dir="ltr">{s.expiry_date}</span></div>}
            </div>
            <div className="progress-bar-container">
              <div className="progress-bar-bg"><div className="progress-bar-fill" style={{ width: `${(s.completed_lessons / s.total_lessons) * 100}%` }} /></div>
              <div className="progress-text"><span>{s.completed_lessons}/{s.total_lessons}</span></div>
            </div>
          </div>
        ))}
      </div>}
    </div>
  );
}
