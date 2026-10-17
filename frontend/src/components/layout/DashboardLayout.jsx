import { useState } from 'react';
import { Outlet, NavLink, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';
import { FileText, Pin, Archive, Trash2, LogOut, FileSignature, Menu, X } from 'lucide-react';
import { Button } from '../ui/Button';
import { disconnectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export function DashboardLayout() {
  const user = useAuthStore((state) => state.user);
  const logout = useAuthStore((state) => state.logout);
  const navigate = useNavigate();
  const location = useLocation();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const handleLogout = () => {
    disconnectSocket();
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const navItems = [
    { name: 'All Notes', icon: FileText, path: '/' },
    { name: 'Pinned', icon: Pin, path: '/?filter=pinned' },
    { name: 'Archived', icon: Archive, path: '/?filter=archived' }, // frontend filter
  ];

  // Helper to check if a sidebar item is active based on path AND query params
  const isItemActive = (itemPath) => {
    return location.pathname + location.search === itemPath;
  };

  return (
    <div className="flex h-screen bg-surface-dim overflow-hidden relative">
      
      {/* Mobile Sidebar Overlay */}
      {isMobileMenuOpen && (
        <button
          type="button"
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => setIsMobileMenuOpen(false)}
          aria-label="Close menu"
        />
      )}

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 z-50 w-64 bg-surface border-r border-gray-200 flex flex-col transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0 ${isMobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        
        {/* Mobile Close Button */}
        <button 
          type="button"
          onClick={() => setIsMobileMenuOpen(false)}
          className="absolute top-6 right-4 p-1 rounded-full hover:bg-gray-100 text-slate-500 md:hidden"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          <div className="flex items-center gap-2 text-primary font-bold text-xl tracking-tight mb-8">
            <FileSignature className="w-6 h-6" /> Nestly Notes
          </div>
          
          <div className="flex items-center gap-3 mb-6 p-2 rounded-lg bg-gray-50 border border-gray-100">
            <div className="w-10 h-10 rounded bg-primary/10 text-primary flex items-center justify-center font-bold">
              {user?.name?.charAt(0).toUpperCase() || 'U'}
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-900 line-clamp-1">{user?.name || 'Workspace'}</p>
            </div>
          </div>

          <Button 
            className="w-full mb-6 justify-center gap-2" 
            onClick={() => { navigate('/editor'); setIsMobileMenuOpen(false); }}
          >
            <span className="text-lg leading-none">+</span> New Note
          </Button>

          <nav className="space-y-1">
            {navItems.map((item) => (
              <button
                type="button"
                key={item.name}
                onClick={() => { navigate(item.path); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                  isItemActive(item.path)
                    ? 'bg-primary/10 text-primary' 
                    : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900'
                }`}
              >
                <item.icon className="w-4 h-4" />
                {item.name}
              </button>
            ))}
          </nav>
        </div>

        <div className="mt-auto p-6 space-y-1">
          <NavLink to="/trash" onClick={() => setIsMobileMenuOpen(false)} className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${isActive ? 'bg-primary/10 text-primary' : 'text-slate-600 hover:bg-gray-100 hover:text-slate-900 w-full'}`}>
            <Trash2 className="w-4 h-4" /> Trash
          </NavLink>
          <button type="button" onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-slate-600 hover:bg-error/10 hover:text-error w-full transition-colors text-left">
            <LogOut className="w-4 h-4" /> Logout
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Top Navbar */}
        <header className="h-16 bg-surface border-b border-gray-200 flex items-center justify-between px-4 sm:px-6 lg:px-10 shrink-0">
          <div className="flex items-center gap-3">
            <button 
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg text-slate-500 hover:bg-gray-100 md:hidden"
            >
              <Menu className="w-6 h-6" />
            </button>
            <div className="flex-1 max-w-2xl hidden sm:block">
              {/* Search handled in NotesList */}
            </div>
          </div>
          <div className="flex items-center gap-4">
            <button type="button" onClick={() => navigate('/profile')} className="flex items-center gap-2 hover:bg-gray-50 p-1.5 pr-3 rounded-full transition-colors border border-transparent hover:border-gray-200">
              <div className="w-8 h-8 rounded-full bg-primary/20 border border-primary/30 flex items-center justify-center text-primary text-sm font-bold">
                {user?.name?.charAt(0).toUpperCase()}
              </div>
              <span className="text-sm font-semibold text-slate-700 hidden sm:inline">Account</span>
            </button>
          </div>
        </header>
        
        {/* Page Content */}
        <div className="flex-1 overflow-auto bg-surface-dim relative">
          <div className="p-4 sm:p-6 lg:p-10 max-w-7xl mx-auto h-full">
            <Outlet />
          </div>
          
          {/* Mobile FAB for New Note */}
          {location.pathname === '/' && (
            <button 
              type="button"
              onClick={() => navigate('/editor')}
              className="md:hidden fixed bottom-6 right-6 w-14 h-14 bg-primary text-white rounded-full shadow-lg flex items-center justify-center hover:bg-primary-container transition-colors z-40 active:scale-95"
              aria-label="New Note"
            >
              <span className="text-3xl leading-none font-light mb-1">+</span>
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
