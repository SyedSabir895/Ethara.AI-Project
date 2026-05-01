import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { UserPlus, Mail, Lock, User, Eye, EyeOff, ShieldCheck } from 'lucide-react';
import nriBg from '../assets/nri.png';

const Signup = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'Teacher'
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!formData.name.trim()) {
      setError('Name is required');
      setLoading(false);
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setError('Please enter a valid email address');
      setLoading(false);
      return;
    }

    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters long');
      setLoading(false);
      return;
    }

    try {
      await api.post('/auth/register', formData);
      alert('Registration successful! Please login.');
      navigate('/login');
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed');
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
            <UserPlus className="w-7 h-7 text-white" />
          </div>
          <h1 className="text-2xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Join Ethara</h1>
          <p className="mt-1 text-sm text-white/80">Create your account to start managing tasks</p>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200/40 bg-red-500/15 p-3 text-sm text-red-50 backdrop-blur-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Full Name</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <User size={16} />
              </span>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="block w-full rounded-2xl border border-white/18 bg-white/10 pl-10 pr-3 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35 sm:text-sm"
                placeholder="John Doe"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Email Address</label>
            <div className="relative">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-400">
                <Mail size={16} />
              </span>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                className="block w-full rounded-2xl border border-white/18 bg-white/10 pl-10 pr-3 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35 sm:text-sm"
                placeholder="email@college.edu"
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
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
              <input
                type={showPassword ? 'text' : 'password'}
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                className="block w-full rounded-2xl border border-white/18 bg-white/10 pl-10 pr-10 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35 sm:text-sm"
                placeholder="Min 6 characters"
                required
              />
            </div>
          </div>

          <div>
            <label className="mb-2 block text-sm font-medium text-white/90">Account Type</label>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'Teacher' })}
                className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                  formData.role === 'Teacher'
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                } border`}
              >
                Teacher (Member)
              </button>
              <button
                type="button"
                onClick={() => setFormData({ ...formData, role: 'HOD' })}
                className={`py-2 px-4 rounded-xl text-sm font-semibold transition-all ${
                  formData.role === 'HOD'
                    ? 'bg-white/20 border-white/40 text-white'
                    : 'bg-white/5 border-white/10 text-white/50'
                } border`}
              >
                HOD (Admin)
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border border-white/18 bg-indigo-500/80 py-2.5 font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition-all hover:bg-indigo-500/90 hover:shadow-[0_20px_44px_rgba(79,70,229,0.36)] disabled:cursor-not-allowed disabled:opacity-60"
          >
            <UserPlus size={16} />
            {loading ? 'Registering...' : 'Create Account'}
          </button>
        </form>

        <div className="mt-6 text-center text-sm text-white/60">
          Already have an account?{' '}
          <Link to="/login" className="font-bold text-white hover:underline">
            Sign In
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Signup;
