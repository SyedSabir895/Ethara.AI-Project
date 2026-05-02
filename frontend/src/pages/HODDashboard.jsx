import React, { useState, useEffect } from "react";
import api from "../services/api";
import Navbar from "../components/Navbar";
import Select from "react-select";
import {
  Plus,
  Search,
  Filter,
  ChevronDown,
  FileSpreadsheet,
  Users,
  CheckCircle2,
  Clock,
  AlertTriangle,
  ArrowUpRight,
  Trash2,
  Edit,
  Database,
} from "lucide-react";
import {
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import * as XLSX from "xlsx";
import { format, differenceInDays } from "date-fns";

const HODDashboard = () => {
  const [tasks, setTasks] = useState([]);
  const [teachers, setTeachers] = useState([]);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [showTeacherModal, setShowTeacherModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterPriority, setFilterPriority] = useState("All");
  const [filterStatus, setFilterStatus] = useState("All");
  const [filterProject, setFilterProject] = useState("All");

  // Form State
  const [formData, setFormData] = useState({
    projectName: "",
    taskName: "",
    priority: "Low",
    assignedTo: [],
    daysToComplete: 1,
    remarks: "",
  });

  const [teacherFormData, setTeacherFormData] = useState({
    name: "",
    email: "",
    password: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [tasksRes, teachersRes, analyticsRes] = await Promise.all([
        api.get("/tasks"),
        api.get("/users"),
        api.get("/tasks/analytics"),
      ]);
      setTasks(tasksRes.data);
      setTeachers(teachersRes.data);
      console.log("Teachers loaded:", teachersRes.data);
      setAnalytics(analyticsRes.data);
    } catch (err) {
      console.error("Error fetching data:", {
        message: err.message,
        response: err.response?.data,
        status: err.response?.status,
        url: err.config?.url,
      });
      // 401 errors are now handled by the API response interceptor
      // which will auto-redirect to login page
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTask = async (e) => {
    e.preventDefault();
    try {
      await api.post("/tasks", formData);
      setShowModal(false);
      setFormData({
        projectName: "",
        taskName: "",
        priority: "Low",
        assignedTo: [],
        daysToComplete: 1,
        remarks: "",
      });
      fetchData();
    } catch (err) {
      alert(
        "Error creating task: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleAddTeacher = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/users", teacherFormData);
      setShowTeacherModal(false);
      setTeacherFormData({ name: "", email: "" });
      
      // Show feedback about email status
      if (res.data.emailSent) {
        alert(`✓ Teacher added successfully!\n\nCredentials email sent to ${teacherFormData.email}`);
      } else {
        alert(
          `⚠️ Teacher added successfully!\n\nBut credential email failed to send.\nError: ${res.data.emailError}\n\nYou may need to send credentials manually or check SMTP configuration.`
        );
      }
      
      fetchData();
    } catch (err) {
      alert(
        "Error adding teacher: " + (err.response?.data?.message || err.message),
      );
    }
  };

  const handleDeleteTask = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchData();
      } catch (err) {
        alert("Error deleting task");
      }
    }
  };

  const exportToExcel = () => {
    const exportData = tasks.map((t) => ({
      Project: t.projectName || "General",
      "Task Name": t.taskName,
      Priority: t.priority,
      "Assigned Teachers": t.assignedTo?.map((a) => a.name).join(", "),
      Emails: t.assignedTo?.map((a) => a.email).join(", "),
      "Assigned Date": format(new Date(t.assignedDate), "yyyy-MM-dd"),
      "Due Date": format(new Date(t.dueDate), "yyyy-MM-dd"),
      Status: t.status,
      "Completed Date": t.taskDoneDate
        ? format(new Date(t.taskDoneDate), "yyyy-MM-dd")
        : "N/A",
      Remarks: t.remarks || "",
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tasks");
    XLSX.writeFile(wb, `Task_Report_${format(new Date(), "yyyy-MM-dd")}.xlsx`);
  };

  const filteredTasks = tasks.filter((task) => {
    const matchesSearch =
      task.taskName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      task.assignedTo?.some((t) =>
        t.name.toLowerCase().includes(searchTerm.toLowerCase()),
      ) ||
      (task.projectName &&
        task.projectName.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesPriority =
      filterPriority === "All" || task.priority === filterPriority;
    const matchesStatus =
      filterStatus === "All" || task.status === filterStatus;
    const matchesProject =
      filterProject === "All" || task.projectName === filterProject;
    return matchesSearch && matchesPriority && matchesStatus && matchesProject;
  });

  const uniqueProjects = [
    "All",
    ...new Set(tasks.map((t) => t.projectName).filter((p) => p)),
  ];

  const PRIORITY_COLORS = {
    Immediate: "#dc2626",
    High: "#f97316",
    Medium: "#3b82f6",
    Low: "#94a3b8",
  };

  const pieData =
    analytics?.tasksByPriority.map((item) => ({
      name: item._id,
      value: item.count,
    })) || [];

    
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar title="Admin Dashboard" />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Analytics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <StatCard
            title="Total Tasks"
            value={analytics?.totalTasks || 0}
            icon={<Database className="text-indigo-600" />}
            // color="bg-indigo-50"
          />
          <StatCard
            title="Completed"
            value={analytics?.completedTasks || 0}
            icon={<CheckCircle2 className="text-green-600" />}
            // color="bg-green-50"
          />
          <StatCard
            title="Overdue"
            value={analytics?.overdueTasks || 0}
            icon={<AlertTriangle className="text-red-600" />}
            // color="bg-red-50"
          />
          <StatCard
            title="Teachers"
            value={teachers.length}
            icon={<Users className="text-blue-600" />}
            // color="bg-blue-50"
          />
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Plus className="mr-2 text-indigo-600 w-5 h-5 bg-indigo-50 rounded-md p-0.5" />
              Priority Distribution
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {pieData.map((entry, index) => (
                      <Cell
                        key={`cell-${index}`}
                        fill={PRIORITY_COLORS[entry.name]}
                      />
                    ))}
                  </Pie>
                  <Tooltip />
                  <Legend />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
            <h3 className="text-lg font-bold text-slate-800 mb-6 flex items-center">
              <Clock className="mr-2 text-blue-600 w-5 h-5 bg-blue-50 rounded-md p-0.5" />
              Completion Trend (Last 7 Days)
            </h3>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={analytics?.completionTrend || []}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="_id"
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis
                    stroke="#64748b"
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip />
                  <Line
                    type="monotone"
                    dataKey="count"
                    stroke="#4f46e5"
                    strokeWidth={3}
                    dot={{ r: 4, fill: "#4f46e5" }}
                    activeDot={{ r: 6 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Task Table Section */}
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
          <div className="p-6 border-b border-slate-200 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-center space-x-2">
              <h3 className="text-xl font-bold text-slate-800">
                Department Tasks
              </h3>
              {/* <span className="bg-slate-100 text-slate-600 text-xs px-2.5 py-1 rounded-full font-bold">
                Excel View
              </span> */}
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search tasks..."
                  className="pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full md:w-64"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              <select
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={filterPriority}
                onChange={(e) => setFilterPriority(e.target.value)}
              >
                <option value="All">All Priorities</option>
                <option value="Immediate">Immediate</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>

              <select
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={filterProject}
                onChange={(e) => setFilterProject(e.target.value)}
              >
                {uniqueProjects.map((p) => (
                  <option key={p} value={p}>
                    {p === "All" ? "All Projects" : p}
                  </option>
                ))}
              </select>

              <select
                className="px-4 py-2 border border-slate-200 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                value={filterStatus}
                onChange={(e) => setFilterStatus(e.target.value)}
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Done">Done</option>
              </select>

              <button
                onClick={exportToExcel}
                className="flex items-center px-4 py-2 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-colors"
              >
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Export
              </button>

              <button
                onClick={() => setShowTeacherModal(true)}
                className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-bold hover:bg-blue-700 transition-all transform active:scale-95 shadow-lg shadow-blue-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                Add Teacher
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="flex items-center px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all transform active:scale-95 shadow-lg shadow-indigo-200"
              >
                <Plus className="w-4 h-4 mr-2" />
                New Task
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="excel-table">
              <thead>
                <tr>
                  <th className="excel-th">Task Details</th>
                  <th className="excel-th">Priority</th>
                  <th className="excel-th w-48">Assigned To</th>
                  <th className="excel-th">Due Date</th>
                  <th className="excel-th">Days Left</th>
                  <th className="excel-th">Status</th>
                  <th className="excel-th">Timeline</th>
                  <th className="excel-th">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-slate-200">
                {filteredTasks.length > 0 ? (
                  filteredTasks.map((task) => {
                    const daysLeft = differenceInDays(
                      new Date(task.dueDate),
                      new Date(),
                    );
                    const isOverdue =
                      daysLeft < 0 && task.status !== "Completed";
                    const nearDeadline =
                      daysLeft >= 0 &&
                      daysLeft <= 2 &&
                      task.status !== "Completed";

                    return (
                      <tr
                        key={task._id}
                        className="hover:bg-slate-50/50 transition-colors"
                      >
                        <td
                          className={`excel-td font-medium priority-${task.priority.toLowerCase()}`}
                        >
                          <div className="flex flex-col">
                            <span className="text-[10px] font-bold text-indigo-600 uppercase mb-1">
                              {task.projectName || "General"}
                            </span>
                            <span className="text-slate-800">
                              {task.taskName}
                            </span>
                            {/* <span className="text-[10px] text-slate-400 mt-1 uppercase tracking-tight">
                              ID: {task._id.slice(-6)}
                            </span> */}
                          </div>
                        </td>
                        <td className="excel-td">
                          <span
                            className={`px-2 py-1 rounded text-[10px] font-extrabold uppercase shadow-sm border`}
                            style={{
                              borderColor: PRIORITY_COLORS[task.priority],
                              color: PRIORITY_COLORS[task.priority],
                            }}
                          >
                            {task.priority}
                          </span>
                        </td>
                        <td className="excel-td">
                          <div className="flex flex-col space-y-1">
                            {task.assignedTo?.length > 0 ? (
                              task.assignedTo.map((teacher, idx) => (
                                <span
                                  key={idx}
                                  className="text-sm font-medium text-slate-700 bg-slate-100 px-2 py-1 rounded-md inline-block"
                                >
                                  {teacher.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-slate-400 text-xs">
                                Unassigned
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="excel-td">
                          <span className="text-xs">
                            {format(new Date(task.dueDate), "MMM dd, yyyy")}
                          </span>
                        </td>
                        <td className="excel-td">
                          <span
                            className={`text-xs font-bold ${isOverdue ? "text-red-500 animate-pulse" : nearDeadline ? "text-orange-500" : "text-slate-500"}`}
                          >
                            {task.status === "Completed"
                              ? "-"
                              : isOverdue
                                ? `${Math.abs(daysLeft)} days overdue`
                                : `${daysLeft} days left`}
                          </span>
                        </td>
                        <td className="excel-td">
                          <span
                            className={`status-badge border ${
                              task.status === "Completed"
                                ? "status-completed border-green-200"
                                : task.status === "In Progress"
                                  ? "status-progress border-blue-200"
                                  : "status-pending border-yellow-200"
                            }`}
                          >
                            {task.status}
                          </span>
                        </td>
                        <td className="excel-td">
                          <div className="w-24 bg-slate-100 h-1.5 rounded-full overflow-hidden">
                            <div
                              className={`h-full rounded-full ${isOverdue ? "bg-red-500" : task.status === "Completed" ? "bg-green-500" : "bg-indigo-500"}`}
                              style={{
                                width:
                                  task.status === "Completed"
                                    ? "100%"
                                    : task.status === "In Progress"
                                      ? "50%"
                                      : "10%",
                              }}
                            ></div>
                          </div>
                        </td>
                        <td className="excel-td">
                          <button
                            onClick={() => handleDeleteTask(task._id)}
                            className="p-1.5 text-slate-400 hover:text-red-500 hover:bg-red-50 rounded-md transition-all"
                          >
                            <Trash2 size={16} />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td
                      colSpan="8"
                      className="px-6 py-12 text-center text-slate-400 text-sm"
                    >
                      No tasks found. Click "New Task" to get started.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>

      {/* Create Task Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-indigo-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Create New Task
                </h3>
                <button
                  onClick={() => setShowModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleCreateTask} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
                    placeholder="e.g., Exam Management"
                    value={formData.projectName}
                    onChange={(e) =>
                      setFormData({ ...formData, projectName: e.target.value })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Task Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
                    placeholder="Enter task description"
                    value={formData.taskName}
                    onChange={(e) =>
                      setFormData({ ...formData, taskName: e.target.value })
                    }
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Priority
                    </label>
                    <select
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm bg-white"
                      value={formData.priority}
                      onChange={(e) =>
                        setFormData({ ...formData, priority: e.target.value })
                      }
                    >
                      <option value="Low">Low</option>
                      <option value="Medium">Medium</option>
                      <option value="High">High</option>
                      <option value="Immediate">Immediate</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1">
                      Days to Complete
                    </label>
                    <input
                      type="number"
                      min="1"
                      required
                      className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm"
                      value={formData.daysToComplete}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          daysToComplete: parseInt(e.target.value),
                        })
                      }
                    />
                  </div>
                </div>

                <div>
                  {/* Assign To Teachers (Select multiple) */}
                  <Select
                    isMulti
                    options={teachers.map((t) => ({
                      value: t._id,
                      label: `${t.name} (${t.email})`,
                    }))}
                    value={teachers
                      .filter((t) => formData.assignedTo.includes(t._id))
                      .map((t) => ({
                        value: t._id,
                        label: `${t.name} (${t.email})`,
                      }))}
                    onChange={(selected) => {
                      const selectedIds = selected
                        ? selected.map((s) => s.value)
                        : [];
                      setFormData({ ...formData, assignedTo: selectedIds });
                    }}
                    placeholder="Select teachers..."
                    className="react-select-container"
                    classNamePrefix="react-select"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Initial Remarks (Optional)
                  </label>
                  <textarea
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:outline-none text-sm shadow-sm resize-none h-24"
                    placeholder="Enter special instructions..."
                    value={formData.remarks}
                    onChange={(e) =>
                      setFormData({ ...formData, remarks: e.target.value })
                    }
                  ></textarea>
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-indigo-600 text-white py-3 rounded-xl font-bold hover:bg-indigo-700 transition-all transform active:scale-95 shadow-lg shadow-indigo-200"
                  >
                    Assign Task
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Add Teacher Modal */}
      {showTeacherModal && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
            <div
              className="fixed inset-0 transition-opacity bg-slate-900/60 backdrop-blur-sm"
              onClick={() => setShowTeacherModal(false)}
            ></div>

            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">
              &#8203;
            </span>

            <div className="relative z-10 inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
              <div className="bg-blue-600 px-6 py-4 flex justify-between items-center">
                <h3 className="text-lg font-bold text-white">
                  Add New Teacher
                </h3>
                <button
                  onClick={() => setShowTeacherModal(false)}
                  className="text-white/80 hover:text-white"
                >
                  <Plus className="rotate-45" size={24} />
                </button>
              </div>

              <form onSubmit={handleAddTeacher} className="p-6 space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-sm"
                    placeholder="Enter teacher's name"
                    value={teacherFormData.name}
                    onChange={(e) =>
                      setTeacherFormData({
                        ...teacherFormData,
                        name: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Email Address
                  </label>
                  <input
                    type="email"
                    required
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-sm"
                    placeholder="teacher@college.edu"
                    value={teacherFormData.email}
                    onChange={(e) =>
                      setTeacherFormData({
                        ...teacherFormData,
                        email: e.target.value,
                      })
                    }
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1">
                    Password (optional)
                  </label>
                  <input
                    type="text"
                    className="w-full px-4 py-2.5 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:outline-none text-sm shadow-sm"
                    placeholder="Optional - leave blank to generate"
                    value={teacherFormData.password}
                    onChange={(e) =>
                      setTeacherFormData({
                        ...teacherFormData,
                        password: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="pt-4">
                  <button
                    type="submit"
                    className="w-full bg-blue-600 text-white py-3 rounded-xl font-bold hover:bg-blue-700 transition-all transform active:scale-95 shadow-lg shadow-blue-200"
                  >
                    Add Teacher
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => (
  <div
    className={`bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex items-center justify-between`}
  >
    <div>
      <p className="text-slate-500 text-xs font-bold uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-extrabold text-slate-800">{value}</p>
    </div>
    <div className={`p-3 rounded-xl ${color}`}>
      {React.cloneElement(icon, { size: 24 })}
    </div>
  </div>
);

export default HODDashboard;
