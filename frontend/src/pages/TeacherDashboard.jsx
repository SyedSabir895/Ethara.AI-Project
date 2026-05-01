import React, { useState, useEffect } from 'react';
import api from '../services/api';
import Navbar from '../components/Navbar';
import { 
  ClipboardList, 
  CheckCircle2, 
  Clock, 
  MessageSquare, 
  Filter,
  Search,
  ChevronRight,
  Send,
  Calendar
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';

import { useAuth } from '../context/AuthContext';

const TeacherDashboard = () => {
  const { user: currentUser } = useAuth();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterPriority, setFilterPriority] = useState('All');
  const [filterStatus, setFilterStatus] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');
  const [updatingId, setUpdatingId] = useState(null);
  const [remarkInput, setRemarkInput] = useState('');

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const { data } = await api.get('/tasks/my-tasks');
      setTasks(data);
    } catch (err) {
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (id, newStatus) => {
    setUpdatingId(id);
    try {
      await api.put(`/tasks/${id}/status`, { 
        status: newStatus,
        remarks: remarkInput 
      });
      setRemarkInput('');
      fetchTasks();
    } catch (err) {
      alert('Error updating status');
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (task.projectName && task.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority = filterPriority === 'All' || task.priority === filterPriority;
    const matchesStatus = filterStatus === 'All' || task.status === filterStatus;
    return matchesSearch && matchesPriority && matchesStatus;
  });

  const getPriorityStyle = (priority) => {
    switch (priority) {
      case 'Immediate': return 'bg-red-50 text-red-700 border-red-200';
      case 'High': return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'Medium': return 'bg-blue-50 text-blue-700 border-blue-200';
      default: return 'bg-slate-50 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Teacher Dashboard" />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-slate-800 tracking-tight">Your Assignments</h1>
            <p className="text-slate-500 mt-1">Status of tasks assigned by your Head of Department</p>
          </div>

          <div className="flex items-center space-x-2 bg-white px-4 py-2 rounded-2xl shadow-sm border border-slate-200">
            <ClipboardList className="w-5 h-5 text-indigo-600" />
            <span className="text-lg font-bold text-indigo-600">{tasks.length}</span>
            <span className="text-slate-400 text-sm">Active Tasks</span>
          </div>
        </div>

        {/* Filters and Search */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <div className="relative col-span-1 md:col-span-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input 
              type="text" 
              placeholder="Search your tasks or projects..." 
              className="pl-10 pr-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full bg-white shadow-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          
          <select 
            className="px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
          >
            <option value="All">All Statuses</option>
            <option value="Pending">Pending</option>
            <option value="In Progress">In Progress</option>
            <option value="Completed">Completed</option>
          </select>

          <select 
            className="px-4 py-3 border border-slate-200 rounded-2xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white shadow-sm"
            value={filterPriority}
            onChange={(e) => setFilterPriority(e.target.value)}
          >
            <option value="All">All Priorities</option>
            <option value="Immediate">Immediate</option>
            <option value="High">High</option>
            <option value="Medium">Medium</option>
            <option value="Low">Low</option>
          </select>
        </div>

        {/* Task Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading ? (
            Array(3).fill(0).map((_, i) => (
              <div key={i} className="h-64 bg-slate-200 animate-pulse rounded-2xl"></div>
            ))
          ) : filteredTasks.length > 0 ? filteredTasks.map((task) => {
            const daysLeft = differenceInDays(new Date(task.dueDate), new Date());
            const isOverdue = daysLeft < 0 && task.status !== 'Completed';
            
            return (
              <div key={task._id} className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden flex flex-col hover:shadow-md transition-shadow">
                <div className={`p-4 border-b ${getPriorityStyle(task.priority)} flex items-center justify-between`}>
                  <span className="text-[10px] font-extrabold uppercase tracking-widest">{task.priority} Priority</span>
                  {task.status === 'Completed' ? (
                    <CheckCircle2 size={16} className="text-green-600" />
                  ) : (
                    <Clock size={16} className={isOverdue ? 'text-red-600' : 'text-slate-400'} />
                  )}
                </div>

                <div className="p-5 flex-grow">
                  <div className="mb-3">
                    <span className="text-[10px] font-bold text-indigo-600 uppercase tracking-tight">{task.projectName || 'General Project'}</span>
                    <h3 className="text-lg font-bold text-slate-800 leading-tight">{task.taskName}</h3>
                  </div>

                  <div className="flex items-center text-slate-500 text-xs mb-4">
                    <Calendar size={12} className="mr-1" />
                    <span>Due: {format(new Date(task.dueDate), 'MMM dd, yyyy')}</span>
                    <span className="mx-2">•</span>
                    <span className={`font-bold ${isOverdue ? 'text-red-500' : 'text-indigo-500'}`}>
                      {task.status === 'Completed' ? 'Done' : isOverdue ? 'Overdue' : `${daysLeft} days left`}
                    </span>
                  </div>

                  {task.assignedTo?.length > 1 && (
                    <div className="mb-4">
                      <p className="text-[10px] font-bold text-slate-400 uppercase mb-2">Team:</p>
                      <div className="flex flex-wrap gap-1.5">
                        {task.assignedTo.map((teacher, idx) => (
                          <div key={idx} 
                            className={`flex items-center px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                              teacher._id === currentUser?._id 
                                ? 'bg-indigo-50 text-indigo-700 border-indigo-100' 
                                : 'bg-slate-50 text-slate-600 border-slate-100'
                            }`}
                            title={teacher.email}
                          >
                            {teacher._id === currentUser?._id ? 'You' : teacher.name}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {task.remarks && (
                    <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mb-4">
                      <div className="flex items-start text-xs text-slate-500 leading-relaxed italic">
                        <MessageSquare size={12} className="mr-1.5 mt-0.5 flex-shrink-0" />
                        <span>"{task.remarks}"</span>
                      </div>
                    </div>
                  )}

                  {task.status !== 'Completed' && (
                    <div className="mt-4">
                      <input 
                        type="text" 
                        placeholder="Add a remark (optional)..." 
                        className="w-full text-xs p-2 border border-slate-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-indigo-300 mb-2"
                        onChange={(e) => setRemarkInput(e.target.value)}
                        value={updatingId === task._id ? remarkInput : ''}
                      />
                      <div className="flex gap-2">
                        {task.status === 'Pending' ? (
                          <button 
                            onClick={() => updateStatus(task._id, 'In Progress')}
                            disabled={updatingId === task._id}
                            className="flex-1 bg-indigo-50 text-indigo-700 py-2 rounded-lg text-xs font-bold hover:bg-indigo-100 transition-colors"
                          >
                            Start Work
                          </button>
                        ) : (
                          <button 
                            onClick={() => updateStatus(task._id, 'Completed')}
                            disabled={updatingId === task._id}
                            className="flex-1 bg-green-50 text-green-700 py-2 rounded-lg text-xs font-bold hover:bg-green-100 transition-colors"
                          >
                            Mark Complete
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {task.status === 'Completed' && (
                    <div className="mt-2 text-center">
                      <div className="inline-flex items-center px-4 py-1.5 rounded-full bg-green-50 text-green-700 text-xs font-bold">
                        Task Completed {task.taskDoneDate && `on ${format(new Date(task.taskDoneDate), 'MMM dd')}`}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            );
          }) : (
            <div className="col-span-full py-20 text-center">
              <ClipboardList className="mx-auto w-12 h-12 text-slate-200 mb-4" />
              <p className="text-slate-400">No tasks found matching your filters</p>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default TeacherDashboard;
