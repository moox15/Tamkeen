import { useState } from 'react';
import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import {
  LayoutDashboard, Users, BookOpen, Calendar, FileText, CreditCard, 
  Package, UserCog, Settings, LogOut, Menu, X, Bell, ChevronDown
} from 'lucide-react';

const navItems = [
  { path: '/admin', icon: LayoutDashboard, label: 'الرئيسية', end: true },
  { path: '/admin/students', icon: Users, label: 'الطلاب' },
  { path: '/admin/lessons', icon: BookOpen, label: 'الحصص' },
  { path: '/admin/schedule', icon: Calendar, label: 'الجدول' },
  { path: '/admin/homework', icon: FileText, label: 'الواجبات' },
  { path: '/admin/subscriptions', icon: Package, label: 'الاشتراكات' },
  { path: '/admin/payments', icon: CreditCard, label: 'المدفوعات' },
  { path: '/admin/teachers', icon: UserCog, label: 'المعلمون' },
  { path: '/admin/settings', icon: Settings, label: 'الإعدادات' },
];

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  
  const handleLogout = async () => {
    await logout();
    navigate('/login', { replace: true });
  };
  
  return (
    <div className="dashboard-layout">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      )}
      
      {/* Sidebar */}
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
              <div className="topbar-avatar">
                {user?.full_name?.charAt(0) || 'م'}
              </div>
              <span className="topbar-name">{user?.full_name}</span>
            </div>
          </div>
        </header>
        
        {/* Page content */}
        <main className="dashboard-content">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
