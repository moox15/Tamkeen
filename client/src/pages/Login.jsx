import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { LogIn, Eye, EyeOff, ArrowRight } from 'lucide-react';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  
  // Redirect if already logged in
  if (isAuthenticated && user) {
    navigate(user.role === 'admin' ? '/admin' : '/student', { replace: true });
    return null;
  }
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      const data = await login(email, password);
      navigate(data.user.role === 'admin' ? '/admin' : '/student', { replace: true });
    } catch (err) {
      setError(err.message || 'فشل تسجيل الدخول.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="login-page">
      {/* Background effects */}
      <div className="login-bg-orb login-bg-orb-1" />
      <div className="login-bg-orb login-bg-orb-2" />
      
      <div className="login-container">
        <Link to="/" className="login-back-link">
          <ArrowRight size={18} />
          <span>العودة للرئيسية</span>
        </Link>
        
        <div className="login-card">
          {/* Logo */}
          <div className="login-logo">
            <img src="/profile.png" alt="تمكّن" className="login-logo-img" />
            <h1 className="login-title">تمكّن</h1>
            <p className="login-subtitle">أكاديمية التعليم الفردي</p>
          </div>
          
          <h2 className="login-heading">تسجيل الدخول</h2>
          
          {error && (
            <div className="login-error">
              <span>⚠️</span>
              <span>{error}</span>
            </div>
          )}
          
          <form onSubmit={handleSubmit} className="login-form">
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
                autoComplete="email"
                dir="ltr"
              />
            </div>
            
            <div className="form-group">
              <label htmlFor="password" className="form-label">كلمة المرور</label>
              <div className="password-wrapper">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="form-input"
                  placeholder="••••••••"
                  required
                  autoComplete="current-password"
                  dir="ltr"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  tabIndex={-1}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            
            <div className="login-actions">
              <Link to="/forgot-password" className="forgot-link">نسيت كلمة المرور؟</Link>
            </div>
            
            <button
              type="submit"
              className="login-submit"
              disabled={loading}
            >
              {loading ? (
                <span className="loading-dots">جاري التسجيل...</span>
              ) : (
                <>
                  <LogIn size={18} />
                  <span>تسجيل الدخول</span>
                </>
              )}
            </button>
          </form>
        </div>
        
        <p className="login-footer-text">© 2026 تمكّن. جميع الحقوق محفوظة.</p>
      </div>
    </div>
  );
}
