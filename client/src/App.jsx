import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './contexts/AuthContext';

// Landing & Static
import Landing from './pages/Landing';
import Login from './pages/Login';
import ForgotPassword from './pages/ForgotPassword';
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Contact from './pages/Contact';

// Admin
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import Students from './pages/admin/Students';
import StudentDetail from './pages/admin/StudentDetail';
import Lessons from './pages/admin/Lessons';
import AdminSchedule from './pages/admin/AdminSchedule';
import Homework from './pages/admin/Homework';
import Subscriptions from './pages/admin/Subscriptions';
import Payments from './pages/admin/Payments';
import Teachers from './pages/admin/Teachers';
import AdminSettings from './pages/admin/AdminSettings';

// Student
import StudentLayout from './pages/student/StudentLayout';
import StudentDashboard from './pages/student/StudentDashboard';
import MySchedule from './pages/student/MySchedule';
import MyLessons from './pages/student/MyLessons';
import MyHomework from './pages/student/MyHomework';
import HomeworkDetail from './pages/student/HomeworkDetail';
import MyProgress from './pages/student/MyProgress';
import MySubscription from './pages/student/MySubscription';
import MyProfile from './pages/student/MyProfile';

function ProtectedRoute({ children, role }) {
  const { isAuthenticated, user, loading } = useAuth();
  
  if (loading) {
    return (
      <div className="loading-screen">
        <div className="loading-spinner" />
        <p>جاري التحميل...</p>
      </div>
    );
  }
  
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (role && user?.role !== role) {
    return <Navigate to={user?.role === 'admin' ? '/admin' : '/student'} replace />;
  }
  
  return children;
}

export default function App() {
  return (
    <div className="min-h-screen" dir="rtl" lang="ar">
      <Routes>
        {/* Public */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/privacy" element={<PrivacyPolicy />} />
        <Route path="/terms" element={<TermsOfService />} />
        <Route path="/contact" element={<Contact />} />
        
        {/* Admin */}
        <Route path="/admin" element={
          <ProtectedRoute role="admin"><AdminLayout /></ProtectedRoute>
        }>
          <Route index element={<AdminDashboard />} />
          <Route path="students" element={<Students />} />
          <Route path="students/:uuid" element={<StudentDetail />} />
          <Route path="lessons" element={<Lessons />} />
          <Route path="schedule" element={<AdminSchedule />} />
          <Route path="homework" element={<Homework />} />
          <Route path="subscriptions" element={<Subscriptions />} />
          <Route path="payments" element={<Payments />} />
          <Route path="teachers" element={<Teachers />} />
          <Route path="settings" element={<AdminSettings />} />
        </Route>
        
        {/* Student */}
        <Route path="/student" element={
          <ProtectedRoute role="student"><StudentLayout /></ProtectedRoute>
        }>
          <Route index element={<StudentDashboard />} />
          <Route path="schedule" element={<MySchedule />} />
          <Route path="lessons" element={<MyLessons />} />
          <Route path="homework" element={<MyHomework />} />
          <Route path="homework/:uuid" element={<HomeworkDetail />} />
          <Route path="progress" element={<MyProgress />} />
          <Route path="subscription" element={<MySubscription />} />
          <Route path="profile" element={<MyProfile />} />
        </Route>
        
        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}
