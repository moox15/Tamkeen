import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Calendar, BookOpen, FileText, TrendingUp, 
  Package, User, LogOut, Menu, X
} from 'lucide-react';

const navItems = [
  { path: '/student', icon: LayoutDashboard, label: 'الرئيسية', end: true },
  { path: '/student/schedule', icon: Calendar, label: 'جدولي' },
  { path: '/student/lessons', icon: BookOpen, label: 'دروسي' },
  { path: '/student/homework', icon: FileText, label: 'واجباتي' },
  { path: '/student/progress', icon: TrendingUp, label: 'تقدمي' },
  { path: '/student/subscription', icon: Package, label: 'اشتراكي' },
  { path: '/student/profile', icon: User, label: 'حسابي' },
];

const mobileNavItems = navItems.slice(0, 5); // Show first 5 in bottom nav

export default function StudentLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  
  return (
    <div className="dashboard-layout student-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar (desktop + mobile drawer) */}
      <aside className={`sidebar ${sidebarOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <img src="/profile.png" alt="تمكّن" className="sidebar-logo" />
          <span className="sidebar-brand">تمكّن</span>
          <button className="sidebar-close" onClick={() => setSidebarOpen(false)}>
            <X size={20} />
          </button>
        </div>
        
        <nav className="sidebar-nav">
          {navItems.map(item => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.end}
              className={({ isActive }) => `sidebar-link ${isActive ? 'sidebar-link-active' : ''}`}
              onClick={() => setSidebarOpen(false)}
            >
              <item.icon size={20} />
              <span>{item.label}</span>
            </NavLink>
          ))}
        </nav>
        
        <div className="sidebar-footer">
          <button className="sidebar-link sidebar-logout" onClick={handleLogout}>
            <LogOut size={20} />
            <span>تسجيل الخروج</span>
          </button>
        </div>
      </aside>
      
      {/* Main content */}
      <div className="dashboard-main">
        {/* Top bar */}
        <header className="dashboard-topbar">
          <button className="topbar-menu" onClick={() => setSidebarOpen(true)}>
            <Menu size={22} />
          </button>
          
          <div className="topbar-right">
            <div className="topbar-user">
              <div className="topbar-avatar student-avatar">
                {user?.full_name?.charAt(0) || 'ط'}
              </div>
              <span className="topbar-name">{user?.full_name}</span>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="dashboard-content student-content">
          <Outlet />
        </main>
      </div>
      
      {/* Mobile bottom navigation */}
      <nav className="mobile-bottom-nav">
        {mobileNavItems.map(item => (
          <NavLink
            key={item.path}
            to={item.path}
            end={item.end}
            className={({ isActive }) => `bottom-nav-item ${isActive ? 'bottom-nav-active' : ''}`}
          >
            <item.icon size={20} />
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  );
}
