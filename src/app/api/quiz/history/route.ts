import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET quiz history
export async function GET() {
  try {
    const history = await prisma.quiz.findMany({
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json(history);
  } catch (error) {
    console.error("API GET Quiz History error:", error);
    return NextResponse.json({ error: "Failed to fetch quiz history" }, { status: 500 });
  }
}

// POST log quiz result
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, score, total } = body;

    if (!title || score === undefined || total === undefined) {
      return NextResponse.json({ error: "Title, score, and total are required" }, { status: 400 });
    }

    const quiz = await prisma.quiz.create({
      data: {
        title,
        score: parseInt(score),
        total: parseInt(total),
      },
    });

    // Also update/create Streak when they complete a quiz!
    let streak = await prisma.streak.findFirst();
    const now = new Date();
    if (streak) {
      const lastActive = new Date(streak.lastActiveDate);
      const lastActiveDay = new Date(lastActive.getFullYear(), lastActive.getMonth(), lastActive.getDate());
      const todayDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      const diffTime = Math.abs(todayDay.getTime() - lastActiveDay.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

      let newCurrentStreak = streak.currentStreak;
      let newLongestStreak = streak.longestStreak;

      if (diffDays === 1) {
        newCurrentStreak += 1;
        if (newCurrentStreak > newLongestStreak) newLongestStreak = newCurrentStreak;
      } else if (diffDays > 1) {
        newCurrentStreak = 1;
      }

      await prisma.streak.update({
        where: { id: streak.id },
        data: {
          currentStreak: newCurrentStreak,
          longestStreak: newLongestStreak,
          lastActiveDate: now,
        },
      });
    }

    return NextResponse.json({ success: true, quiz });
  } catch (error) {
    console.error("API POST Quiz History error:", error);
    return NextResponse.json({ error: "Failed to save quiz history" }, { status: 500 });
  }
}
