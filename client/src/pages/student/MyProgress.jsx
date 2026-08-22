import { useState, useEffect } from 'react';
import { student } from '../../services/api';

export default function MyProgress() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => { student.getProgress().then(setData).catch(console.error).finally(() => setLoading(false)); }, []);
  
  if (loading) return <div className="page-loading"><div className="loading-spinner" /></div>;
  if (!data) return <div className="page-error">فشل تحميل البيانات.</div>;
  
  const { subjectPerformance, hwBySubject } = data;
  
  return (
    <div className="dashboard-page">
      <div className="page-header"><h1 className="page-title">تقدمي الدراسي</h1></div>
      
      <h2 className="section-title-sm">الأداء حسب المادة</h2>
      <div className="progress-cards">
        {subjectPerformance.length === 0 ? <p className="text-muted">لا توجد بيانات بعد.</p> :
        subjectPerformance.map(s => {
          const rate = s.total_lessons > 0 ? Math.round((s.present_count / s.total_lessons) * 100) : 0;
          const hwData = hwBySubject.find(h => h.subject_name === s.subject_name);
          const hwScore = hwData?.avg_score ? Math.round(hwData.avg_score) : 0;
          
          return (
            <div key={s.subject_id} className="progress-subject-card">
              <h3>{s.subject_name}</h3>
              <div className="progress-stats">
                <div className="progress-stat">
                  <span className="progress-stat-label">الحصص</span>
                  <span className="progress-stat-value">{s.completed_lessons}/{s.total_lessons}</span>
                  <div className="mini-progress-bar">
                    <div className="mini-bar-fill bar-blue" style={{ width: `${s.total_lessons > 0 ? (s.completed_lessons / s.total_lessons * 100) : 0}%` }} />
                  </div>
                </div>
                <div className="progress-stat">
                  <span className="progress-stat-label">الحضور</span>
                  <span className="progress-stat-value">{rate}%</span>
                  <div className="mini-progress-bar">
                    <div className="mini-bar-fill bar-green" style={{ width: `${rate}%` }} />
                  </div>
                </div>
                <div className="progress-stat">
                  <span className="progress-stat-label">الواجبات</span>
                  <span className="progress-stat-value">{hwScore}%</span>
                  <div className="mini-progress-bar">
                    <div className="mini-bar-fill bar-gold" style={{ width: `${hwScore}%` }} />
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
