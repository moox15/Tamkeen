import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { student } from '../../services/api';
import { ArrowRight, Send, CheckCircle, Clock, Award, MessageSquare, AlertCircle } from 'lucide-react';

export default function HomeworkDetail() {
  const { uuid } = useParams();
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [answers, setAnswers] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  useEffect(() => {
    student.getHomeworkDetail(uuid)
      .then(d => {
        setData(d);
        if (d.submission) setSubmitted(true);
      })
      .catch(() => navigate('/student/homework'))
      .finally(() => setLoading(false));
  }, [uuid]);
  
  const handleSubmit = async () => {
    // Check if at least one question is answered
    const answerList = Object.entries(answers).map(([qId, text]) => ({
      question_id: parseInt(qId),
      answer_text: text,
    }));

    if (answerList.length === 0) {
      alert('يرجى الإجابة على الأسئلة قبل التسليم.');
      return;
    }

    if (!window.confirm('هل أنت متأكد من رغبتك في تسليم الواجب؟ لا يمكنك التعديل بعد التسليم.')) {
      return;
    }

    setSubmitting(true);
    try {
      await student.submitHomework(uuid, answerList);
      setSubmitted(true);
      const refreshed = await student.getHomeworkDetail(uuid);
      setData(refreshed);
      alert('تم تسليم الواجب بنجاح! سيقوم المعلم بتصحيحه قريباً.');
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };
  
  if (loading) {
    return (
      <div className="page-loading">
        <div className="loading-spinner" />
        <p style={{ marginTop: '1rem', color: 'rgba(255,255,255,0.7)' }}>جاري تحميل تفاصيل الواجب...</p>
      </div>
    );
  }

  if (!data) return null;
  
  const { homework: hw, questions, submission, answers: savedAnswers } = data;
  const isGraded = submission?.status === 'graded';
  const percentage = isGraded && hw.max_grade > 0 
    ? Math.round((submission.total_score / hw.max_grade) * 100) 
    : null;
  
  return (
    <div className="dashboard-page">
      <button className="back-button" onClick={() => navigate('/student/homework')}>
        <ArrowRight size={18} />
        <span>العودة لقائمة الواجبات</span>
      </button>
      
      {/* Homework Title & Info */}
      <div className="hw-detail-header" style={{ marginBottom: '1.5rem' }}>
        <h1 className="page-title">{hw.title}</h1>
        {hw.description && <p className="page-subtitle" style={{ fontSize: '1rem', marginTop: '6px' }}>{hw.description}</p>}
        {hw.due_date && (
          <p style={{ fontSize: '0.85rem', color: 'var(--gold-300)', marginTop: '6px' }}>
            📅 تاريخ التسليم المطلوب: {hw.due_date}
          </p>
        )}
      </div>

      {/* RESULT & FEEDBACK BANNER (WHEN SUBMITTED / GRADED) */}
      {submission && (
        <div 
          style={{
            marginBottom: '2rem',
            padding: '1.5rem',
            borderRadius: '16px',
            background: isGraded 
              ? 'linear-gradient(135deg, rgba(201,168,76,0.15) 0%, rgba(16,185,129,0.15) 100%)'
              : 'linear-gradient(135deg, rgba(37,99,235,0.15) 0%, rgba(13,31,76,0.5) 100%)',
            border: isGraded ? '1px solid var(--gold-400)' : '1px solid rgba(37,99,235,0.4)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.25)',
          }}
        >
          {isGraded ? (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '48px', height: '48px', borderRadius: '12px',
                    background: 'rgba(201,168,76,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--gold-400)'
                  }}>
                    <Award size={28} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: '#fff', margin: 0 }}>
                      تم تصحيح الواجب بنجاح! 🎯
                    </h3>
                    <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)', marginTop: '2px' }}>
                      تم مراجعة إجاباتك واعتماد الدرجة من قبل المعلم
                    </p>
                  </div>
                </div>

                {/* Score badge */}
                <div style={{
                  background: 'rgba(5,13,26,0.8)',
                  border: '1px solid var(--gold-400)',
                  borderRadius: '12px',
                  padding: '8px 20px',
                  textAlign: 'center',
                }}>
                  <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)' }}>الدرجة النهائية</div>
                  <div style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--gold-300)' }}>
                    {submission.total_score} / {hw.max_grade}
                    <span style={{ fontSize: '0.9rem', color: '#10B981', marginRight: '6px' }}>({percentage}%)</span>
                  </div>
                </div>
              </div>

              {/* Teacher Feedback */}
              {submission.feedback && (
                <div style={{
                  background: 'rgba(5,13,26,0.6)',
                  border: '1px solid rgba(201,168,76,0.3)',
                  borderRight: '4px solid var(--gold-400)',
                  borderRadius: '10px',
                  padding: '12px 16px',
                  marginTop: '1rem',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: 'var(--gold-400)', fontWeight: 700, fontSize: '0.9rem', marginBottom: '4px' }}>
                    <MessageSquare size={16} />
                    <span>ملاحظات وتقييم المعلم:</span>
                  </div>
                  <p style={{ color: '#fff', fontSize: '0.95rem', lineHeight: '1.6', margin: 0 }}>
                    {submission.feedback}
                  </p>
                </div>
              )}
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <Clock size={32} style={{ color: 'var(--royal-300)' }} />
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#fff', margin: 0 }}>
                  تم تسليم الواجب — بانتظار تصحيح المعلم ⏳
                </h3>
                <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)', marginTop: '2px' }}>
                  تاريخ التسليم: {new Date(submission.submitted_at).toLocaleString('ar-SA')}. ستصلك رسالة وإشعار فور رصد الدرجة.
                </p>
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* QUESTIONS LIST */}
      <h3 style={{ fontSize: '1.1rem', color: 'var(--gold-400)', marginBottom: '1rem' }}>
        الأسئلة ({questions.length}):
      </h3>

      <div className="questions-list">
        {questions.map((q, i) => {
          const savedAnswer = savedAnswers?.find(a => a.question_id === q.id);
          
          return (
            <div 
              key={q.id} 
              className={`question-card ${
                isGraded && savedAnswer 
                  ? (savedAnswer.points_earned > 0 ? 'q-correct' : 'q-incorrect') 
                  : ''
              }`}
              style={{
                background: 'rgba(10,22,40,0.85)',
                border: isGraded && savedAnswer
                  ? (savedAnswer.points_earned > 0 ? '1px solid #10B981' : '1px solid #EF4444')
                  : '1px solid rgba(37,99,235,0.25)',
                borderRadius: '14px',
                padding: '1.5rem',
                marginBottom: '1.25rem',
              }}
            >
              <div className="q-header" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                <span className="q-number" style={{ fontWeight: 800, color: 'var(--royal-300)' }}>
                  السؤال {i + 1}
                </span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {isGraded && savedAnswer && (
                    <span style={{
                      fontSize: '0.85rem',
                      fontWeight: 700,
                      color: savedAnswer.points_earned > 0 ? '#10B981' : '#EF4444',
                    }}>
                      الدرجة: {savedAnswer.points_earned} من {q.points}
                    </span>
                  )}
                  <span className="q-points" style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)' }}>
                    ({q.points} {q.points === 1 ? 'درجة' : 'درجات'})
                  </span>
                </div>
              </div>

              <p className="q-text" style={{ fontSize: '1.05rem', fontWeight: 600, color: '#fff', marginBottom: '1rem' }}>
                {q.question_text}
              </p>
              
              {/* If already submitted, display student's answer */}
              {submitted ? (
                <div className="q-answer-display" style={{
                  background: 'rgba(5,13,26,0.6)',
                  padding: '12px 16px',
                  borderRadius: '10px',
                  border: '1px solid rgba(255,255,255,0.08)'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div>
                      <span className="q-answer-label" style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.85rem' }}>إجابتك: </span>
                      <strong style={{ color: '#fff', fontSize: '1rem' }}>
                        {savedAnswer?.answer_text || '— لا توجد إجابة —'}
                      </strong>
                    </div>

                    {isGraded && savedAnswer && (
                      <div>
                        {savedAnswer.points_earned > 0 ? (
                          <span style={{ color: '#10B981', fontWeight: 700, fontSize: '0.9rem' }}>
                            ✓ إجابة صحيحة ({savedAnswer.points_earned} نقاط)
                          </span>
                        ) : (
                          <span style={{ color: '#EF4444', fontWeight: 700, fontSize: '0.9rem' }}>
                            ✗ إجابة غير صحيحة
                          </span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Show correct answer if graded and available */}
                  {isGraded && savedAnswer?.correct_answer && savedAnswer.points_earned < q.points && (
                    <div style={{ marginTop: '8px', fontSize: '0.88rem', color: 'var(--gold-300)' }}>
                      الإجابة النموذجية: <strong>{savedAnswer.correct_answer}</strong>
                    </div>
                  )}
                </div>
              ) : (
                /* Student Answer Input */
                <div className="q-answer-input">
                  {q.question_type === 'multiple_choice' && q.options ? (
                    <div className="mc-options" style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                      {q.options.split(',').map((opt, oi) => {
                        const trimmed = opt.trim();
                        const isSelected = answers[q.id] === trimmed;
                        return (
                          <label 
                            key={oi} 
                            className={`mc-option ${isSelected ? 'mc-selected' : ''}`}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: '10px',
                              padding: '12px 16px',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
                              border: isSelected ? '1px solid var(--royal-300)' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                              transition: 'all 0.2s',
                            }}
                          >
                            <input 
                              type="radio" 
                              name={`q-${q.id}`} 
                              value={trimmed} 
                              checked={isSelected} 
                              onChange={() => setAnswers({ ...answers, [q.id]: trimmed })} 
                            />
                            <span style={{ color: '#fff', fontSize: '0.95rem' }}>{trimmed}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : q.question_type === 'true_false' ? (
                    <div className="mc-options" style={{ display: 'flex', gap: '12px' }}>
                      {['صح', 'خطأ'].map(opt => {
                        const isSelected = answers[q.id] === opt;
                        return (
                          <label 
                            key={opt} 
                            className={`mc-option ${isSelected ? 'mc-selected' : ''}`}
                            style={{
                              flex: 1,
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                              gap: '8px',
                              padding: '12px 20px',
                              borderRadius: '10px',
                              background: isSelected ? 'rgba(37,99,235,0.2)' : 'rgba(255,255,255,0.04)',
                              border: isSelected ? '1px solid var(--royal-300)' : '1px solid rgba(255,255,255,0.1)',
                              cursor: 'pointer',
                            }}
                          >
                            <input 
                              type="radio" 
                              name={`q-${q.id}`} 
                              value={opt} 
                              checked={isSelected} 
                              onChange={() => setAnswers({ ...answers, [q.id]: opt })} 
                            />
                            <span style={{ color: '#fff', fontWeight: 700 }}>{opt}</span>
                          </label>
                        );
                      })}
                    </div>
                  ) : (
                    <textarea 
                      className="form-input form-textarea" 
                      rows="3"
                      placeholder="اكتب إجابتك هنا بوضوح..." 
                      value={answers[q.id] || ''} 
                      onChange={e => setAnswers({ ...answers, [q.id]: e.target.value })} 
                    />
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
      
      {/* SUBMIT BAR (IF NOT SUBMITTED YET) */}
      {!submitted && (
        <div style={{
          marginTop: '2rem',
          padding: '1.5rem',
          background: 'rgba(10,22,40,0.9)',
          border: '1px solid rgba(201,168,76,0.3)',
          borderRadius: '16px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem'
        }}>
          <div>
            <h4 style={{ color: '#fff', margin: 0, fontSize: '1.05rem' }}>هل انتهيت من الإجابة على جميع الأسئلة؟</h4>
            <p style={{ color: 'rgba(255,255,255,0.5)', margin: '4px 0 0', fontSize: '0.85rem' }}>
              بعد التسليم سيتم إرسال إجاباتك للمعلم لتصحيحها ورصد الدرجة.
            </p>
          </div>
          <button 
            className="btn-primary-sm" 
            style={{ padding: '12px 32px', fontSize: '1rem' }}
            onClick={handleSubmit} 
            disabled={submitting}
          >
            <Send size={18} />
            <span>{submitting ? 'جاري التسليم...' : 'تسليم الواجب الآن 🚀'}</span>
          </button>
        </div>
      )}
    </div>
  );
}
