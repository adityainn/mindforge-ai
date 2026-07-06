"use client";

import React, { useState, useEffect } from "react";
import { 
  Plus, 
  Trash2, 
  Edit2, 
  Calendar, 
  Check, 
  Search, 
  X,
  Timer
} from "lucide-react";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/tasks.module.css";

interface Task {
  id: string;
  title: string;
  description: string | null;
  priority: string;
  category: string;
  dueDate: string | null;
  estPomodoros: number;
  actPomodoros: number;
  completed: boolean;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategoryFilter, setActiveCategoryFilter] = useState("All");

  // Form states
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [priority, setPriority] = useState("MEDIUM");
  const [category, setCategory] = useState("Study");
  const [dueDate, setDueDate] = useState("");
  const [estPomodoros, setEstPomodoros] = useState(1);
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);

  const categories = ["All", "Study", "Coding", "Writing", "Research", "Other"];

  const fetchTasks = async () => {
    try {
      const res = await fetch("/api/tasks");
      if (res.ok) {
        const data = await res.json();
        setTasks(data);
      }
    } catch (err) {
      console.error("Error fetching tasks:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    const payload = {
      title,
      description,
      priority,
      category,
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      estPomodoros,
    };

    try {
      let res;
      if (editingTaskId) {
        // Edit mode
        res = await fetch(`/api/tasks/${editingTaskId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // Create mode
        res = await fetch("/api/tasks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (res.ok) {
        resetForm();
        fetchTasks();
        // Trigger streak recalculation/refresh in sidebar
        window.dispatchEvent(new Event("refresh-streak"));
      }
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  const handleToggleComplete = async (task: Task) => {
    try {
      const res = await fetch(`/api/tasks/${task.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ completed: !task.completed }),
      });
      if (res.ok) {
        fetchTasks();
        window.dispatchEvent(new Event("refresh-streak"));
      }
    } catch (err) {
      console.error("Error toggling task completion:", err);
    }
  };

  const handleEdit = (task: Task) => {
    setEditingTaskId(task.id);
    setTitle(task.title);
    setDescription(task.description || "");
    setPriority(task.priority);
    setCategory(task.category);
    setDueDate(task.dueDate ? new Date(task.dueDate).toISOString().split("T")[0] : "");
    setEstPomodoros(task.estPomodoros);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this task?")) return;
    try {
      const res = await fetch(`/api/tasks/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        fetchTasks();
        window.dispatchEvent(new Event("refresh-streak"));
      }
    } catch (err) {
      console.error("Error deleting task:", err);
    }
  };

  const resetForm = () => {
    setEditingTaskId(null);
    setTitle("");
    setDescription("");
    setPriority("MEDIUM");
    setCategory("Study");
    setDueDate("");
    setEstPomodoros(1);
    setShowForm(false);
  };

  // Filter & Search logic
  const filteredTasks = tasks.filter((task) => {
    const matchesSearch = 
      task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesCategory = 
      activeCategoryFilter === "All" || task.category === activeCategoryFilter;

    return matchesSearch && matchesCategory;
  });

  const isOverdue = (dateStr: string | null) => {
    if (!dateStr) return false;
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return new Date(dateStr) < today;
  };

  return (
    <div>
      {/* Header */}
      <div className={styles.tasksHeader}>
        <div className={styles.titleSection}>
          <h1 className="textGradient">Task Manager</h1>
          <p>Organize, schedule, and estimate focus sessions for your study tasks.</p>
        </div>
        <button 
          className="btn-primary" 
          onClick={() => {
            if (showForm) resetForm();
            else setShowForm(true);
          }}
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? "Cancel" : "Add Task"}
        </button>
      </div>

      {/* Task Form (collapsible) */}
      {showForm && (
        <GlassCard className={styles.taskForm} hoverable={false}>
          <h3>{editingTaskId ? "Edit Task" : "Create New Task"}</h3>
          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div className={styles.formGroup}>
              <label>Task Title *</label>
              <input 
                type="text" 
                placeholder="e.g., Read Chapter 4 of Biology" 
                className={styles.inputField}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
              />
            </div>

            <div className={styles.formGroup}>
              <label>Description</label>
              <textarea 
                placeholder="Details, subtasks, or resource links..." 
                className={styles.textareaField}
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
              />
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Category</label>
                <select 
                  className={styles.selectField}
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                >
                  <option value="Study">Study</option>
                  <option value="Coding">Coding</option>
                  <option value="Writing">Writing</option>
                  <option value="Research">Research</option>
                  <option value="Other">Other</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Priority</label>
                <select 
                  className={styles.selectField}
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                </select>
              </div>

              <div className={styles.formGroup}>
                <label>Est. Pomodoros</label>
                <input 
                  type="number" 
                  min={1} 
                  max={20}
                  className={styles.inputField}
                  value={estPomodoros}
                  onChange={(e) => setEstPomodoros(parseInt(e.target.value) || 1)}
                />
              </div>
            </div>

            <div className={styles.formGrid}>
              <div className={styles.formGroup}>
                <label>Due Date</label>
                <input 
                  type="date" 
                  className={styles.inputField}
                  value={dueDate}
                  onChange={(e) => setDueDate(e.target.value)}
                />
              </div>
            </div>

            <div className={styles.formActions}>
              <button type="button" className="btn-secondary" onClick={resetForm}>Cancel</button>
              <button type="submit" className="btn-primary">
                {editingTaskId ? "Save Changes" : "Create Task"}
              </button>
            </div>
          </form>
        </GlassCard>
      )}

      {/* Filters and Search */}
      <div className={styles.filterControls}>
        <div className={styles.categoryFilters}>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`${styles.filterTab} ${activeCategoryFilter === cat ? styles.filterTabActive : ""}`}
              onClick={() => setActiveCategoryFilter(cat)}
            >
              {cat}
            </button>
          ))}
        </div>

        <div className={styles.searchBar}>
          <Search size={18} style={{ color: "var(--text-muted)" }} />
          <input 
            type="text" 
            placeholder="Search tasks..." 
            className={styles.searchInput}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Task List */}
      <div className={styles.taskList}>
        {loading ? (
          <div className="shimmer" style={{ height: "100px", borderRadius: "16px" }} />
        ) : filteredTasks.length === 0 ? (
          <GlassCard className={styles.noTasks} hoverable={false}>
            No tasks found. Create one to kickstart your study sessions! 🚀
          </GlassCard>
        ) : (
          filteredTasks.map((task) => (
            <GlassCard 
              key={task.id} 
              className={`${styles.taskItem} ${task.completed ? styles.taskItemCompleted : ""}`}
              hoverable={false}
            >
              {/* Checkbox */}
              <div className={styles.checkboxContainer}>
                <div 
                  className={`${styles.checkbox} ${task.completed ? styles.checkboxChecked : ""}`}
                  onClick={() => handleToggleComplete(task)}
                >
                  {task.completed && <Check size={14} strokeWidth={3} />}
                </div>
              </div>

              {/* Content */}
              <div className={styles.taskContent}>
                <h4 className={`${styles.taskTitle} ${task.completed ? styles.taskTitleCompleted : ""}`}>
                  {task.title}
                </h4>
                {task.description && (
                  <p className={styles.taskDesc}>{task.description}</p>
                )}
                
                {/* Meta details */}
                <div className={styles.taskMeta}>
                  {/* Priority */}
                  <span className={`${styles.badge} ${
                    task.priority === "HIGH" ? styles.priorityHigh :
                    task.priority === "MEDIUM" ? styles.priorityMedium : styles.priorityLow
                  }`}>
                    {task.priority}
                  </span>

                  {/* Category */}
                  <span className={`${styles.badge} ${styles.categoryTag}`}>
                    {task.category}
                  </span>

                  {/* Estimated Pomodoro count */}
                  <span className={styles.pomodoroEstimate}>
                    <span className={styles.tomatoIcon}><Timer size={14} /></span>
                    <span>{task.actPomodoros}/{task.estPomodoros} Pomos</span>
                  </span>

                  {/* Due Date */}
                  {task.dueDate && (
                    <span className={`${styles.dueBadge} ${isOverdue(task.dueDate) && !task.completed ? styles.overdue : ""}`}>
                      <Calendar size={14} />
                      <span>
                        {isOverdue(task.dueDate) && !task.completed ? "Overdue: " : ""}
                        {new Date(task.dueDate).toLocaleDateString(undefined, { month: "short", day: "numeric" })}
                      </span>
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className={styles.actionsContainer}>
                <button className={styles.actionButton} onClick={() => handleEdit(task)}>
                  <Edit2 size={16} />
                </button>
                <button className={`${styles.actionButton} ${styles.deleteButton}`} onClick={() => handleDelete(task.id)}>
                  <Trash2 size={16} />
                </button>
              </div>
            </GlassCard>
          ))
        )}
      </div>
    </div>
  );
}
