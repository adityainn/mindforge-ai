import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all decks with card counts and due card counts
export async function GET() {
  try {
    const decks = await prisma.flashcardDeck.findMany({
      include: {
        cards: {
          select: {
            id: true,
            nextReview: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    const now = new Date();

    const formattedDecks = decks.map((deck) => {
      const dueCards = deck.cards.filter((card) => new Date(card.nextReview) <= now);
      return {
        id: deck.id,
        name: deck.name,
        description: deck.description,
        createdAt: deck.createdAt,
        cardCount: deck.cards.length,
        dueCount: dueCards.length,
      };
    });

    return NextResponse.json(formattedDecks);
  } catch (error) {
    console.error("API GET Decks error:", error);
    return NextResponse.json({ error: "Failed to fetch decks" }, { status: 500 });
  }
}

// POST create deck
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, description } = body;

    if (!name) {
      return NextResponse.json({ error: "Deck name is required" }, { status: 400 });
    }

    const deck = await prisma.flashcardDeck.create({
      data: {
        name,
        description,
      },
    });

    return NextResponse.json(deck);
  } catch (error) {
    console.error("API POST Deck error:", error);
    return NextResponse.json({ error: "Failed to create deck" }, { status: 500 });
  }
}
