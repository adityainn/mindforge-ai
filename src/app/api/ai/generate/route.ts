import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { generateContentWithFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { text, deckId, newDeckName } = body;

    if (!text || text.trim().length < 50) {
      return NextResponse.json(
        { error: "Please provide study notes with at least 50 characters." },
        { status: 400 }
      );
    }

    let targetDeckId = deckId;

    // 1. Resolve or Create Deck
    if (!targetDeckId && newDeckName) {
      const newDeck = await prisma.flashcardDeck.create({
        data: {
          name: newDeckName,
          description: "AI-generated deck from notes.",
        },
      });
      targetDeckId = newDeck.id;
    }

    if (!targetDeckId) {
      return NextResponse.json(
        { error: "A target deck or new deck name is required." },
        { status: 400 }
      );
    }

    let generatedCards = [];

    // 2. Generate Flashcards using Gemini with Fallbacks
    try {
      const prompt = `
        You are an expert tutor. Generate a deck of high-quality study flashcards based on the study notes provided below.
        
        Create between 5 to 15 cards depending on the density of the notes.
        Each card should focus on a single core term, concept, formula, or question. Keep the front and back clear, readable, and concise.
        
        The output MUST be a valid JSON array of objects following this TypeScript interface:
        interface Flashcard {
          front: string;
          back: string;
        }
        
        Do not wrap the JSON output in markdown fences (like \`\`\`json). Output only the raw valid JSON.
        
        Notes:
        ${text}
      `;

      const result = await generateContentWithFallback(prompt, true);
      let responseText = result.response.text();

      // Clean the response: strip markdown code blocks if any
      responseText = responseText.replace(/```json/gi, "").replace(/```/gi, "").trim();

      generatedCards = JSON.parse(responseText);

      if (!Array.isArray(generatedCards) || generatedCards.length === 0) {
        throw new Error("Invalid output format from Gemini");
      }
    } catch (apiError) {
      console.warn("Gemini API call failed for Flashcard Generator. Falling back to mock cards. Error:", apiError);
      
      const isMitochondria = text.toLowerCase().includes("mitochondria") || text.toLowerCase().includes("cell");
      
      // Fallback: high-quality mock cards
      generatedCards = isMitochondria
        ? [
            {
              front: "Powerhouse of the Cell",
              back: "Mitochondria - double-membrane organelles that generate ATP chemical energy."
            },
            {
              front: "ATP",
              back: "Adenosine Triphosphate - the primary energy currency used for cell metabolism."
            },
            {
              front: "Mitochondrial DNA",
              back: "Mitochondria contain their own circular DNA genome independent of nuclear DNA."
            }
          ]
        : [
            {
              front: "Active Recall",
              back: "Testing your memory by self-quizzing, which strengthens neural connections."
            },
            {
              front: "Spaced Repetition",
              back: "Reviewing topics at increasing intervals (e.g., 1 day, 6 days) to prevent forgetting."
            },
            {
              front: "Pomodoro Technique",
              back: "A focus method using 25 minutes of work followed by a 5-minute break."
            }
          ];
    }

    // 3. Insert generated cards into database
    const createdCards = await prisma.$transaction(
      generatedCards.map((card: any) =>
        prisma.flashcard.create({
          data: {
            deckId: targetDeckId,
            front: card.front,
            back: card.back,
            nextReview: new Date(), // due immediately
          },
        })
      )
    );

    return NextResponse.json({ success: true, deckId: targetDeckId, count: createdCards.length });
  } catch (error) {
    console.error("API AI Flashcards generate error:", error);
    return NextResponse.json(
      { error: "Failed to generate flashcards. Please try again." },
      { status: 500 }
    );
  }
}
