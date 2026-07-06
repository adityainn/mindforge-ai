import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { name, description } = body;

    const deck = await prisma.flashcardDeck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    const updatedDeck = await prisma.flashcardDeck.update({
      where: { id },
      data: {
        name: name !== undefined ? name : deck.name,
        description: description !== undefined ? description : deck.description,
      },
    });

    return NextResponse.json(updatedDeck);
  } catch (error) {
    console.error("API PUT Deck error:", error);
    return NextResponse.json({ error: "Failed to update deck" }, { status: 500 });
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const deck = await prisma.flashcardDeck.findUnique({ where: { id } });
    if (!deck) {
      return NextResponse.json({ error: "Deck not found" }, { status: 404 });
    }

    await prisma.flashcardDeck.delete({ where: { id } });
    return NextResponse.json({ message: "Deck deleted successfully" });
  } catch (error) {
    console.error("API DELETE Deck error:", error);
    return NextResponse.json({ error: "Failed to delete deck" }, { status: 500 });
  }
}
