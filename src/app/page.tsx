"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { 
  Timer, 
  CheckSquare, 
  Flame, 
  BookOpen, 
  Award,
  ChevronRight,
  TrendingUp,
  Brain,
  Clock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer 
} from "recharts";
import GlassCard from "@/components/GlassCard";
import ProgressRing from "@/components/ProgressRing";
import styles from "@/styles/dashboard.module.css";

interface DashboardData {
  streak: {
    currentStreak: number;
    longestStreak: number;
  };
  today: {
    studyTimeMinutes: number;
    pomodorosCompleted: number;
    tasksCompleted: number;
    totalTasks: number;
  };
  weeklyData: Array<{ day: string; hours: number }>;
  pendingTasks: Array<{
    id: string;
    title: string;
    priority: string;
    category: string;
    dueDate: string | null;
  }>;
}

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [quote, setQuote] = useState({ text: "Loading motivation...", author: "MindForge" });

  const quotes = [
    { text: "The mind is not a vessel to be filled, but a fire to be kindled.", author: "Plutarch" },
    { text: "Focus on being productive instead of busy.", author: "Tim Ferriss" },
    { text: "It always seems impossible until it's done.", author: "Nelson Mandela" },
    { text: "Deep work is the superpower of the 21st century.", author: "Cal Newport" },
    { text: "Small daily improvements over time lead to stunning results.", author: "Robin Sharma" },
  ];

  useEffect(() => {
    setMounted(true);
    // Pick a random quote
    const randomQuote = quotes[Math.floor(Math.random() * quotes.length)];
    setQuote(randomQuote);

    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching dashboard data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted) return null;

  // Calculate dynamic progress
  const studyGoalMinutes = 120; // 2 hours daily study goal
  const studyProgress = data ? Math.min(100, Math.round((data.today.studyTimeMinutes / studyGoalMinutes) * 100)) : 0;
  
  const greetingText = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good morning, Scholar!";
    if (hour < 18) return "Good afternoon, Scholar!";
    return "Good evening, Scholar!";
  };

  const formattedDate = new Date().toLocaleDateString("en-US", {
    weekday: "long",
    month: "short",
    day: "numeric",
    year: "numeric"
  });

  return (
    <div>
      {/* Header section */}
      <div className={styles.dashboardHeader}>
        <h1 className={`${styles.greeting} textGradient`}>{greetingText()}</h1>
        <div className={styles.subGreeting}>
          <span>{formattedDate}</span>
          <span style={{ margin: "0 8px", color: "var(--text-muted)" }}>•</span>
          <span style={{ fontStyle: "italic", color: "var(--accent-purple)" }}>
            "{quote.text}" — {quote.author}
          </span>
        </div>
      </div>

      {/* Stats Grid */}
      <div className={styles.statsGrid}>
        {/* Stat 1: Study Time */}
        <GlassCard className={styles.statCard} hoverable={false}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Study Time</span>
            <div className={styles.statIconContainer} style={{ background: "rgba(59, 130, 246, 0.15)", color: "var(--accent-blue)" }}>
              <Clock size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? "..." : `${Math.round((data?.today.studyTimeMinutes || 0) / 60 * 10) / 10}h`}
          </div>
          <div className={styles.statSubtext}>
            {loading ? "" : `${data?.today.studyTimeMinutes || 0} mins / 2h daily goal`}
          </div>
        </GlassCard>

        {/* Stat 2: Pomodoros */}
        <GlassCard className={styles.statCard} hoverable={false}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Pomodoros</span>
            <div className={styles.statIconContainer} style={{ background: "rgba(139, 92, 246, 0.15)", color: "var(--accent-purple)" }}>
              <Timer size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? "..." : data?.today.pomodorosCompleted}
          </div>
          <div className={styles.statSubtext}>Completed today</div>
        </GlassCard>

        {/* Stat 3: Tasks */}
        <GlassCard className={styles.statCard} hoverable={false}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Tasks Done</span>
            <div className={styles.statIconContainer} style={{ background: "rgba(16, 185, 129, 0.15)", color: "var(--accent-green)" }}>
              <CheckSquare size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? "..." : `${data?.today.tasksCompleted}/${data?.today.totalTasks}`}
          </div>
          <div className={styles.statSubtext}>Checklist tasks completed</div>
        </GlassCard>

        {/* Stat 4: Streak */}
        <GlassCard className={styles.statCard} hoverable={false}>
          <div className={styles.statHeader}>
            <span className={styles.statLabel}>Study Streak</span>
            <div className={styles.statIconContainer} style={{ background: "rgba(245, 158, 11, 0.15)", color: "var(--accent-yellow)" }}>
              <Flame size={20} />
            </div>
          </div>
          <div className={styles.statValue}>
            {loading ? "..." : data?.streak.currentStreak}
          </div>
          <div className={styles.statSubtext}>
            {loading ? "" : `Best streak: ${data?.streak.longestStreak || 0} days`}
          </div>
        </GlassCard>
      </div>

      {/* Main Grid: Weekly Chart + Circular Progress */}
      <div className={styles.mainGrid}>
        {/* Productivity Graph */}
        <GlassCard className={styles.chartCard} hoverable={false}>
          <h3 className={styles.cardTitle}>
            <TrendingUp size={20} style={{ color: "var(--accent-blue)" }} />
            Weekly Productivity Hours
          </h3>
          <div className={styles.chartContainer}>
            {loading ? (
              <div className="w-full h-full shimmer" style={{ borderRadius: "12px", height: "300px" }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.weeklyData || []}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorHours" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-blue)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-purple)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis 
                    dataKey="day" 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <YAxis 
                    stroke="var(--text-muted)" 
                    fontSize={12}
                    tickLine={false}
                    axisLine={false}
                  />
                  <Tooltip
                    contentStyle={{
                      background: "rgba(13, 13, 23, 0.8)",
                      border: "1px solid var(--border-color)",
                      borderRadius: "12px",
                      backdropFilter: "blur(12px)",
                      color: "var(--text-primary)"
                    }}
                  />
                  <Area
                    type="monotone"
                    dataKey="hours"
                    stroke="url(#progress-ring-grad)"
                    strokeWidth={3}
                    fillOpacity={1}
                    fill="url(#colorHours)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Circular Today Progress */}
        <GlassCard className={styles.progressCard} hoverable={false}>
          <h3 className={styles.cardTitle}>
            <Brain size={20} style={{ color: "var(--accent-purple)" }} />
            Today's Goal Progress
          </h3>
          
          <div className={styles.progressWrapper}>
            <ProgressRing
              radius={80}
              stroke={8}
              progress={loading ? 0 : studyProgress}
            />
            <div className={styles.progressLabel}>
              <span className={styles.progressPercentage}>
                {loading ? "0%" : `${studyProgress}%`}
              </span>
              <span className={styles.progressSub}>Study Goal</span>
            </div>
          </div>

          <div className={styles.progressDetails}>
            <div className={styles.detailItem}>
              <span className={styles.detailValue} style={{ color: "var(--accent-blue)" }}>
                {loading ? "0m" : `${data?.today.studyTimeMinutes}m`}
              </span>
              <span className={styles.detailLabel}>Studied</span>
            </div>
            <div className={styles.detailItem}>
              <span className={styles.detailValue} style={{ color: "var(--text-secondary)" }}>
                {studyGoalMinutes}m
              </span>
              <span className={styles.detailLabel}>Target</span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Today's Tasks & AI Planner Widget */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Pending Tasks */}
        <GlassCard style={{ padding: "24px" }} hoverable={false}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
            <h3 style={{ fontSize: "1.25rem", display: "flex", alignItems: "center", gap: "8px" }}>
              <CheckSquare size={20} style={{ color: "var(--accent-green)" }} />
              Next Checklist Tasks
            </h3>
            <Link href="/tasks" style={{ fontSize: "0.85rem", color: "var(--accent-blue)", display: "flex", alignItems: "center" }}>
              Manage Tasks <ChevronRight size={16} />
            </Link>
          </div>

          <div className={styles.dashboardList}>
            {loading ? (
              <div className="shimmer" style={{ height: "48px", borderRadius: "8px" }} />
            ) : data?.pendingTasks.length === 0 ? (
              <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "0.9rem" }}>
                All caught up! No pending tasks. 🎉
              </div>
            ) : (
              data?.pendingTasks.map((task) => (
                <div key={task.id} className={styles.listItem}>
                  <div>
                    <div className={styles.listItemTitle}>{task.title}</div>
                    <div className={styles.listItemSubtitle}>
                      {task.category} • Priority: <span style={{ 
                        color: task.priority === "HIGH" ? "var(--accent-red)" : 
                               task.priority === "MEDIUM" ? "var(--accent-yellow)" : "var(--accent-blue)" 
                      }}>{task.priority}</span>
                    </div>
                  </div>
                  {task.dueDate && (
                    <div style={{ fontSize: "0.8rem", color: "var(--text-muted)" }}>
                      Due {new Date(task.dueDate).toLocaleDateString()}
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </GlassCard>

        {/* Quick Launch / AI Features */}
        <GlassCard style={{ padding: "24px" }} hoverable={false}>
          <h3 style={{ fontSize: "1.25rem", marginBottom: "20px", display: "flex", alignItems: "center", gap: "8px" }}>
            <Award size={20} style={{ color: "var(--accent-yellow)" }} />
            MindForge Toolkit
          </h3>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
            <Link href="/pomodoro">
              <div className="glassCard" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Timer size={24} style={{ color: "var(--accent-red)" }} />
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Pomodoro Clock</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Track focus cycles</span>
              </div>
            </Link>
            <Link href="/quiz">
              <div className="glassCard" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <BookOpen size={24} style={{ color: "var(--accent-blue)" }} />
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>AI Quiz Maker</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Convert notes into MCQs</span>
              </div>
            </Link>
            <Link href="/flashcards">
              <div className="glassCard" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Brain size={24} style={{ color: "var(--accent-purple)" }} />
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Flashcards</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Spaced repetition review</span>
              </div>
            </Link>
            <Link href="/chat">
              <div className="glassCard" style={{ padding: "16px", height: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
                <Brain size={24} style={{ color: "var(--accent-pink)" }} />
                <span style={{ fontWeight: 600, fontSize: "0.9rem" }}>Study Copilot</span>
                <span style={{ fontSize: "0.75rem", color: "var(--text-secondary)" }}>Chat with AI notes assistant</span>
              </div>
            </Link>
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
