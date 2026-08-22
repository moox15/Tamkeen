import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { student } from '../../services/api';
import { FileText, CheckCircle, Clock, AlertCircle, Award, ChevronLeft } from 'lucide-react';

export default function MyHomework() {
  const [homework, setHomework] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    student.getHomework()
      .then(setHomework)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);
  
  return (
    <div className="dashboard-page">
      <div className="page-header">
        <div>
          <h1 className="page-title">واجباتي والتكليفات</h1>
          <p className="page-subtitle">حل الواجبات ومتابعة درجات التقييم وملاحظات المعلم</p>
        </div>
      </div>

      {loading ? (
        <div className="page-loading">
          <div className="loading-spinner" />
        </div>
      ) : (
        <div className="homework-list" style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {homework.length === 0 ? (
            <div style={{
              textAlign: 'center',
              padding: '4rem 2rem',
              background: 'rgba(10,22,40,0.5)',
              borderRadius: '16px',
              border: '1px solid rgba(37,99,235,0.2)'
            }}>
              <FileText size={48} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
              <h3 style={{ color: '#fff', margin: 0 }}>لا توجد واجبات مطلوبة حالياً.</h3>
              <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '6px' }}>
                سيظهر هنا أي واجب جديد يسنده إليك المعلم بعد الحصص.
              </p>
            </div>
          ) : (
            homework.map(hw => {
              const isGraded = hw.submission_status === 'graded';
              const isSubmitted = hw.submission_status === 'submitted';

              return (
                <Link
                  key={hw.uuid}
                  to={`/student/homework/${hw.uuid}`}
                  className="homework-card"
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '1.25rem 1.5rem',
                    background: isGraded
                      ? 'linear-gradient(135deg, rgba(13,31,76,0.85) 0%, rgba(10,22,40,0.95) 100%)'
                      : 'rgba(10,22,40,0.85)',
                    border: isGraded ? '1px solid var(--gold-400)' : '1px solid rgba(37,99,235,0.25)',
                    borderRadius: '14px',
                    textDecoration: 'none',
                    transition: 'all 0.25s ease',
                    gap: '1rem',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px', flex: 1 }}>
                    <div style={{
                      width: '46px',
                      height: '46px',
                      borderRadius: '12px',
                      background: isGraded ? 'rgba(16,185,129,0.15)' : (isSubmitted ? 'rgba(37,99,235,0.15)' : 'rgba(201,168,76,0.15)'),
                      color: isGraded ? '#10B981' : (isSubmitted ? 'var(--royal-300)' : 'var(--gold-400)'),
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      flexShrink: 0,
                    }}>
                      {isGraded ? <CheckCircle size={24} /> : (isSubmitted ? <Clock size={24} /> : <FileText size={24} />)}
                    </div>

                    <div>
                      <h3 style={{ fontSize: '1.1rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                        {hw.title}
                      </h3>
                      <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '6px', fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>
                        <span style={{ color: 'var(--royal-300)', fontWeight: 600 }}>📚 {hw.subject_name || 'عام'}</span>
                        {hw.lesson_date && <span>📅 الحصة: {hw.lesson_date}</span>}
                        {hw.due_date && <span style={{ color: 'var(--gold-300)' }}>⏳ التسليم: {hw.due_date}</span>}
                      </div>

                      {/* If teacher left feedback */}
                      {isGraded && hw.feedback && (
                        <p style={{ margin: '8px 0 0', fontSize: '0.85rem', color: 'rgba(255,255,255,0.8)', fontStyle: 'italic' }}>
                          💬 ملاحظة المعلم: "{hw.feedback}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexShrink: 0 }}>
                    {isGraded && (
                      <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.5)' }}>الدرجة</div>
                        <span style={{ fontSize: '1.25rem', fontWeight: 900, color: 'var(--gold-300)' }}>
                          {hw.total_score} / {hw.max_grade}
                        </span>
                      </div>
                    )}

                    <span
                      className="status-badge"
                      style={{
                        background: isGraded ? 'rgba(16,185,129,0.15)' : (isSubmitted ? 'rgba(37,99,235,0.15)' : 'rgba(201,168,76,0.15)'),
                        color: isGraded ? '#10B981' : (isSubmitted ? 'var(--royal-300)' : 'var(--gold-300)'),
                        border: `1px solid ${isGraded ? '#10B981' : (isSubmitted ? 'var(--royal-300)' : 'var(--gold-400)')}`,
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontWeight: 700,
                        fontSize: '0.85rem',
                      }}
                    >
                      {isGraded ? '✓ تم التصحيح' : (isSubmitted ? '⏳ بانتظار التصحيح' : '✍️ مطلوب للحل')}
                    </span>

                    <ChevronLeft size={20} style={{ color: 'rgba(255,255,255,0.4)' }} />
                  </div>
                </Link>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
