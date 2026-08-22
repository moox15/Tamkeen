import { useState, useEffect } from 'react';
import { admin } from '../../services/api';
import { 
  Plus, CheckCircle, Clock, AlertCircle, FileText, 
  Search, Eye, Edit3, Trash2, Check, X, Award, MessageSquare, Send
} from 'lucide-react';

export default function Homework() {
  const [tab, setTab] = useState('list'); // 'list' or 'pending'
  const [homeworkList, setHomeworkList] = useState([]);
  const [allSubmissions, setAllSubmissions] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Modals state
  const [showCreate, setShowCreate] = useState(false);
  const [gradingModal, setGradingModal] = useState(null); // Selected submission object
  const [submissionsModal, setSubmissionsModal] = useState(null); // Selected homework submissions
  
  // Grading form state
  const [gradingForm, setGradingForm] = useState({
    total_score: '',
    manual_score: '',
    feedback: '',
    question_grades: [],
  });
  const [gradingLoading, setGradingLoading] = useState(false);
  const [gradingError, setGradingError] = useState('');

  // Create homework form
  const [form, setForm] = useState({
    lesson_id: '',
    title: '',
    description: '',
    due_date: '',
    max_grade: 100,
    questions: [
      { question_text: '', question_type: 'multiple_choice', options: '', correct_answer: '', points: 10 }
    ],
  });
  const [formError, setFormError] = useState('');
  const [formLoading, setFormLoading] = useState(false);

  const loadData = async () => {
    setLoading(true);
    try {
      const [hwData, subsData, lessonsData] = await Promise.all([
        admin.getHomeworkList(),
        admin.getAllSubmissions(),
        admin.getLessons({ limit: 200 }),
      ]);
      setHomeworkList(hwData);
      setAllSubmissions(subsData);
      setLessons(lessonsData);
    } catch (err) {
      console.error('Error loading homework data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Open Grading Modal
  const openGrading = (sub, hwContext = null) => {
    const hw = hwContext || {
      title: sub.homework_title,
      max_grade: sub.max_grade || 100,
    };
    
    // Initialize question grades
    const qGrades = (sub.answers || []).map(ans => ({
      question_id: ans.question_id,
      question_text: ans.question_text,
      question_type: ans.question_type,
      options: ans.options,
      correct_answer: ans.correct_answer,
      answer_text: ans.answer_text,
      max_points: ans.points || 0,
      points_earned: ans.points_earned !== null && ans.points_earned !== undefined ? ans.points_earned : (ans.is_correct ? ans.points : 0),
      is_correct: ans.is_correct,
    }));

    // Calculate initial total
    const initialTotal = sub.total_score !== null && sub.total_score !== undefined
      ? sub.total_score
      : qGrades.reduce((sum, q) => sum + (q.points_earned || 0), 0);

    setGradingModal({
      submission: sub,
      homework: hw,
    });
    setGradingForm({
      total_score: initialTotal.toString(),
      manual_score: (sub.manual_score || 0).toString(),
      feedback: sub.feedback || '',
      question_grades: qGrades,
    });
    setGradingError('');
  };

  // Handle Question points change
  const handleQuestionPointsChange = (qIndex, points) => {
    const updated = [...gradingForm.question_grades];
    const numPoints = Math.max(0, parseFloat(points) || 0);
    const max = updated[qIndex].max_points;
    updated[qIndex].points_earned = numPoints;
    updated[qIndex].is_correct = numPoints > 0 ? (numPoints >= max ? 1 : 0) : 0;
    
    const newTotal = updated.reduce((sum, q) => sum + (q.points_earned || 0), 0);
    setGradingForm({
      ...gradingForm,
      question_grades: updated,
      total_score: newTotal.toString(),
    });
  };

  // Submit Grade
  const handleSaveGrade = async (e) => {
    e.preventDefault();
    setGradingError('');
    setGradingLoading(true);

    try {
      const finalScore = parseFloat(gradingForm.total_score);
      await admin.gradeSubmission(gradingModal.submission.id, {
        total_score: isNaN(finalScore) ? 0 : finalScore,
        manual_score: isNaN(finalScore) ? 0 : finalScore,
        feedback: gradingForm.feedback,
        question_grades: gradingForm.question_grades.map(q => ({
          question_id: q.question_id,
          points_earned: q.points_earned,
          is_correct: q.is_correct,
        })),
      });

      setGradingModal(null);
      await loadData();
      alert('تم تصحيح الواجب بنجاح وإرسال النتيجة للطالب! 🎯');
    } catch (err) {
      setGradingError(err.message || 'فشل حفظ التصحيح.');
    } finally {
      setGradingLoading(false);
    }
  };

  // View specific homework submissions
  const handleViewSubmissions = async (hw) => {
    try {
      const data = await admin.getHomeworkSubmissions(hw.uuid);
      setSubmissionsModal(data);
    } catch (err) {
      alert(err.message);
    }
  };

  // Delete homework
  const handleDeleteHomework = async (hw) => {
    if (!window.confirm(`هل أنت متأكد من حذف واجب "${hw.title}"؟`)) return;
    try {
      await admin.deleteHomework(hw.uuid);
      loadData();
    } catch (err) {
      alert(err.message);
    }
  };

  // Question helpers for creating homework
  const addQuestion = () => setForm({
    ...form,
    questions: [
      ...form.questions,
      { question_text: '', question_type: 'multiple_choice', options: '', correct_answer: '', points: 10 }
    ]
  });
  
  const removeQuestion = (i) => setForm({
    ...form,
    questions: form.questions.filter((_, idx) => idx !== i)
  });
  
  const updateQuestion = (i, field, val) => {
    const q = [...form.questions];
    q[i] = { ...q[i], [field]: val };
    setForm({ ...form, questions: q });
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormError('');
    setFormLoading(true);
    try {
      await admin.createHomework({
        lesson_id: parseInt(form.lesson_id),
        title: form.title,
        description: form.description,
        due_date: form.due_date || undefined,
        max_grade: parseFloat(form.max_grade),
        questions: form.questions.map((q, i) => ({
          ...q,
          points: parseFloat(q.points) || 10,
          order_index: i
        })),
      });
      setShowCreate(false);
      setForm({
        lesson_id: '',
        title: '',
        description: '',
        due_date: '',
        max_grade: 100,
        questions: [{ question_text: '', question_type: 'multiple_choice', options: '', correct_answer: '', points: 10 }],
      });
      loadData();
      alert('تم إنشاء الواجب بنجاح وإشعار الطالب.');
    } catch (err) {
      setFormError(err.message);
    } finally {
      setFormLoading(false);
    }
  };

  // Filtered lists
  const pendingSubmissions = allSubmissions.filter(s => s.status === 'submitted');
  const gradedSubmissions = allSubmissions.filter(s => s.status === 'graded');

  const filteredHomework = homeworkList.filter(hw => {
    if (!search) return true;
    const s = search.toLowerCase();
    return (
      (hw.title && hw.title.toLowerCase().includes(s)) ||
      (hw.student_name && hw.student_name.toLowerCase().includes(s)) ||
      (hw.subject_name && hw.subject_name.toLowerCase().includes(s))
    );
  });

  return (
    <div className="dashboard-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">إدارة وتصحيح الواجبات</h1>
          <p className="page-subtitle">إنشاء الواجبات، تصحيح إجابات الطلاب، وإرسال الدرجات والملاحظات</p>
        </div>
        <button className="btn-primary-sm" onClick={() => setShowCreate(true)}>
          <Plus size={18} />
          <span>إنشاء واجب جديد</span>
        </button>
      </div>

      {/* Stats row */}
      <div className="stats-grid" style={{ marginBottom: '1.5rem' }}>
        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(37,99,235,0.15)', color: 'var(--royal-300)' }}>
            <FileText size={24} />
          </div>
          <div>
            <div className="stat-value">{homeworkList.length}</div>
            <div className="stat-label">إجمالي الواجبات</div>
          </div>
        </div>

        <div className="stat-card" style={{ border: pendingSubmissions.length > 0 ? '1px solid var(--gold-400)' : 'none' }}>
          <div className="stat-icon" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold-400)' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className="stat-value" style={{ color: 'var(--gold-300)' }}>{pendingSubmissions.length}</div>
            <div className="stat-label">بانتظار التصحيح</div>
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-icon" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
            <CheckCircle size={24} />
          </div>
          <div>
            <div className="stat-value">{gradedSubmissions.length}</div>
            <div className="stat-label">تم تصحيحها</div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs-bar">
        <button
          className={`tab-btn ${tab === 'list' ? 'tab-active' : ''}`}
          onClick={() => setTab('list')}
        >
          <FileText size={16} /> قائمة الواجبات ({homeworkList.length})
        </button>
        <button
          className={`tab-btn ${tab === 'pending' ? 'tab-active' : ''}`}
          onClick={() => setTab('pending')}
        >
          <Clock size={16} /> بانتظار التصحيح ({pendingSubmissions.length})
        </button>
      </div>

      {/* ======================= TAB 1: ALL HOMEWORK ======================= */}
      {tab === 'list' && (
        <>
          {/* Search bar */}
          <div className="filters-bar" style={{ marginBottom: '1rem' }}>
            <div className="search-form" style={{ flex: 1 }}>
              <Search size={18} className="search-icon" />
              <input
                type="text"
                placeholder="بحث بعنوان الواجب، اسم الطالب، أو المادة..."
                className="search-input"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="data-table-container">
            <table className="data-table">
              <thead>
                <tr>
                  <th>الواجب</th>
                  <th>الطالب</th>
                  <th>المادة</th>
                  <th>تاريخ الحصة</th>
                  <th>تاريخ التسليم</th>
                  <th>حالة التسليم</th>
                  <th>الدرجة</th>
                  <th style={{ width: '180px' }}>الإجراءات</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={8} className="td-empty">جاري التحميل...</td></tr>
                ) : filteredHomework.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="td-empty">
                      <div style={{ padding: '2.5rem', textAlign: 'center' }}>
                        <FileText size={40} style={{ margin: '0 auto 12px', opacity: 0.35 }} />
                        <p>لا توجد واجبات مسجلة.</p>
                        <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                          انقر على "إنشاء واجب جديد" لربط واجب بحصة دراسية.
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredHomework.map(hw => (
                    <tr key={hw.id}>
                      <td className="td-name">
                        <strong>{hw.title}</strong>
                        {hw.questions_count > 0 && (
                          <span style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.5)', display: 'block' }}>
                            {hw.questions_count} أسئلة
                          </span>
                        )}
                      </td>
                      <td>{hw.student_name || '—'}</td>
                      <td><span className="badge-subtle">{hw.subject_name || '—'}</span></td>
                      <td dir="ltr">{hw.lesson_date || '—'}</td>
                      <td dir="ltr">{hw.due_date || '—'}</td>
                      <td>
                        {hw.submission_status === 'graded' ? (
                          <span className="status-badge status-active" style={{ background: 'rgba(16,185,129,0.15)', color: '#10B981' }}>
                            ✓ تم التصحيح
                          </span>
                        ) : hw.submission_status === 'submitted' ? (
                          <span className="status-badge" style={{ background: 'rgba(201,168,76,0.15)', color: 'var(--gold-300)', border: '1px solid var(--gold-400)' }}>
                            ⏳ بانتظار التصحيح
                          </span>
                        ) : (
                          <span className="status-badge status-inactive">
                            لم يسلم بعد
                          </span>
                        )}
                      </td>
                      <td>
                        {hw.submission_status === 'graded' ? (
                          <strong style={{ color: 'var(--gold-300)' }}>{hw.total_score} / {hw.max_grade}</strong>
                        ) : '—'}
                      </td>
                      <td>
                        <div className="table-actions">
                          {/* Grade Button if submitted */}
                          {hw.submission_status === 'submitted' && (
                            <button
                              className="btn-primary-sm"
                              style={{ padding: '4px 10px', fontSize: '0.8rem' }}
                              title="تصحيح الواجب الآن"
                              onClick={async () => {
                                const fullHw = await admin.getHomeworkSubmissions(hw.uuid);
                                const sub = fullHw.submissions.find(s => s.student_profile_id === hw.student_profile_id) || fullHw.submissions[0];
                                if (sub) openGrading(sub, fullHw.homework);
                              }}
                            >
                              <Award size={14} />
                              <span>تصحيح</span>
                            </button>
                          )}

                          {/* Re-grade / View Graded */}
                          {hw.submission_status === 'graded' && (
                            <button
                              className="action-btn"
                              title="تعديل التصحيح"
                              onClick={async () => {
                                const fullHw = await admin.getHomeworkSubmissions(hw.uuid);
                                const sub = fullHw.submissions.find(s => s.student_profile_id === hw.student_profile_id) || fullHw.submissions[0];
                                if (sub) openGrading(sub, fullHw.homework);
                              }}
                            >
                              <Edit3 size={15} />
                            </button>
                          )}

                          <button
                            className="action-btn"
                            title="عرض تفاصيل التسليم"
                            onClick={() => handleViewSubmissions(hw)}
                          >
                            <Eye size={15} />
                          </button>

                          <button
                            className="action-btn text-danger"
                            title="حذف الواجب"
                            onClick={() => handleDeleteHomework(hw)}
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
        </>
      )}

      {/* ======================= TAB 2: PENDING GRADING ======================= */}
      {tab === 'pending' && (
        <div className="data-table-container">
          <table className="data-table">
            <thead>
              <tr>
                <th>الطالب</th>
                <th>الواجب</th>
                <th>المادة</th>
                <th>تاريخ التسليم</th>
                <th>الدرجة القصوى</th>
                <th>الإجراء</th>
              </tr>
            </thead>
            <tbody>
              {pendingSubmissions.length === 0 ? (
                <tr>
                  <td colSpan={6} className="td-empty">
                    <div style={{ padding: '3rem', textAlign: 'center' }}>
                      <CheckCircle size={44} style={{ margin: '0 auto 12px', color: '#10B981' }} />
                      <h3>رائع! لا توجد واجبات تنتظر التصحيح حالياً.</h3>
                      <p style={{ color: 'rgba(255,255,255,0.5)', marginTop: '4px' }}>
                        عندما يسلم أي طالب واجبه، سيظهر هنا فوراً لتصحيحه.
                      </p>
                    </div>
                  </td>
                </tr>
              ) : (
                pendingSubmissions.map(sub => (
                  <tr key={sub.id}>
                    <td className="td-name"><strong>{sub.student_name}</strong></td>
                    <td>{sub.homework_title}</td>
                    <td><span className="badge-subtle">{sub.subject_name || '—'}</span></td>
                    <td dir="ltr">{new Date(sub.submitted_at).toLocaleString('ar-SA')}</td>
                    <td>{sub.max_grade} نقطة</td>
                    <td>
                      <button
                        className="btn-primary-sm"
                        style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                        onClick={() => openGrading(sub)}
                      >
                        <Award size={16} />
                        <span>تصحيح الواجب ✍️</span>
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}

      {/* ======================= GRADING MODAL ======================= */}
      {gradingModal && (
        <div className="modal-overlay" onClick={() => setGradingModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()} style={{ maxWidth: '780px' }}>
            <div className="modal-header" style={{ borderBottom: '1px solid rgba(201,168,76,0.3)', paddingBottom: '1rem' }}>
              <div>
                <h2 className="modal-title" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Award size={22} style={{ color: 'var(--gold-400)' }} />
                  <span>تصحيح واجب: {gradingModal.homework.title}</span>
                </h2>
                <p style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.7)', marginTop: '4px' }}>
                  الطالب: <strong>{gradingModal.submission.student_name}</strong> • الدرجة القصوى: <strong>{gradingModal.homework.max_grade}</strong>
                </p>
              </div>
              <button className="modal-close" onClick={() => setGradingModal(null)}>✕</button>
            </div>

            {gradingError && <div className="form-error" style={{ margin: '1rem 0' }}>{gradingError}</div>}

            <form onSubmit={handleSaveGrade} style={{ marginTop: '1.25rem' }}>
              {/* Questions & Student Answers */}
              <h3 style={{ fontSize: '1.05rem', color: 'var(--gold-300)', marginBottom: '1rem' }}>
                إجابات الطالب والتقييم:
              </h3>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', maxHeight: '50vh', overflowY: 'auto', paddingLeft: '4px' }}>
                {gradingForm.question_grades.map((q, idx) => (
                  <div
                    key={q.question_id || idx}
                    style={{
                      background: 'rgba(13,31,76,0.45)',
                      border: '1px solid rgba(37,99,235,0.25)',
                      borderRadius: '12px',
                      padding: '1.25rem',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <span style={{ fontWeight: 700, color: '#fff' }}>السؤال {idx + 1}: {q.question_text}</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--gold-300)', whiteSpace: 'nowrap' }}>
                        (الدرجة القصوى: {q.max_points})
                      </span>
                    </div>

                    {/* Correct Answer hint if set */}
                    {q.correct_answer && (
                      <div style={{ fontSize: '0.82rem', color: 'rgba(255,255,255,0.5)', marginBottom: '8px' }}>
                        الإجابة النموذجية: <strong style={{ color: 'var(--gold-300)' }}>{q.correct_answer}</strong>
                      </div>
                    )}

                    {/* Student's answer box */}
                    <div style={{
                      background: 'rgba(5,13,26,0.6)',
                      border: '1px solid rgba(255,255,255,0.1)',
                      borderRadius: '8px',
                      padding: '10px 14px',
                      marginBottom: '12px',
                    }}>
                      <div style={{ fontSize: '0.78rem', color: 'rgba(255,255,255,0.4)', marginBottom: '4px' }}>إجابة الطالب:</div>
                      <div style={{ fontSize: '0.95rem', color: q.answer_text ? '#fff' : 'rgba(255,255,255,0.4)' }}>
                        {q.answer_text || '— لم يقم الطالب بالإجابة —'}
                      </div>
                    </div>

                    {/* Score for this question */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem' }}>
                      <div style={{ display: 'flex', gap: '6px' }}>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            background: q.points_earned === q.max_points ? 'rgba(16,185,129,0.3)' : '',
                            borderColor: q.points_earned === q.max_points ? '#10B981' : '',
                          }}
                          onClick={() => handleQuestionPointsChange(idx, q.max_points)}
                        >
                          ✓ إجابة صحيحة ({q.max_points})
                        </button>
                        <button
                          type="button"
                          className="btn-secondary-sm"
                          style={{
                            padding: '4px 12px',
                            fontSize: '0.8rem',
                            background: q.points_earned === 0 ? 'rgba(239,68,68,0.3)' : '',
                            borderColor: q.points_earned === 0 ? '#EF4444' : '',
                          }}
                          onClick={() => handleQuestionPointsChange(idx, 0)}
                        >
                          ✗ غير صحيحة (0)
                        </button>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <label className="form-label" style={{ margin: 0, fontSize: '0.85rem' }}>الدرجة المستحقة:</label>
                        <input
                          type="number"
                          step="0.5"
                          min="0"
                          max={q.max_points}
                          style={{ width: '80px', textAlign: 'center' }}
                          className="form-input"
                          value={q.points_earned}
                          onChange={e => handleQuestionPointsChange(idx, e.target.value)}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* Total Grade and Feedback */}
              <div style={{
                marginTop: '1.5rem',
                padding: '1.25rem',
                background: 'linear-gradient(135deg, rgba(201,168,76,0.1) 0%, rgba(37,99,235,0.1) 100%)',
                border: '1px solid rgba(201,168,76,0.3)',
                borderRadius: '12px'
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem', flexWrap: 'wrap', gap: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <Award size={24} style={{ color: 'var(--gold-400)' }} />
                    <span style={{ fontSize: '1.1rem', fontWeight: 800 }}>الدرجة النهائية للواجب:</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      max={gradingModal.homework.max_grade}
                      className="form-input"
                      style={{ width: '100px', fontSize: '1.2rem', fontWeight: 800, textAlign: 'center', color: 'var(--gold-300)' }}
                      value={gradingForm.total_score}
                      onChange={e => setGradingForm({ ...gradingForm, total_score: e.target.value })}
                      required
                    />
                    <span style={{ fontSize: '1.1rem', fontWeight: 700 }}>من {gradingModal.homework.max_grade}</span>
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: 0 }}>
                  <label className="form-label" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <MessageSquare size={16} />
                    <span>ملاحظات المعلم وتوجيهات للطالب (تظهر للطالب مع النتيجة):</span>
                  </label>
                  <textarea
                    className="form-input form-textarea"
                    rows="3"
                    placeholder="مثال: أحسنت عملاً! إجاباتك ممتازة، ركز أكثر في السؤال الثاني..."
                    value={gradingForm.feedback}
                    onChange={e => setGradingForm({ ...gradingForm, feedback: e.target.value })}
                  />
                </div>
              </div>

              {/* Actions */}
              <div className="modal-actions" style={{ marginTop: '1.5rem' }}>
                <button
                  type="button"
                  className="btn-secondary-sm"
                  onClick={() => setGradingModal(null)}
                >
                  إلغاء
                </button>
                <button
                  type="submit"
                  className="btn-primary-sm"
                  disabled={gradingLoading}
                  style={{ padding: '10px 24px' }}
                >
                  <Send size={16} />
                  <span>{gradingLoading ? 'جاري الحفظ...' : 'اعتماد التقييم وإرسال النتيجة للطالب 🎯'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================= VIEW SUBMISSIONS MODAL ======================= */}
      {submissionsModal && (
        <div className="modal-overlay" onClick={() => setSubmissionsModal(null)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">تفاصيل تسليمات: {submissionsModal.homework.title}</h2>
              <button className="modal-close" onClick={() => setSubmissionsModal(null)}>✕</button>
            </div>

            <div style={{ marginTop: '1rem' }}>
              {submissionsModal.submissions.length === 0 ? (
                <div style={{ padding: '2rem', textAlign: 'center' }}>
                  <Clock size={36} style={{ margin: '0 auto 8px', opacity: 0.4 }} />
                  <p>لم يقم أي طالب بتسليم هذا الواجب بعد.</p>
                </div>
              ) : (
                <div className="data-table-container">
                  <table className="data-table">
                    <thead>
                      <tr>
                        <th>الطالب</th>
                        <th>تاريخ التسليم</th>
                        <th>الحالة</th>
                        <th>الدرجة</th>
                        <th>ملاحظات المعلم</th>
                        <th>الإجراء</th>
                      </tr>
                    </thead>
                    <tbody>
                      {submissionsModal.submissions.map(sub => (
                        <tr key={sub.id}>
                          <td className="td-name"><strong>{sub.student_name}</strong></td>
                          <td dir="ltr">{new Date(sub.submitted_at).toLocaleString('ar-SA')}</td>
                          <td>
                            <span className={`status-badge ${sub.status === 'graded' ? 'status-active' : ''}`}>
                              {sub.status === 'graded' ? 'مصحح' : 'بانتظار التصحيح'}
                            </span>
                          </td>
                          <td>{sub.status === 'graded' ? `${sub.total_score} / ${submissionsModal.homework.max_grade}` : '—'}</td>
                          <td style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.7)' }}>{sub.feedback || '—'}</td>
                          <td>
                            <button
                              className="btn-primary-sm"
                              style={{ padding: '4px 12px', fontSize: '0.8rem' }}
                              onClick={() => {
                                setSubmissionsModal(null);
                                openGrading(sub, submissionsModal.homework);
                              }}
                            >
                              <Award size={14} />
                              <span>{sub.status === 'graded' ? 'تعديل التصحيح' : 'تصحيح'}</span>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======================= CREATE HOMEWORK MODAL ======================= */}
      {showCreate && (
        <div className="modal-overlay" onClick={() => setShowCreate(false)}>
          <div className="modal modal-lg" onClick={e => e.stopPropagation()}>
            <div className="modal-header">
              <h2 className="modal-title">إنشاء واجب جديد</h2>
              <button className="modal-close" onClick={() => setShowCreate(false)}>✕</button>
            </div>

            {formError && <div className="form-error">{formError}</div>}

            <form onSubmit={handleCreate} className="modal-form">
              <div className="form-grid">
                <div className="form-group">
                  <label className="form-label">الحصة المرتبطة *</label>
                  <select
                    className="form-input"
                    value={form.lesson_id}
                    onChange={e => setForm({ ...form, lesson_id: e.target.value })}
                    required
                  >
                    <option value="">اختر الحصة</option>
                    {lessons.map(l => (
                      <option key={l.uuid} value={l.id}>
                        {l.student_name} - {l.subject_name} ({l.date})
                      </option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">عنوان الواجب *</label>
                  <input
                    className="form-input"
                    placeholder="مثال: واجب الدرس الأول في الجبر"
                    value={form.title}
                    onChange={e => setForm({ ...form, title: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">الدرجة القصوى *</label>
                  <input
                    className="form-input"
                    type="number"
                    value={form.max_grade}
                    onChange={e => setForm({ ...form, max_grade: e.target.value })}
                    required
                  />
                </div>
                <div className="form-group">
                  <label className="form-label">تاريخ التسليم</label>
                  <input
                    className="form-input"
                    type="date"
                    value={form.due_date}
                    onChange={e => setForm({ ...form, due_date: e.target.value })}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">وصف وتوجيهات الواجب</label>
                <textarea
                  className="form-input form-textarea"
                  rows="2"
                  placeholder="تعليمات حل الواجب للطلاب..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                />
              </div>

              <h3 style={{ margin: '1.5rem 0 1rem', color: 'var(--gold-400)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span>أسئلة الواجب</span>
                <span style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.6)' }}>({form.questions.length})</span>
              </h3>

              {form.questions.map((q, i) => (
                <div key={i} className="question-block" style={{ marginBottom: '1rem' }}>
                  <div className="question-header">
                    <span>سؤال {i + 1}</span>
                    {form.questions.length > 1 && (
                      <button type="button" className="btn-danger-sm" onClick={() => removeQuestion(i)}>
                        حذف السؤال
                      </button>
                    )}
                  </div>
                  <div className="form-grid">
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">نص السؤال *</label>
                      <input
                        className="form-input"
                        placeholder="اكتب السؤال هنا..."
                        value={q.question_text}
                        onChange={e => updateQuestion(i, 'question_text', e.target.value)}
                        required
                      />
                    </div>
                    <div className="form-group">
                      <label className="form-label">نوع السؤال</label>
                      <select
                        className="form-input"
                        value={q.question_type}
                        onChange={e => updateQuestion(i, 'question_type', e.target.value)}
                      >
                        <option value="multiple_choice">اختيار من متعدد</option>
                        <option value="true_false">صح / خطأ</option>
                        <option value="short_answer">إجابة قصيرة / مقالي</option>
                      </select>
                    </div>
                    <div className="form-group">
                      <label className="form-label">الدرجة</label>
                      <input
                        className="form-input"
                        type="number"
                        min="0"
                        value={q.points}
                        onChange={e => updateQuestion(i, 'points', e.target.value)}
                      />
                    </div>
                    {q.question_type === 'multiple_choice' && (
                      <div className="form-group" style={{ gridColumn: 'span 2' }}>
                        <label className="form-label">الخيارات (مفصولة بفاصلة)</label>
                        <input
                          className="form-input"
                          value={q.options}
                          onChange={e => updateQuestion(i, 'options', e.target.value)}
                          placeholder="مثال: 5, 10, 15, 20"
                        />
                      </div>
                    )}
                    <div className="form-group" style={{ gridColumn: 'span 2' }}>
                      <label className="form-label">الإجابة النموذجية / الصحيحة (اختياري)</label>
                      <input
                        className="form-input"
                        placeholder={q.question_type === 'true_false' ? 'صح أو خطأ' : 'الإجابة الصحيحة...'}
                        value={q.correct_answer}
                        onChange={e => updateQuestion(i, 'correct_answer', e.target.value)}
                      />
                    </div>
                  </div>
                </div>
              ))}

              <button type="button" className="btn-secondary-sm" onClick={addQuestion} style={{ marginBottom: '1.5rem' }}>
                + إضافة سؤال آخر
              </button>

              <div className="modal-actions">
                <button type="button" className="btn-secondary-sm" onClick={() => setShowCreate(false)}>
                  إلغاء
                </button>
                <button type="submit" className="btn-primary-sm" disabled={formLoading}>
                  {formLoading ? 'جاري الإنشاء...' : 'إنشاء الواجب وحفظه'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
