"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import TaskTable from "./TaskTable";

interface StaffUser {
  id: number;
  username: string;
  role: string;
  position: string | null;
  createdAt: string;
}

interface Task {
  id: number;
  taskName: string;
  plan: string;
  result: string;
}

interface SubmittedReport {
  id: number;
  date: string;
  submitted: boolean;
  submittedAt: string;
  user: {
    id: number;
    username: string;
    position: string | null;
  };
  tasks: Task[];
}

const POSITIONS = [
  { value: "project_manager", label: "Project Manager" },
  { value: "media_buyer", label: "Media Buyer" },
  { value: "graphic_design", label: "Graphic Design" },
];

const getPositionLabel = (position: string | null) => {
  if (!position) return "-";
  const found = POSITIONS.find(p => p.value === position);
  return found ? found.label : position;
};

const getPositionColor = (position: string | null) => {
  switch (position) {
    case "project_manager":
      return "bg-purple-100 text-purple-700";
    case "media_buyer":
      return "bg-green-100 text-green-700";
    case "graphic_design":
      return "bg-pink-100 text-pink-700";
    default:
      return "bg-gray-100 text-gray-700";
  }
};

interface DashboardClientProps {
  username: string;
  role: string;
  position: string | null;
  displayNumber: number;
}

export default function DashboardClient({
  username,
  role,
  position,
  displayNumber,
}: DashboardClientProps) {
  const router = useRouter();
  const [staffList, setStaffList] = useState<StaffUser[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  
  // Form states
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingStaff, setEditingStaff] = useState<StaffUser | null>(null);
  const [formUsername, setFormUsername] = useState("");
  const [formPassword, setFormPassword] = useState("");
  const [formPosition, setFormPosition] = useState("");
  
  // Reports state
  const [reports, setReports] = useState<SubmittedReport[]>([]);
  const [reportsLoading, setReportsLoading] = useState(false);
  const [expandedReport, setExpandedReport] = useState<number | null>(null);
  const [selectedReportDate, setSelectedReportDate] = useState<string | null>(null);
  
  // Tab state for admin
  const [activeTab, setActiveTab] = useState<"staff" | "reports">("staff");

  const isAdmin = role === "admin";

  // Group reports by date
  const reportsByDate = reports.reduce((acc, report) => {
    const dateKey = new Date(report.date).toISOString().split("T")[0];
    if (!acc[dateKey]) {
      acc[dateKey] = [];
    }
    acc[dateKey].push(report);
    return acc;
  }, {} as Record<string, SubmittedReport[]>);

  // Sort dates in descending order
  const sortedDates = Object.keys(reportsByDate).sort((a, b) => 
    new Date(b).getTime() - new Date(a).getTime()
  );

  // Fetch staff list
  const fetchStaff = async () => {
    if (!isAdmin) return;
    
    setLoading(true);
    try {
      const response = await fetch("/api/staff");
      if (response.ok) {
        const data = await response.json();
        setStaffList(data);
      }
    } catch {
      setError("Failed to fetch staff list");
    } finally {
      setLoading(false);
    }
  };

  // Fetch submitted reports
  const fetchReports = async () => {
    if (!isAdmin) return;
    
    setReportsLoading(true);
    try {
      const response = await fetch("/api/reports");
      if (response.ok) {
        const data = await response.json();
        setReports(data);
      }
    } catch {
      console.error("Failed to fetch reports");
    } finally {
      setReportsLoading(false);
    }
  };

  useEffect(() => {
    fetchStaff();
    fetchReports();
  }, [isAdmin]);

  const handleLogout = async () => {
    await fetch("/api/logout", { method: "POST" });
    router.push("/login");
    router.refresh();
  };

  const resetForm = () => {
    setFormUsername("");
    setFormPassword("");
    setFormPosition("");
    setShowCreateForm(false);
    setEditingStaff(null);
    setError("");
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");

    try {
      const response = await fetch("/api/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: formUsername, password: formPassword, position: formPosition }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create staff");
        return;
      }

      setSuccess("Staff created successfully!");
      resetForm();
      fetchStaff();
    } catch {
      setError("An error occurred");
    }
  };

  const handleUpdateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingStaff) return;
    
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/staff/${editingStaff.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          username: formUsername, 
          password: formPassword || undefined,
          position: formPosition
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update staff");
        return;
      }

      setSuccess("Staff updated successfully!");
      resetForm();
      fetchStaff();
    } catch {
      setError("An error occurred");
    }
  };

  const handleDeleteStaff = async (staffId: number) => {
    if (!confirm("Are you sure you want to delete this staff member?")) return;
    
    setError("");
    setSuccess("");

    try {
      const response = await fetch(`/api/staff/${staffId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        setError(data.error || "Failed to delete staff");
        return;
      }

      setSuccess("Staff deleted successfully!");
      fetchStaff();
    } catch {
      setError("An error occurred");
    }
  };

  const startEdit = (staff: StaffUser) => {
    setEditingStaff(staff);
    setFormUsername(staff.username);
    setFormPassword("");
    setFormPosition(staff.position || "");
    setShowCreateForm(false);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 py-6 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Logo Header */}
        <div className="flex justify-center mb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center shadow-lg shadow-teal-700/30">
              <span className="text-xl font-bold bg-gradient-to-br from-teal-500 to-emerald-600 bg-clip-text text-transparent">A</span>
            </div>
            <span className="text-2xl font-bold text-white drop-shadow-lg tracking-wide">
              Advertising
            </span>
          </div>
        </div>

        {/* Header Card - Compact Design */}
        <div className="bg-white/95 backdrop-blur-sm p-4 rounded-2xl shadow-xl shadow-black/10 mb-4">
          <div className="flex items-center justify-between">
            {/* Left: Profile Info */}
            <div className="flex items-center gap-4">
              {/* Profile Picture */}
              <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-purple-500/30">
                <span className="text-xl font-bold text-white">
                  {username.charAt(0).toUpperCase()}
                </span>
              </div>
              
              {/* Name & Role */}
              <div>
                <h1 className="text-xl font-bold text-gray-800">
                  {username}
                </h1>
                <span className={`inline-block mt-1 px-3 py-0.5 rounded-full text-xs font-semibold ${
                  role === "admin" 
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white" 
                    : getPositionColor(position)
                }`}>
                  {role === "admin" ? "Administrator" : getPositionLabel(position)}
                </span>
              </div>
            </div>

            {/* Right: Logout Button */}
            <button
              onClick={handleLogout}
              className="bg-gradient-to-r from-red-500 to-rose-500 text-white px-5 py-2 rounded-xl font-semibold hover:from-red-600 hover:to-rose-600 transition-all shadow-lg shadow-red-500/25 hover:shadow-red-500/40 flex items-center gap-2"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              Logout
            </button>
          </div>
        </div>

        {/* Admin Tab Navigation */}
        {isAdmin && (
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl shadow-xl shadow-black/10 mb-4 overflow-hidden">
            <div className="flex">
              <button
                onClick={() => setActiveTab("staff")}
                className={`flex-1 py-3 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "staff"
                    ? "bg-gradient-to-r from-blue-500 to-indigo-500 text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <span>👥</span> Staff Management
              </button>
              <button
                onClick={() => setActiveTab("reports")}
                className={`flex-1 py-3 px-6 font-semibold transition-all flex items-center justify-center gap-2 ${
                  activeTab === "reports"
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-white shadow-lg"
                    : "bg-transparent text-gray-500 hover:bg-gray-50 hover:text-gray-700"
                }`}
              >
                <span>📋</span> Submitted Reports
                {reports.length > 0 && (
                  <span className="bg-gradient-to-r from-red-500 to-rose-500 text-white text-xs px-2 py-0.5 rounded-full font-bold shadow-sm">
                    {reports.length}
                  </span>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Admin Staff Management Panel */}
        {isAdmin && activeTab === "staff" && (
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl shadow-black/10">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                <span className="w-8 h-8 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center text-white text-sm">👥</span>
                Staff Management
              </h2>
              
              {/* Create Button - Moved to header */}
              {!showCreateForm && !editingStaff && (
                <button
                  onClick={() => setShowCreateForm(true)}
                  className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white px-4 py-2 rounded-xl font-semibold hover:from-blue-600 hover:to-indigo-600 transition-all shadow-lg shadow-blue-500/25 flex items-center gap-2 text-sm"
                >
                  <span>+</span> Add Staff
                </button>
              )}
            </div>

            {/* Messages */}
            {error && (
              <div className="bg-red-50 text-red-600 p-3 rounded-lg mb-4">
                {error}
              </div>
            )}
            {success && (
              <div className="bg-green-50 text-green-600 p-3 rounded-lg mb-4">
                {success}
              </div>
            )}

            {/* Create/Edit Form */}
            {(showCreateForm || editingStaff) && (
              <form
                onSubmit={editingStaff ? handleUpdateStaff : handleCreateStaff}
                className="bg-gradient-to-br from-gray-50 to-blue-50 p-5 rounded-xl mb-6 border border-blue-100"
              >
                <h3 className="text-base font-semibold text-gray-800 mb-4 flex items-center gap-2">
                  <span>{editingStaff ? "✏️" : "➕"}</span>
                  {editingStaff ? "Edit Staff" : "Create New Staff"}
                </h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Username
                    </label>
                    <input
                      type="text"
                      value={formUsername}
                      onChange={(e) => setFormUsername(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Password {editingStaff && "(leave blank to keep current)"}
                    </label>
                    <input
                      type="password"
                      value={formPassword}
                      onChange={(e) => setFormPassword(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      required={!editingStaff}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Position
                    </label>
                    <select
                      value={formPosition}
                      onChange={(e) => setFormPosition(e.target.value)}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none text-gray-800"
                      required
                    >
                      <option value="">Select Position</option>
                      {POSITIONS.map((pos) => (
                        <option key={pos.value} value={pos.value}>
                          {pos.label}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="flex gap-3 mt-4">
                  <button
                    type="submit"
                    className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-5 py-2 rounded-lg font-semibold hover:from-emerald-600 hover:to-teal-600 transition-all shadow-md"
                  >
                    {editingStaff ? "✓ Update" : "✓ Create"}
                  </button>
                  <button
                    type="button"
                    onClick={resetForm}
                    className="bg-gray-200 text-gray-700 px-5 py-2 rounded-lg font-semibold hover:bg-gray-300 transition"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}

            {/* Staff List */}
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="w-full">
                <thead>
                  <tr className="bg-gradient-to-r from-gray-50 to-gray-100 border-b border-gray-200">
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">#</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Username</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Position</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Created</th>
                    <th className="text-left py-3 px-4 text-gray-600 font-semibold text-sm">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        Loading...
                      </td>
                    </tr>
                  ) : staffList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center py-8 text-gray-500">
                        No staff members found
                      </td>
                    </tr>
                  ) : (
                    staffList.map((staff, idx) => (
                      <tr key={staff.id} className={`border-b border-gray-100 hover:bg-blue-50/50 transition ${idx % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}>
                        <td className="py-3 px-4 text-gray-500 text-sm">{staff.id}</td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                              <span className="text-white font-bold text-xs">{staff.username.charAt(0).toUpperCase()}</span>
                            </div>
                            <span className="text-gray-800 font-medium text-sm">{staff.username}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <span className={`px-2.5 py-1 rounded-lg text-xs font-semibold ${getPositionColor(staff.position)}`}>
                            {getPositionLabel(staff.position)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-gray-500 text-sm">
                          {new Date(staff.createdAt).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <button
                              onClick={() => startEdit(staff)}
                              className="bg-amber-100 text-amber-700 px-3 py-1.5 rounded-lg font-medium hover:bg-amber-200 transition text-xs flex items-center gap-1"
                            >
                              <span>✏️</span> Edit
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(staff.id)}
                              className="bg-red-100 text-red-600 px-3 py-1.5 rounded-lg font-medium hover:bg-red-200 transition text-xs flex items-center gap-1"
                            >
                              <span>🗑️</span> Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Submitted Reports Section - Admin Only */}
        {isAdmin && activeTab === "reports" && (
          <div className="bg-white/95 backdrop-blur-sm p-6 rounded-2xl shadow-xl shadow-black/10">
            <h2 className="text-xl font-bold text-gray-800 mb-6 flex items-center gap-2">
              <span className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-sm">📋</span>
              Submitted Reports
            </h2>

            {reportsLoading ? (
              <div className="text-center py-8 text-gray-400 flex flex-col items-center gap-2">
                <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin"></div>
                Loading reports...
              </div>
            ) : reports.length === 0 ? (
              <div className="text-center py-12 text-gray-400">
                <div className="text-4xl mb-2">📭</div>
                No reports submitted yet
              </div>
            ) : !selectedReportDate ? (
              /* Date List View */
              <div className="grid gap-2">
                {sortedDates.map((dateKey) => {
                  const dateReports = reportsByDate[dateKey];
                  const totalTasks = dateReports.reduce((sum, r) => sum + r.tasks.length, 0);
                  return (
                    <button
                      key={dateKey}
                      onClick={() => setSelectedReportDate(dateKey)}
                      className="flex items-center justify-between p-3 bg-gradient-to-r from-slate-50 to-blue-50 border border-gray-100 rounded-xl hover:shadow-md hover:border-blue-200 transition-all text-left group"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-indigo-500 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                          <span className="text-white text-sm">📅</span>
                        </div>
                        <div>
                          <div className="font-semibold text-gray-800 text-sm">
                            {new Date(dateKey).toLocaleDateString("en-US", {
                              weekday: "long",
                              day: "numeric",
                              month: "long",
                              year: "numeric",
                            })}
                          </div>
                          <div className="text-xs text-gray-500">
                            {dateReports.length} staff submitted
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-right">
                          <div className="text-emerald-600 font-semibold text-sm bg-emerald-50 px-2 py-1 rounded-lg">
                            ✓ {totalTasks} tasks
                          </div>
                        </div>
                        <span className="text-gray-300 group-hover:text-blue-500 transition-colors">→</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* Reports for Selected Date */
              <div>
                {/* Back Button */}
                <button
                  onClick={() => setSelectedReportDate(null)}
                  className="flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium text-sm mb-3 bg-blue-50 hover:bg-blue-100 px-3 py-1.5 rounded-lg transition-all"
                >
                  <span>←</span> Back to Dates
                </button>

                {/* Date Header */}
                <div className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 text-white px-4 py-3 rounded-xl mb-3 shadow-lg shadow-indigo-500/20">
                  <h3 className="text-base font-bold">
                    {new Date(selectedReportDate).toLocaleDateString("en-US", {
                      weekday: "long",
                      day: "numeric",
                      month: "long",
                      year: "numeric",
                    })}
                  </h3>
                  <p className="text-blue-100 text-xs">
                    {reportsByDate[selectedReportDate]?.length || 0} staff submitted reports
                  </p>
                </div>

                {/* Staff Reports */}
                <div className="space-y-2">
                  {reportsByDate[selectedReportDate]?.map((report) => (
                    <div
                      key={report.id}
                      className="border border-gray-100 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-all"
                    >
                      {/* Report Header */}
                      <div
                        onClick={() => setExpandedReport(expandedReport === report.id ? null : report.id)}
                        className="flex items-center justify-between px-3 py-2.5 bg-gradient-to-r from-gray-50 to-white cursor-pointer hover:from-blue-50 hover:to-white transition-all"
                      >
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span className="text-white font-bold text-sm">
                              {report.user.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                          <div>
                            <div className="font-semibold text-gray-800 text-sm">
                              {report.user.username}
                            </div>
                            <div className="text-xs text-gray-500">
                              {getPositionLabel(report.user.position)}
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-xs text-gray-500">
                            Submitted: {new Date(report.submittedAt).toLocaleTimeString()}
                          </div>
                          <div className="text-green-600 font-semibold text-sm flex items-center gap-1">
                            <span>✓</span>
                            <span>{report.tasks.length} tasks</span>
                          </div>
                          <span className="text-gray-400 text-sm">
                            {expandedReport === report.id ? "▲" : "▼"}
                          </span>
                        </div>
                      </div>

                      {/* Expanded Task Details */}
                      {expandedReport === report.id && (
                        <div className="p-3 border-t border-gray-100 bg-gradient-to-b from-white to-gray-50">
                          <table className="w-full text-sm rounded-lg overflow-hidden">
                            <thead>
                              <tr className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
                                <th className="py-2 px-3 text-left font-medium">#</th>
                                <th className="py-2 px-3 text-left font-medium">Task</th>
                                <th className="py-2 px-3 text-center font-medium">Plan</th>
                                <th className="py-2 px-3 text-center font-medium">Result</th>
                              </tr>
                            </thead>
                            <tbody>
                              {report.tasks.map((task, idx) => (
                                <tr
                                  key={task.id}
                                  className={`${idx % 2 === 0 ? "bg-white" : "bg-gray-50"} hover:bg-teal-50 transition`}
                                >
                                  <td className="py-1.5 px-3 text-gray-400 font-medium">{idx + 1}</td>
                                  <td className="py-1.5 px-3 text-gray-700">{task.taskName}</td>
                                  <td className="py-1.5 px-3 text-center">
                                    <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded font-medium">{task.plan || "0"}</span>
                                  </td>
                                  <td className="py-1.5 px-3 text-center">
                                    <span className="bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded font-medium">{task.result || "0"}</span>
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Staff Task Table */}
        {!isAdmin && (
          <TaskTable />
        )}
      </div>
    </div>
  );
}
