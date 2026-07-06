"use client";

import React, { useState, useEffect } from "react";
import { 
  BarChart2, 
  Flame, 
  Award, 
  TrendingUp, 
  Clock, 
  CheckSquare, 
  Layers, 
  Zap, 
  Timer, 
  Brain,
  Lock
} from "lucide-react";
import { 
  AreaChart, 
  Area, 
  XAxis, 
  YAxis, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";
import GlassCard from "@/components/GlassCard";
import styles from "@/styles/analytics.module.css";

interface AnalyticsData {
  streak: {
    currentStreak: number;
    longestStreak: number;
    lastActiveDate: string;
  };
  today: {
    studyTimeMinutes: number;
    pomodorosCompleted: number;
    tasksCompleted: number;
    totalTasks: number;
  };
  weeklyData: Array<{ day: string; hours: number }>;
  totals: {
    totalCompletedTasks: number;
    totalTasksCreated: number;
    totalPomodorosCompleted: number;
    totalCardsReviewed: number;
  };
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlocked: boolean;
  }>;
}

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const fetchData = async () => {
      try {
        const res = await fetch("/api/analytics");
        if (res.ok) {
          const result = await res.json();
          setData(result);
        }
      } catch (err) {
        console.error("Error fetching analytics data:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (!mounted) return null;

  const totalStudyHours = data ? Math.round((data.totals.totalPomodorosCompleted * 25) / 60 * 10) / 10 : 0;

  // Icon mapping helper
  const renderAchievementIcon = (iconName: string, unlocked: boolean) => {
    if (!unlocked) return <Lock size={20} />;
    
    switch (iconName) {
      case "zap":
        return <Zap size={20} />;
      case "flame":
        return <Flame size={20} />;
      case "timer":
        return <Timer size={20} />;
      case "brain":
        return <Brain size={20} />;
      case "award":
      default:
        return <Award size={20} />;
    }
  };

  return (
    <div className={styles.container}>
      {/* Header */}
      <div className={styles.header}>
        <h1 className="textGradient">Productivity Analytics</h1>
        <p>Analyze your study hours, task completions, streaks, and unlocked achievements.</p>
      </div>

      {/* Summary Cumulative Cards */}
      <div className={styles.summaryGrid}>
        {/* Cumulative Study Hours */}
        <GlassCard className={styles.summaryCard} hoverable={false}>
          <span className={styles.cardLabel}>Total Study Time</span>
          <div className={styles.cardVal}>{loading ? "..." : `${totalStudyHours}h`}</div>
          <span className={styles.cardSub}>Cumulative Pomodoro hours</span>
        </GlassCard>

        {/* Total Pomodoros */}
        <GlassCard className={styles.summaryCard} hoverable={false}>
          <span className={styles.cardLabel}>Total Pomodoros</span>
          <div className={styles.cardVal}>{loading ? "..." : data?.totals.totalPomodorosCompleted}</div>
          <span className={styles.cardSub}>Completed focus cycles</span>
        </GlassCard>

        {/* Completed Tasks */}
        <GlassCard className={styles.summaryCard} hoverable={false}>
          <span className={styles.cardLabel}>Tasks Completed</span>
          <div className={styles.cardVal}>
            {loading ? "..." : `${data?.totals.totalCompletedTasks}/${data?.totals.totalTasksCreated}`}
          </div>
          <span className={styles.cardSub}>Task completion rate</span>
        </GlassCard>

        {/* Reviewed cards */}
        <GlassCard className={styles.summaryCard} hoverable={false}>
          <span className={styles.cardLabel}>Cards Reviewed</span>
          <div className={styles.cardVal}>{loading ? "..." : data?.totals.totalCardsReviewed}</div>
          <span className={styles.cardSub}>Spaced repetition checks</span>
        </GlassCard>
      </div>

      {/* Graph and Streak showcase */}
      <div className={styles.detailsGrid}>
        {/* Weekly Productivity hours */}
        <GlassCard className={styles.chartCard} hoverable={false}>
          <h3 className={styles.chartTitle}>
            <TrendingUp size={20} style={{ color: "var(--accent-blue)" }} />
            Weekly Focus Trends
          </h3>

          <div className={styles.chartContainer}>
            {loading ? (
              <div className="w-full h-full shimmer" style={{ borderRadius: "12px" }} />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={data?.weeklyData || []}
                  margin={{ top: 10, right: 10, left: -25, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="colorHoursAnalytics" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="var(--accent-purple)" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="var(--accent-blue)" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <XAxis dataKey="day" stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="var(--text-muted)" fontSize={12} tickLine={false} axisLine={false} />
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
                    fill="url(#colorHoursAnalytics)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </GlassCard>

        {/* Gamified Streak Card */}
        <GlassCard className={styles.streakShowcase} hoverable={false}>
          <div className={styles.flameContainer}>
            <Flame size={44} fill={data && data.streak.currentStreak > 0 ? "var(--accent-yellow)" : "none"} />
          </div>
          
          <h2 className={styles.streakTitle}>{loading ? "..." : `${data?.streak.currentStreak} Days`}</h2>
          <span className={styles.streakSubtitle}>Current Study Streak</span>

          <div className={styles.streakStatsTable}>
            <div className={styles.streakStatRow}>
              <span className={styles.streakRowLabel}>Longest Streak</span>
              <span className={styles.streakRowValue}>{loading ? "..." : `${data?.streak.longestStreak} days`}</span>
            </div>
            <div className={styles.streakStatRow}>
              <span className={styles.streakRowLabel}>Last Active Date</span>
              <span className={styles.streakRowValue}>
                {loading ? "..." : data?.streak.lastActiveDate ? new Date(data.streak.lastActiveDate).toLocaleDateString() : "Never"}
              </span>
            </div>
          </div>
        </GlassCard>
      </div>

      {/* Gamified Achievements Grid */}
      <div className={styles.achievementsSection}>
        <h3 className={styles.achievementsTitle}>
          <Award size={22} style={{ color: "var(--accent-yellow)" }} />
          Achievements & Badges
        </h3>

        <div className={styles.achievementsGrid}>
          {loading ? (
            <div className="shimmer" style={{ height: "88px", borderRadius: "16px" }} />
          ) : (
            data?.achievements.map((ach) => (
              <GlassCard 
                key={ach.id}
                className={`${styles.achievementCard} ${
                  ach.unlocked ? styles.achievementUnlocked : styles.achievementLocked
                }`}
                hoverable={false}
              >
                <div className={styles.achievementIconBox}>
                  {renderAchievementIcon(ach.icon, ach.unlocked)}
                </div>
                
                <div className={styles.achievementDetails}>
                  <span className={styles.achievementTitle}>{ach.title}</span>
                  <span className={styles.achievementDesc}>{ach.description}</span>
                </div>
              </GlassCard>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
