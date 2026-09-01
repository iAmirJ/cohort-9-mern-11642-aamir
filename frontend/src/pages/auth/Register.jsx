import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileSignature, Eye, EyeOff } from 'lucide-react';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import api from '../../services/api';
import toast from 'react-hot-toast';

export default function Register() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    confirmPassword: ''
  });
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    setLoading(true);

    try {
      await api.post('/auth/register', { 
        name: `${formData.firstName} ${formData.lastName}`.trim(),
        email: formData.email, 
        password: formData.password 
      });
      // Assuming auto-login isn't standard, redirect to login
      toast.success('Account created successfully! Please login.');
      navigate('/login');
    } catch (err) {
      const data = err.response?.data;
      if (data?.errors && Array.isArray(data.errors)) {
        // Express-validator errors array
        setError(data.errors.map(e => e.msg || e.message).join(', '));
      } else {
        setError(data?.message || 'Failed to register. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-surface-dim p-4">
      <div className="flex w-full max-w-5xl bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden min-h-[650px]">
        {/* Left Branding Panel (Desktop Only) */}
        <div className="hidden lg:flex w-[45%] bg-primary flex-col justify-between p-12 text-white relative">
          
          {/* Top Logo */}
          <div className="flex items-center gap-2">
            <FileSignature className="w-6 h-6" />
            <span className="text-xl font-bold tracking-tight">Nestly Notes</span>
          </div>
          
          {/* Middle Content */}
          <div>
            <h1 className="text-4xl font-bold leading-tight mb-4">Capture Every<br/>Brilliant Thought.</h1>
            <p className="text-base text-white/80 max-w-sm">
              Create your account and keep every thought, idea, and note in one place.
            </p>
          </div>

          {/* Bottom Footer */}
          <div className="text-xs text-white/60 font-medium">
            © {new Date().getFullYear()} Nestly Notes
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="w-full lg:w-[55%] flex flex-col justify-center p-8 sm:p-12">
          <div className="w-full max-w-[400px] mx-auto">
            <h2 className="text-2xl font-bold text-slate-900 mb-1">Create Account</h2>
            <p className="text-sm text-slate-500 mb-8">Sign up to get started.</p>

            {error && (
              <div className="mb-6 p-3 rounded bg-error/10 text-error text-sm font-medium border border-error/20">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="flex gap-4">
                <div className="space-y-1.5 flex-1">
                  <label htmlFor="firstName" className="text-xs font-semibold text-slate-700">First Name</label>
                  <Input 
                    id="firstName"
                    name="firstName"
                    placeholder="John" 
                    value={formData.firstName}
                    onChange={handleChange}
                    required
                  />
                </div>
                <div className="space-y-1.5 flex-1">
                  <label htmlFor="lastName" className="text-xs font-semibold text-slate-700">Last Name</label>
                  <Input 
                    id="lastName"
                    name="lastName"
                    placeholder="Doe" 
                    value={formData.lastName}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label htmlFor="register-email" className="text-xs font-semibold text-slate-700">Email Address</label>
                <Input 
                  id="register-email"
                  type="email" 
                  name="email"
                  placeholder="john@example.com" 
                  value={formData.email}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="space-y-1.5 relative">
                <label htmlFor="register-password" className="text-xs font-semibold text-slate-700">Password</label>
                <div className="relative">
                  <Input 
                    id="register-password"
                    type={showPassword ? "text" : "password"} 
                    name="password"
                    placeholder="••••••••" 
                    value={formData.password}
                    onChange={handleChange}
                    required
                    minLength={8}
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

              <div className="space-y-1.5 relative">
                <label htmlFor="confirmPassword" className="text-xs font-semibold text-slate-700">Confirm Password</label>
                <div className="relative">
                  <Input 
                    id="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"} 
                    name="confirmPassword"
                    placeholder="••••••••" 
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    required
                  />
                  <button 
                    type="button" 
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
                  >
                    {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <Button type="submit" className="w-full h-11 text-base mt-2" isLoading={loading}>
                Create Account →
              </Button>
            </form>

            <p className="mt-8 text-sm text-slate-500">
              Already have an account? <Link to="/login" className="text-primary font-semibold hover:underline">Log In</Link>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
