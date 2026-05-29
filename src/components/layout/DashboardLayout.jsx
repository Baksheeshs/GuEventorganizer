import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { HiOutlineHome, HiOutlineCalendar, HiOutlineUserGroup, HiOutlineChartBar, HiOutlineBell, HiOutlineCog, HiOutlineAcademicCap, HiOutlineTicket, HiOutlineClipboardCheck, HiOutlineOfficeBuilding, HiOutlineDocumentText, HiOutlinePlusCircle, HiOutlineLogout, HiOutlineMenu, HiOutlineX, HiOutlineMoon, HiOutlineSun } from 'react-icons/hi';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import { useNotifications } from '../../context/NotificationContext';

const navItems = {
  student: [
    { path: '/student', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/events', label: 'Events', icon: HiOutlineCalendar },
    { path: '/clubs', label: 'Clubs & Societies', icon: HiOutlineUserGroup },
    { path: '/my-applications', label: 'My Applications', icon: HiOutlineClipboardCheck },
    { path: '/certificates', label: 'Certificates', icon: HiOutlineAcademicCap },
    { path: '/notifications', label: 'Notifications', icon: HiOutlineBell },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/profile', label: 'Settings', icon: HiOutlineCog },
  ],
  organizer: [
    { path: '/organizer', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/create-event', label: 'Create Event', icon: HiOutlinePlusCircle },
    { path: '/events', label: 'Events', icon: HiOutlineCalendar },
    { path: '/event-results', label: 'Declare Results', icon: HiOutlineAcademicCap },
    { path: '/attendance', label: 'Code Attendance', icon: HiOutlineClipboardCheck },
    { path: '/manage-club-registrations', label: 'Club Registrations', icon: HiOutlineTicket },
    { path: '/venues', label: 'Venues', icon: HiOutlineOfficeBuilding },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/notifications', label: 'Notifications', icon: HiOutlineBell },
    { path: '/profile', label: 'Settings', icon: HiOutlineCog },
  ],
  admin: [
    { path: '/admin', label: 'Dashboard', icon: HiOutlineHome },
    { path: '/events', label: 'Events', icon: HiOutlineCalendar },
    { path: '/venues', label: 'Venues', icon: HiOutlineOfficeBuilding },
    { path: '/clubs', label: 'Clubs & Societies', icon: HiOutlineUserGroup },
    { path: '/event-results', label: 'Declare Results', icon: HiOutlineAcademicCap },
    { path: '/analytics', label: 'Analytics', icon: HiOutlineChartBar },
    { path: '/certificates', label: 'Certificates', icon: HiOutlineDocumentText },
    { path: '/notifications', label: 'Notifications', icon: HiOutlineBell },
    { path: '/profile', label: 'Settings', icon: HiOutlineCog },
  ],
};

export default function DashboardLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const { dark, toggle } = useTheme();
  const { user, logout } = useAuth();
  const { unreadCount } = useNotifications();
  const location = useLocation();
  const navigate = useNavigate();
  const items = navItems[user?.role] || navItems.student;

  const handleLogout = () => { setShowLogoutModal(true); };
  const confirmLogout = () => { 
    setShowLogoutModal(false); 
    logout(); // Fire and forget (clears local session instantly, network req can happen in background)
    
    // Slight delay to allow state to clear, then hard reload
    setTimeout(() => {
      window.location.href = '/'; 
    }, 100);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50 dark:bg-dark-900">
      {/* Mobile overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-40 bg-black/50 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}
      </AnimatePresence>

      {/* Sidebar — GU Navy Theme */}
      <motion.aside
        animate={{ width: collapsed ? 72 : 288 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className={`fixed lg:static inset-y-0 left-0 z-50 bg-gu-700 dark:bg-gu-800 flex flex-col transform lg:transform-none transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}
        style={{ width: collapsed ? 72 : 288 }}
      >
        {/* Logo + Collapse toggle */}
        <div className={`border-b border-gu-600 dark:border-gu-700 flex items-center ${collapsed ? 'justify-center p-3' : 'justify-between p-5'}`}>
          {!collapsed && (
            <Link to="/" className="flex items-center min-w-0">
              <img src="/gu-logo-full.png" alt="Galgotias University" className="h-10 object-contain" />
            </Link>
          )}
          <button
            onClick={() => setCollapsed(c => !c)}
            className="hidden lg:flex items-center justify-center w-9 h-9 rounded-lg hover:bg-gu-600/60 transition-colors flex-shrink-0"
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            <HiOutlineMenu className={`w-5 h-5 text-gu-100/80 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Nav links */}
        <nav className={`flex-1 space-y-1 overflow-y-auto ${collapsed ? 'p-2' : 'p-3'}`}>
          {items.map((item) => {
            const active = location.pathname === item.path;
            return (
              <Link key={item.path} to={item.path} onClick={() => setSidebarOpen(false)}
                title={collapsed ? item.label : undefined}
                className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0 py-2.5' : 'px-4 py-2.5'} rounded-lg text-sm font-medium transition-all duration-200 ${active ? 'bg-gold-400 text-gu-800 shadow-md' : 'text-gu-100/80 hover:bg-gu-600/60 hover:text-white'}`}>
                <item.icon className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{item.label}</span>}
                {!collapsed && item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="ml-auto w-5 h-5 bg-gured-500 text-white text-xs rounded-full flex items-center justify-center">{unreadCount}</span>
                )}
                {collapsed && item.label === 'Notifications' && unreadCount > 0 && (
                  <span className="absolute top-0 right-0 w-2 h-2 bg-gured-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        {/* User section */}
        <div className={`border-t border-gu-600 dark:border-gu-700 ${collapsed ? 'p-2' : 'p-4'}`}>
          <div className={`flex items-center ${collapsed ? 'justify-center' : 'gap-3'} mb-3`}>
            <div className="w-10 h-10 rounded-full bg-gold-400 flex items-center justify-center text-gu-800 font-bold text-sm flex-shrink-0">{user?.avatar}</div>
            {!collapsed && (
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-white truncate">{user?.name}</p>
                <p className="text-xs text-gold-400/80 capitalize">{user?.role}</p>
              </div>
            )}
          </div>
          <button onClick={handleLogout} title={collapsed ? 'Logout' : undefined}
            className={`flex items-center ${collapsed ? 'justify-center' : ''} gap-3 ${collapsed ? 'px-0' : 'px-4'} py-2.5 rounded-lg w-full text-sm font-medium text-red-300 hover:bg-red-500/20 hover:text-red-200 transition-all`}>
            <HiOutlineLogout className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>Logout</span>}
          </button>
        </div>
      </motion.aside>

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top bar — GU style */}
        <header className="h-16 bg-white dark:bg-dark-800 border-b border-dark-100 dark:border-dark-700 flex items-center justify-between px-4 lg:px-6 shadow-sm">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700">
            <HiOutlineMenu className="w-6 h-6 text-dark-600 dark:text-dark-300" />
          </button>

          <div className="hidden lg:flex items-center gap-2">
            <div className="w-1 h-6 bg-gold-400 rounded-full"></div>
            <h2 className="text-lg font-semibold text-gu-700 dark:text-white">
              {items.find(i => i.path === location.pathname)?.label || 'Dashboard'}
            </h2>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={toggle} className="p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
              {dark ? <HiOutlineSun className="w-5 h-5 text-gold-400" /> : <HiOutlineMoon className="w-5 h-5 text-gu-600" />}
            </button>
            <Link to="/notifications" className="relative p-2 rounded-lg hover:bg-dark-100 dark:hover:bg-dark-700 transition-colors">
              <HiOutlineBell className="w-5 h-5 text-dark-600 dark:text-dark-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-gured-500 rounded-full"></span>
              )}
            </Link>
            <div className="hidden sm:flex items-center gap-2 ml-2 pl-3 border-l border-dark-200 dark:border-dark-700">
              <div className="w-8 h-8 rounded-full bg-gu-600 flex items-center justify-center text-white text-xs font-semibold">{user?.avatar}</div>
              <div className="hidden md:block">
                <p className="text-sm font-medium text-dark-900 dark:text-white">{user?.name}</p>
                <p className="text-xs text-dark-400 capitalize">{user?.role}</p>
              </div>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-6">
          <motion.div key={location.pathname} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.3 }}>
            {children}
          </motion.div>
        </main>
      </div>
      {/* Logout Confirmation Modal */}
      <AnimatePresence>
        {showLogoutModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowLogoutModal(false)} />
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }} className="relative bg-white dark:bg-dark-800 rounded-2xl shadow-2xl p-6 max-w-sm w-full text-center">
              <div className="w-14 h-14 mx-auto bg-red-100 dark:bg-red-900/30 rounded-2xl flex items-center justify-center mb-4">
                <HiOutlineLogout className="w-7 h-7 text-red-500" />
              </div>
              <h3 className="font-bold text-dark-900 dark:text-white text-lg">Logout?</h3>
              <p className="text-sm text-dark-400 mt-2">Are you sure you want to log out? You'll need to sign in again to access your dashboard.</p>
              <div className="flex gap-2 mt-5">
                <button onClick={confirmLogout} className="flex-1 py-2.5 bg-red-500 hover:bg-red-600 text-white text-sm font-semibold rounded-xl transition-colors">Yes, Logout</button>
                <button onClick={() => setShowLogoutModal(false)} className="flex-1 py-2.5 bg-gray-100 dark:bg-dark-700 text-dark-700 dark:text-dark-300 text-sm font-semibold rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-colors">Cancel</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
