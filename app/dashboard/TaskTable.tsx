"use client";

import { useState, useEffect } from "react";

interface Task {
  id: number;
  date: string;
  taskName: string;
  plan: string;
  result: string;
  userId: number;
}

interface DailyReport {
  id: number;
  date: string;
  submitted: boolean;
  submittedAt: string;
}

export default function TaskTable() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date();
    return today.toISOString().split("T")[0];
  });
  
  // New task form
  const [newTaskName, setNewTaskName] = useState("");
  const [newPlan, setNewPlan] = useState("");
  
  // Editing state
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingField, setEditingField] = useState<"plan" | "result" | null>(null);
  const [editValue, setEditValue] = useState("");
  
  // Report submission state
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Check if submission deadline has passed (24 hours after end of selected day)
  const isDeadlinePassed = () => {
    const selectedDateTime = new Date(selectedDate);
    selectedDateTime.setHours(23, 59, 59, 999);
    const deadline = new Date(selectedDateTime);
    deadline.setHours(deadline.getHours() + 24);
    return new Date() > deadline;
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const options: Intl.DateTimeFormatOptions = { 
      day: "numeric", 
      month: "short", 
      year: "numeric" 
    };
    return date.toLocaleDateString("en-US", options);
  };

  const fetchTasks = async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/tasks?date=${selectedDate}`);
      if (response.ok) {
        const data = await response.json();
        setTasks(data);
      }
    } catch (error) {
      console.error("Error fetching tasks:", error);
    } finally {
      setLoading(false);
    }
  };

  const checkReportStatus = async () => {
    try {
      const response = await fetch(`/api/reports?date=${selectedDate}`);
      if (response.ok) {
        const reports: DailyReport[] = await response.json();
        const submitted = reports.some(r => r.date === selectedDate && r.submitted);
        setIsSubmitted(submitted);
      }
    } catch (error) {
      console.error("Error checking report status:", error);
    }
  };

  useEffect(() => {
    fetchTasks();
    checkReportStatus();
  }, [selectedDate]);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskName.trim()) return;

    try {
      const response = await fetch("/api/tasks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: selectedDate,
          taskName: newTaskName,
          plan: newPlan,
        }),
      });

      if (response.ok) {
        setNewTaskName("");
        setNewPlan("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Error adding task:", error);
    }
  };

  const handleUpdateField = async (taskId: number) => {
    if (!editingField) return;
    
    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ [editingField]: editValue }),
      });

      if (response.ok) {
        setEditingId(null);
        setEditingField(null);
        setEditValue("");
        fetchTasks();
      }
    } catch (error) {
      console.error("Error updating task:", error);
    }
  };

  const handleDeleteTask = async (taskId: number) => {
    if (!confirm("Are you sure you want to delete this task?")) return;

    try {
      const response = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        fetchTasks();
      }
    } catch (error) {
      console.error("Error deleting task:", error);
    }
  };

  const startEdit = (task: Task, field: "plan" | "result") => {
    setEditingId(task.id);
    setEditingField(field);
    setEditValue(field === "plan" ? task.plan : task.result);
  };

  const handleSubmitReport = async () => {
    if (tasks.length === 0) {
      alert("No tasks to submit!");
      return;
    }
    
    const message = isSubmitted 
      ? "Are you sure you want to resubmit this report?" 
      : "Are you sure you want to submit this report to admin?";
    
    if (!confirm(message)) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ date: selectedDate }),
      });

      if (response.ok) {
        setIsSubmitted(true);
        alert(isSubmitted ? "Report resubmitted successfully!" : "Report submitted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to submit report");
      }
    } catch (error) {
      console.error("Error submitting report:", error);
      alert("Failed to submit report");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteReport = async () => {
    if (!confirm("Are you sure you want to delete this submission? This will withdraw your report from admin review.")) {
      return;
    }

    setSubmitting(true);
    try {
      const response = await fetch(`/api/reports?date=${selectedDate}`, {
        method: "DELETE",
      });

      if (response.ok) {
        setIsSubmitted(false);
        alert("Submission deleted successfully!");
      } else {
        const error = await response.json();
        alert(error.error || "Failed to delete submission");
      }
    } catch (error) {
      console.error("Error deleting report:", error);
      alert("Failed to delete submission");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-2xl overflow-hidden">
      {/* Header with date */}
      <div className="bg-green-500 text-white p-4">
        <div className="flex items-center justify-center gap-4">
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="bg-white text-green-700 px-4 py-2 rounded-lg font-semibold cursor-pointer"
          />
          <h2 className="text-2xl font-bold">{formatDate(selectedDate)}</h2>
        </div>
      </div>

      {/* Add new task form */}
      <form onSubmit={handleAddTask} className="p-4 bg-gray-50 border-b">
        <div className="flex gap-2">
          <input
            type="text"
            value={newTaskName}
            onChange={(e) => setNewTaskName(e.target.value)}
            placeholder="Enter task name..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-800"
            required
          />
          <input
            type="text"
            value={newPlan}
            onChange={(e) => setNewPlan(e.target.value)}
            placeholder="Plan"
            className="w-20 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 outline-none text-gray-800 text-center"
          />
          <button
            type="submit"
            className="bg-green-500 text-white px-6 py-2 rounded-lg font-semibold hover:bg-green-600 transition"
          >
            + Add
          </button>
        </div>
      </form>

      {/* Task table */}
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="bg-green-500 text-white">
              <th className="py-3 px-4 text-center w-12">✓</th>
              <th className="py-3 px-4 text-left">Task</th>
              <th className="py-3 px-4 text-center w-24">Plan</th>
              <th className="py-3 px-4 text-center w-24">Result</th>
              <th className="py-3 px-4 text-center w-24">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  Loading...
                </td>
              </tr>
            ) : tasks.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-8 text-gray-500">
                  No tasks for this date. Add your first task above!
                </td>
              </tr>
            ) : (
              tasks.map((task, index) => (
                <tr
                  key={task.id}
                  className={`border-b border-gray-100 ${
                    index % 2 === 0 ? "bg-white" : "bg-gray-50"
                  } hover:bg-green-50`}
                >
                  <td className="py-3 px-4 text-center text-gray-600">
                    {index + 1}
                  </td>
                  <td className="py-3 px-4 text-gray-800">{task.taskName}</td>
                  <td className="py-3 px-4 text-center">
                    {editingId === task.id && editingField === "plan" ? (
                      <div className="flex gap-1 justify-center">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateField(task.id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingField(null);
                            }
                          }}
                          className="w-20 px-2 py-1 border border-green-300 rounded text-center text-gray-800"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateField(task.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(task, "plan")}
                        className="cursor-pointer hover:bg-green-100 px-2 py-1 rounded min-w-[36px] text-gray-800 font-medium bg-gray-50 border border-gray-200 text-sm"
                      >
                        {task.plan || "0"}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    {editingId === task.id && editingField === "result" ? (
                      <div className="flex gap-1 justify-center">
                        <input
                          type="text"
                          value={editValue}
                          onChange={(e) => setEditValue(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleUpdateField(task.id);
                            if (e.key === "Escape") {
                              setEditingId(null);
                              setEditingField(null);
                            }
                          }}
                          className="w-20 px-2 py-1 border border-green-300 rounded text-center text-gray-800"
                          autoFocus
                        />
                        <button
                          onClick={() => handleUpdateField(task.id)}
                          className="bg-green-500 text-white px-2 py-1 rounded text-sm"
                        >
                          ✓
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => startEdit(task, "result")}
                        className="cursor-pointer hover:bg-green-100 px-2 py-1 rounded min-w-[36px] text-gray-800 bg-gray-50 border border-gray-200 text-sm"
                      >
                        {task.result || "0"}
                      </button>
                    )}
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => handleDeleteTask(task.id)}
                      className="text-red-500 hover:text-red-700 font-medium text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Submit Report Button */}
      <div className="p-4 bg-gray-50 border-t flex justify-between items-center">
        {/* Deadline Status */}
        <div className="text-sm">
          {isDeadlinePassed() ? (
            <span className="text-red-600 flex items-center gap-1">
              <span>⏰</span> Submission deadline passed
            </span>
          ) : (
            <span className="text-gray-500">
              Submit within 24 hours of report date
            </span>
          )}
        </div>
        
        <div className="flex gap-3">
          {isSubmitted && !isDeadlinePassed() && (
            <button
              onClick={handleDeleteReport}
              disabled={submitting}
              className="px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 bg-red-500 text-white hover:bg-red-600"
            >
              {submitting ? (
                <>
                  <span className="animate-spin">⏳</span>
                  Deleting...
                </>
              ) : (
                <>
                  <span>🗑️</span>
                  Delete Submission
                </>
              )}
            </button>
          )}
          <button
            onClick={handleSubmitReport}
            disabled={submitting || tasks.length === 0 || isDeadlinePassed()}
            className={`px-6 py-3 rounded-lg font-semibold transition flex items-center gap-2 ${
              tasks.length === 0 || isDeadlinePassed()
                ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                : isSubmitted
                ? "bg-green-600 text-white hover:bg-green-700"
                : "bg-blue-500 text-white hover:bg-blue-600"
            }`}
          >
            {submitting ? (
              <>
                <span className="animate-spin">⏳</span>
                Submitting...
              </>
            ) : isDeadlinePassed() ? (
              <>
                <span>🚫</span>
                Deadline Passed
              </>
            ) : isSubmitted ? (
              <>
                <span>✓</span>
                Resubmit Report
              </>
            ) : (
              <>
                <span>📤</span>
                Submit Report to Admin
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
