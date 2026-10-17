import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSignature, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await api.post('/auth/login', { email, password });
      const { user, accessToken } = response.data.data;
      setAuth(user, accessToken);
      toast.success('Welcome back!');
      navigate('/');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to login. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim p-4">
      <div className="w-full max-w-[440px] bg-white rounded-xl shadow-sm border border-gray-100 p-8 md:p-10 text-center">
        <div className="flex justify-center mb-6">
          <div className="w-12 h-12 rounded-xl bg-primary flex items-center justify-center text-white">
            <FileSignature className="w-6 h-6" />
          </div>
        </div>
        
        <h1 className="text-2xl font-bold text-slate-900 mb-2">Nestly Notes</h1>
        <h2 className="text-lg font-semibold text-slate-800 mb-1">Welcome Back</h2>
        <p className="text-sm text-slate-500 mb-8">Welcome back! Your thoughts are right where you left them.</p>

        {error && (
          <div className="mb-6 p-3 rounded bg-error/10 text-error text-sm text-left font-medium border border-error/20">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="text-left space-y-5">
          <div className="space-y-1.5">
            <label htmlFor="email" className="text-xs font-semibold text-slate-700">Email Address</label>
            <Input 
              id="email"
              type="email" 
              placeholder="you@company.com" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="space-y-1.5 relative">
            <div className="flex justify-between items-center">
              <label htmlFor="password" className="text-xs font-semibold text-slate-700">Password</label>
              <button type="button" className="text-xs font-semibold text-primary hover:underline bg-transparent border-none p-0 cursor-pointer">Forgot Password?</button>
            </div>
            <div className="relative">
              <Input 
                id="password"
                type={showPassword ? "text" : "password"} 
                placeholder="••••••••" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" className="w-full h-11 text-base mt-2" isLoading={loading}>
            Sign In
          </Button>
        </form>

        <p className="mt-8 text-sm text-slate-500">
          Don't have an account? <Link to="/register" className="text-primary font-semibold hover:underline">Sign Up</Link>
        </p>
      </div>
    </div>
  );
}
