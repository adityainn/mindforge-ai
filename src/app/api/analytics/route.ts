import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET() {
  try {
    // 1. Get/Initialize Streak
    let streak = await prisma.streak.findFirst();
    if (!streak) {
      streak = await prisma.streak.create({
        data: {
          currentStreak: 0,
          longestStreak: 0,
          lastActiveDate: new Date(Date.now() - 24 * 60 * 60 * 1000), // yesterday
        },
      });
    }

    // 2. Calculate Today's Stats
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);

    const todayEnd = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // Today's completed tasks
    const completedTasksToday = await prisma.task.count({
      where: {
        completed: true,
        updatedAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    // Total tasks count
    const totalTasks = await prisma.task.count();

    // Today's Pomodoro sessions
    const pomodorosToday = await prisma.pomodoroSession.findMany({
      where: {
        createdAt: {
          gte: todayStart,
          lte: todayEnd,
        },
      },
    });

    const workSessionsCount = pomodorosToday.filter((s) => s.type === "WORK").length;
    const totalStudyTimeMinutes = pomodorosToday
      .filter((s) => s.type === "WORK")
      .reduce((sum, s) => sum + s.duration, 0);

    // 3. Weekly Productivity Data (last 7 days)
    const weeklyData = [];
    for (let i = 6; i >= 0; i--) {
      const dayStart = new Date();
      dayStart.setDate(dayStart.getDate() - i);
      dayStart.setHours(0, 0, 0, 0);

      const dayEnd = new Date();
      dayEnd.setDate(dayEnd.getDate() - i);
      dayEnd.setHours(23, 59, 59, 999);

      const dayName = dayStart.toLocaleDateString("en-US", { weekday: "short" });

      const daySessions = await prisma.pomodoroSession.findMany({
        where: {
          type: "WORK",
          createdAt: {
            gte: dayStart,
            lte: dayEnd,
          },
        },
      });

      const dayHours = daySessions.reduce((sum, s) => sum + s.duration, 0) / 60; // convert to hours
      weeklyData.push({
        day: dayName,
        hours: parseFloat(dayHours.toFixed(1)),
      });
    }

    // 4. Tasks Summary
    const pendingTasks = await prisma.task.findMany({
      where: { completed: false },
      orderBy: { dueDate: "asc" },
      take: 5,
    });

    // 5. Total Cumulative Stats
    const totalCompletedTasks = await prisma.task.count({ where: { completed: true } });
    const totalTasksCreated = await prisma.task.count();
    const totalPomodorosCompleted = await prisma.pomodoroSession.count({ where: { type: "WORK" } });
    const totalCardsReviewed = await prisma.flashcardHistory.count();

    // 6. Achievements Check
    const achievements = [
      {
        id: "fresh_start",
        title: "Fresh Start",
        description: "Created your first task.",
        icon: "zap",
        unlocked: totalTasksCreated > 0,
      },
      {
        id: "streak_starter",
        title: "Streak Starter",
        description: "Achieve a 2-day study streak.",
        icon: "flame",
        unlocked: streak.currentStreak >= 2,
      },
      {
        id: "pomo_master",
        title: "Pomo Master",
        description: "Complete 10 Focus Pomodoro sessions.",
        icon: "timer",
        unlocked: totalPomodorosCompleted >= 10,
      },
      {
        id: "memory_scholar",
        title: "Memory Scholar",
        description: "Review 25 flashcard repetitions.",
        icon: "brain",
        unlocked: totalCardsReviewed >= 25,
      },
      {
        id: "grand_master",
        title: "Grand Master",
        description: "Complete 10 checklist tasks.",
        icon: "award",
        unlocked: totalCompletedTasks >= 10,
      },
    ];

    return NextResponse.json({
      streak,
      today: {
        studyTimeMinutes: totalStudyTimeMinutes,
        pomodorosCompleted: workSessionsCount,
        tasksCompleted: completedTasksToday,
        totalTasks,
      },
      weeklyData,
      pendingTasks,
      totals: {
        totalCompletedTasks,
        totalTasksCreated,
        totalPomodorosCompleted,
        totalCardsReviewed,
      },
      achievements,
    });
  } catch (error) {
    console.error("API Analytics error:", error);
    return NextResponse.json(
      { error: "Failed to fetch analytics" },
      { status: 500 }
    );
  }
}
