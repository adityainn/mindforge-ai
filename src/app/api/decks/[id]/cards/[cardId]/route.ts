import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { calculateSM2 } from "@/lib/sm2";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const body = await request.json();
    const { front, back, grade } = body;

    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    // Check if this is a spaced repetition review log (grade is provided)
    if (grade !== undefined) {
      const q = parseInt(grade);
      if (isNaN(q) || q < 0 || q > 5) {
        return NextResponse.json({ error: "Grade must be between 0 and 5" }, { status: 400 });
      }

      // 1. Calculate SM-2 scheduling parameters
      const sm2Update = calculateSM2(
        q,
        card.interval,
        card.repetitions,
        card.easeFactor
      );

      // 2. Update Flashcard details
      const updatedCard = await prisma.flashcard.update({
        where: { id: cardId },
        data: {
          interval: sm2Update.interval,
          repetitions: sm2Update.repetitions,
          easeFactor: sm2Update.easeFactor,
          nextReview: sm2Update.nextReview,
        },
      });

      // 3. Create Review History record
      await prisma.flashcardHistory.create({
        data: {
          cardId,
          grade: q,
        },
      });

      // 4. Increment user streak if they completed a card review (similar to Pomodoro)
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

      return NextResponse.json({ success: true, card: updatedCard });
    }

    // Otherwise, this is a normal text edit
    const updatedCard = await prisma.flashcard.update({
      where: { id: cardId },
      data: {
        front: front !== undefined ? front : card.front,
        back: back !== undefined ? back : card.back,
      },
    });

    return NextResponse.json(updatedCard);
  } catch (error) {
    console.error("API PUT Card error:", error);
    return NextResponse.json({ error: "Failed to update card" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string; cardId: string }> }
) {
  try {
    const { cardId } = await params;
    const card = await prisma.flashcard.findUnique({
      where: { id: cardId },
    });

    if (!card) {
      return NextResponse.json({ error: "Card not found" }, { status: 404 });
    }

    await prisma.flashcard.delete({
      where: { id: cardId },
    });

    return NextResponse.json({ message: "Card deleted successfully" });
  } catch (error) {
    console.error("API DELETE Card error:", error);
    return NextResponse.json({ error: "Failed to delete card" }, { status: 500 });
  }
}
