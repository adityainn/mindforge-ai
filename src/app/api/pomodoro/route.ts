import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { duration, type, taskId } = body;

    if (!duration || !type) {
      return NextResponse.json({ error: "Duration and type are required" }, { status: 400 });
    }

    // 1. Log the Pomodoro Session
    const session = await prisma.pomodoroSession.create({
      data: {
        duration: parseInt(duration),
        type,
      },
    });

    // 2. If it's a WORK session and taskId is provided, increment actPomodoros for the task
    if (type === "WORK" && taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId } });
      if (task) {
        await prisma.task.update({
          where: { id: taskId },
          data: {
            actPomodoros: task.actPomodoros + 1,
            // If they completed all estimated pomodoros, don't auto-complete, but let them know.
          },
        });
      }
    }

    // 3. Update Study Streak if type is WORK
    if (type === "WORK") {
      let streak = await prisma.streak.findFirst();
      const now = new Date();

      if (!streak) {
        // Create first streak
        await prisma.streak.create({
          data: {
            currentStreak: 1,
            longestStreak: 1,
            lastActiveDate: now,
          },
        });
      } else {
        const lastActive = new Date(streak.lastActiveDate);
        
        // Calculate difference in calendar days
        const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
        const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        const diffTime = Math.abs(todayDay.getTime() - lastActiveDay.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

        let newCurrentStreak = streak.currentStreak;
        let newLongestStreak = streak.longestStreak;

        if (diffDays === 1) {
          // Active on the consecutive day
          newCurrentStreak += 1;
          if (newCurrentStreak > newLongestStreak) {
            newLongestStreak = newCurrentStreak;
          }
        } else if (diffDays > 1) {
          // Streak broken
          newCurrentStreak = 1;
        }
        // If diffDays === 0, they already studied today, streak remains the same

        await prisma.streak.update({
          where: { id: streak.id },
          data: {
            currentStreak: newCurrentStreak,
            longestStreak: newLongestStreak,
            lastActiveDate: now,
          },
        });
      }
    }

    return NextResponse.json({ success: true, session });
  } catch (error) {
    console.error("API POST Pomodoro error:", error);
    return NextResponse.json({ error: "Failed to log session" }, { status: 500 });
  }
}
