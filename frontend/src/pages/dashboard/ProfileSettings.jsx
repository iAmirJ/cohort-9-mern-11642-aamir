import { useAuthStore } from '../../store/useAuthStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { LogOut } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { disconnectSocket } from '../../services/socket';
import toast from 'react-hot-toast';

export default function ProfileSettings() {
  const user = useAuthStore(state => state.user);
  const logout = useAuthStore(state => state.logout);
  const navigate = useNavigate();

  const handleLogout = () => {
    disconnectSocket();
    logout();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const firstName = user?.name?.split(' ')[0] || 'User';
  const lastName = user?.name?.split(' ').slice(1).join(' ') || '';

  return (
    <div className="max-w-5xl mx-auto h-full overflow-y-auto pb-10">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Profile Settings</h1>
      <p className="text-slate-500 text-sm mb-10">Manage your workspace identity and preferences.</p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Left Column */}
        <div className="space-y-6">
          {/* Identity Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col items-center text-center">
            <div className="w-24 h-24 rounded-2xl bg-primary/10 text-primary flex items-center justify-center text-3xl font-bold mb-4">
              {firstName.charAt(0)}
            </div>
            <h2 className="text-xl font-bold text-slate-900 mb-4">{user?.name}</h2>
            <div className="bg-slate-100 text-slate-600 px-3 py-1 rounded text-sm mb-2 flex items-center gap-2">
              <span className="opacity-50">✉</span> {user?.email}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="md:col-span-2 space-y-6">
          {/* Personal Information */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
            <h3 className="text-lg font-bold text-slate-900 mb-6">Personal Information</h3>
            <div className="grid grid-cols-2 gap-6 mb-6">
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">First Name</label>
                <Input value={firstName} readOnly className="bg-gray-50 text-slate-600" />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-semibold text-slate-700">Last Name</label>
                <Input value={lastName} readOnly className="bg-gray-50 text-slate-600" />
              </div>
            </div>
            <div className="space-y-2 mb-2">
              <label className="text-sm font-semibold text-slate-700">Email Address</label>
              <Input value={user?.email || ''} readOnly className="bg-gray-50 text-slate-600" />
            </div>
            <p className="text-xs text-slate-500 mb-6">Contact your admin to change your personal details.</p>
          </div>

          {/* Account Actions */}
          <div className="bg-error/5 rounded-xl border border-error/20 p-8">
            <h3 className="text-lg font-bold text-error mb-2">Account Actions</h3>
            <p className="text-sm text-slate-600 mb-6">Logging out will end your current session across all tabs.</p>
            <Button variant="danger" onClick={handleLogout}>
              <LogOut className="w-4 h-4 mr-2" /> Logout
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
