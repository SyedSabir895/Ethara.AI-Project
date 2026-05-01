import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { LogIn, Mail, Lock, ShieldCheck, Eye, EyeOff } from 'lucide-react';
import nriBg from '../assets/nri.png';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  
  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { data } = await api.post('/auth/login', { email, password });
      login(data);
      if (data.role === 'HOD') {
        navigate('/hod-dashboard');
      } else {
        navigate('/teacher-dashboard');
      }
    } catch (err) {
      setError(err.response?.data?.message || 'Something went wrong during login');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center bg-cover bg-center bg-no-repeat p-6"
      style={{ backgroundImage: `linear-gradient(rgba(8, 15, 29, 0.65), rgba(8, 15, 29, 0.45)), url(${nriBg})` }}
    >
      <div className="w-full max-w-md rounded-[28px] border border-white/20 bg-white/8 p-8 text-white shadow-[0_18px_55px_rgba(0,0,0,0.28)] backdrop-blur-2xl">
        <div className="mb-6 flex flex-col items-center text-center">
          <div className="mb-3 rounded-full border border-white/25 bg-white/12 p-3 shadow-lg shadow-indigo-600/25 backdrop-blur-sm">
            <ShieldCheck className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">College Task Manager</h1>
          <p className="mt-1 text-sm text-white/80">Sign in to manage your department tasks</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200/40 bg-red-500/15 p-3 text-sm text-red-50 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Email</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="block w-full rounded-2xl border border-white/18 bg-white/10 pl-10 pr-3 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35 sm:text-sm"
                // placeholder="hod@college.edu"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Password</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Lock size={16} />
              </span>
              <button
                type="button"
                onClick={() => setShowPassword((current) => !current)}
                className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 transition-colors hover:text-white z-10"
                aria-label={showPassword ? 'Hide password' : 'Show password'}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="block w-full rounded-2xl border border-white/18 bg-white/10 pl-10 pr-10 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35 sm:text-sm"
                placeholder="Enter your password"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/18 bg-indigo-500/80 py-2.5 font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition-all hover:bg-indigo-500/90 hover:shadow-[0_20px_44px_rgba(79,70,229,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <LogIn size={16} />
            {loading ? 'Processing...' : 'Sign In'}
          </button>
        </form>

        <div className="mt-4 text-center space-y-2">
          <Link to="/reset-password" className="text-sm font-medium text-white/85 hover:text-white hover:underline">Forgot password?</Link>
          <div className="text-sm text-white/60">
            Don't have an account?{' '}
            <Link to="/signup" className="font-bold text-white hover:underline">Sign Up</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;
