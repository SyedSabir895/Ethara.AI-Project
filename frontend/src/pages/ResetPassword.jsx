import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import api from '../services/api';
import { Eye, EyeOff } from 'lucide-react';
import nriBg from '../assets/nri.png';

function useQuery() {
  return new URLSearchParams(useLocation().search);
}

const ResetPassword = () => {
  const query = useQuery();
  const token = query.get('token');
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirm, setConfirm] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (token) {
      // token present -> show reset form
    }
  }, [token]);

  const requestReset = async (e) => {
    e.preventDefault();
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/forgot-password', { email });
      setMessage('If that email exists, a reset link was sent.');
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error sending reset email');
    } finally {
      setLoading(false);
    }
  };

  const submitNewPassword = async (e) => {
    e.preventDefault();
    if (password !== confirm) return setMessage('Passwords do not match');
    setMessage('');
    setLoading(true);
    try {
      await api.post('/auth/reset-password', { token, password });
      setMessage('Password updated. Redirecting to login...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setMessage(err.response?.data?.message || 'Error resetting password');
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
        <h2 className="mb-2 text-2xl font-semibold text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.35)]">Reset Password</h2>
        <p className="mb-5 text-sm text-white/80">Request a reset link or set a new password with your token.</p>

        {message && <div className="mb-4 rounded-lg border border-indigo-200/35 bg-indigo-500/12 px-3 py-2 text-sm text-indigo-50 backdrop-blur-sm">{message}</div>}

        {!token ? (
          <form onSubmit={requestReset} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">Email</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required className="w-full rounded-2xl border border-white/18 bg-white/10 px-3 py-2.5 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35" placeholder="teacher@college.edu" />
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl border border-white/18 bg-indigo-500/80 py-2.5 font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition-all hover:bg-indigo-500/90 hover:shadow-[0_20px_44px_rgba(79,70,229,0.36)] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Sending...' : 'Send Reset Link'}</button>
          </form>
        ) : (
          <form onSubmit={submitNewPassword} className="space-y-4">
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">New Password</label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/18 bg-white/10 px-3 py-2.5 pr-10 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35"
                  placeholder="Enter a new password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 transition-colors hover:text-white"
                  aria-label={showPassword ? 'Hide new password' : 'Show new password'}
                >
                  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-white/90">Confirm Password</label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  required
                  className="w-full rounded-2xl border border-white/18 bg-white/10 px-3 py-2.5 pr-10 text-white placeholder:text-white/40 shadow-[inset_0_1px_0_rgba(255,255,255,0.14),0_10px_22px_rgba(0,0,0,0.1)] backdrop-blur-xl focus:outline-none focus:ring-2 focus:ring-white/35"
                  placeholder="Repeat the new password"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirm((current) => !current)}
                  className="absolute inset-y-0 right-0 flex items-center pr-3 text-slate-300 transition-colors hover:text-white"
                  aria-label={showConfirm ? 'Hide confirm password' : 'Show confirm password'}
                >
                  {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>
            <button type="submit" disabled={loading} className="w-full rounded-2xl border border-white/18 bg-indigo-500/80 py-2.5 font-semibold text-white shadow-[0_16px_36px_rgba(79,70,229,0.28)] transition-all hover:bg-indigo-500/90 hover:shadow-[0_20px_44px_rgba(79,70,229,0.36)] disabled:cursor-not-allowed disabled:opacity-60">{loading ? 'Updating...' : 'Update Password'}</button>
          </form>
        )}

        <div className="mt-4 text-center">
          <Link to="/login" className="text-sm font-medium text-white/85 hover:text-white hover:underline">Back to login</Link>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;
