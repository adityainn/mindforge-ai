import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const { searchParams } = new URL(request.url);
    const dueOnly = searchParams.get("due") === "true";

    const whereClause: any = { deckId: id };

    if (dueOnly) {
      whereClause.nextReview = {
        lte: new Date(),
      };
    }

    const cards = await prisma.flashcard.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(cards);
  } catch (error) {
    console.error("API GET Cards error:", error);
    return NextResponse.json({ error: "Failed to fetch cards" }, { status: 500 });
  }
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { front, back } = body;

    if (!front || !back) {
      return NextResponse.json({ error: "Front and back content are required" }, { status: 400 });
    }

    const card = await prisma.flashcard.create({
      data: {
        deckId: id,
        front,
        back,
        nextReview: new Date(), // due immediately
      },
    });

    return NextResponse.json(card);
  } catch (error) {
    console.error("API POST Card error:", error);
    return NextResponse.json({ error: "Failed to create card" }, { status: 500 });
  }
}
