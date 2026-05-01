import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { LogOut, User, LayoutDashboard, Database } from 'lucide-react';

const Navbar = ({ title }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="bg-white border-b border-slate-200 sticky top-0 z-30 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center space-x-3">
            <div className="bg-indigo-600 p-2 rounded-lg shadow-sm">
              <Database className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold text-slate-800 hidden sm:block">Ethara</span>
            <div className="h-6 w-px bg-slate-200 mx-2 hidden sm:block"></div>
            <h2 className="text-lg font-medium text-slate-600 truncate max-w-[200px] sm:max-w-md">{title}</h2>
          </div>
          
          <div className="flex items-center space-x-4">
            <div className="flex items-center bg-slate-50 px-3 py-1.5 rounded-full border border-slate-200">
              <User className="w-4 h-4 text-slate-500 mr-2" />
              <div className="flex flex-col items-start leading-none">
                <span className="text-xs font-bold text-slate-700">{user?.name}</span>
                <span className="text-[10px] text-indigo-500 uppercase tracking-wider font-extrabold">{user?.role}</span>
              </div>
            </div>
            
            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors group"
              title="Logout"
            >
              <LogOut className="w-5 h-5 group-active:scale-90" />
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
