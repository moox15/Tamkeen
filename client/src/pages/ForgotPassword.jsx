import { useState } from 'react';
import { Link } from 'react-router-dom';
import { auth } from '../services/api';
import { ArrowRight, Mail } from 'lucide-react';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      await auth.forgotPassword(email);
      setSent(true);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      
      <div className="login-container">
        <Link to="/login" className="login-back-link">
          <ArrowRight size={18} />
          <span>العودة لتسجيل الدخول</span>
        </Link>
        
        <div className="login-card">
          <div className="login-logo">
            <img src="/profile.png" alt="تمكّن" className="login-logo-img" />
            <h1 className="login-title">تمكّن</h1>
          </div>
          
          <h2 className="login-heading">استعادة كلمة المرور</h2>
          
          {sent ? (
            <div className="forgot-success">
              <Mail size={48} className="forgot-success-icon" />
              <p>تم إرسال رابط إعادة تعيين كلمة المرور إلى بريدك الإلكتروني.</p>
              <Link to="/login" className="login-submit" style={{ textDecoration: 'none', textAlign: 'center' }}>
                العودة لتسجيل الدخول
              </Link>
            </div>
          ) : (
            <>
              {error && (
                <div className="login-error">
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}
              
              <form onSubmit={handleSubmit} className="login-form">
                <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', marginBottom: '1rem' }}>
                  أدخل بريدك الإلكتروني المسجل وسنرسل لك رابط إعادة تعيين كلمة المرور.
                </p>
                <div className="form-group">
                  <label htmlFor="email" className="form-label">البريد الإلكتروني</label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="form-input"
                    placeholder="name@example.com"
                    required
                    dir="ltr"
                  />
                </div>
                
                <button type="submit" className="login-submit" disabled={loading}>
                  {loading ? 'جاري الإرسال...' : 'إرسال رابط الاستعادة'}
                </button>
              </form>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
