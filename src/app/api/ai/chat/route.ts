import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getGeminiModel, generateContentWithFallback } from "@/lib/gemini";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { messages, generatePlan } = body;

    // Fetch user context (tasks + stats) to inject into system prompt
    const tasks = await prisma.task.findMany({
      where: { completed: false },
      orderBy: { priority: "desc" },
    });

    const stats = await prisma.pomodoroSession.findMany({
      where: {
        createdAt: {
          gte: new Date(new Date().setHours(0, 0, 0, 0)),
        },
      },
    });

    const taskContext = tasks
      .map((t) => `- [${t.priority}] ${t.title} (${t.category}, est. ${t.estPomodoros} Pomodoros)`)
      .join("\n");

    const studyTime = stats.filter((s) => s.type === "WORK").reduce((sum, s) => sum + s.duration, 0);

    // If it's a study planner request, generate a structured schedule
    if (generatePlan) {
      const plannerPrompt = `
        You are MindForge Planner, an expert productivity coach. Generate a highly structured hourly daily study schedule based on the user's pending tasks and current stats.
        
        Today's Study Stats:
        - Completed Study Time: ${studyTime} minutes today.
        
        Pending Tasks:
        ${taskContext || "No pending tasks."}
        
        Guidelines:
        1. Group tasks logically, prioritize HIGH priority tasks first.
        2. Incorporate Pomodoro cycles (50 minutes focus, 10 minutes break, or 25/5 cycles).
        3. Include blocks for meals, exercise, and reviews of spaced repetition flashcards.
        4. Present the daily schedule in a beautiful markdown list with hourly blocks (e.g., **09:00 AM - 10:00 AM**).
        5. Add a motivational encouraging opening and closing statement.
      `;

      const result = await generateContentWithFallback(plannerPrompt, false);
      const planText = result.response.text();

      return NextResponse.json({ text: planText });
    }

    // Standard Chat Assistant conversation flow
    if (!messages || !Array.isArray(messages)) {
      return NextResponse.json({ error: "Messages array is required" }, { status: 400 });
    }

    // System prompt with context inject
    const systemPrompt = `
      You are MindForge Copilot, a friendly and intelligent AI study assistant.
      Your goal is to help the user learn, stay focused, explain difficult concepts, and offer productivity guidance.
      
      User's Current Context:
      - Pending Tasks:
      ${taskContext || "No pending tasks."}
      - Today's completed focus: ${studyTime} minutes.
      
      Be supportive, clear, and write detailed markdown responses. If the user asks general questions, answer them. If they ask about their tasks or schedule, guide them based on the context.
    `;

    const chatHistory = [
      {
        role: "user",
        parts: [{ text: systemPrompt + "\nUnderstood. Please say hello and ask how you can help me study today." }],
      },
      {
        role: "model",
        parts: [{ text: "Hello! I am MindForge Copilot. I'm connected to your dashboard and ready to help you study, manage your schedule, or review topics. What are we focusing on today?" }],
      },
      ...messages.slice(0, -1).map((msg: any) => ({
        role: msg.role === "user" ? "user" : "model",
        parts: [{ text: msg.content }],
      })),
    ];

    const lastMessage = messages[messages.length - 1].content;
    let replyText = "";
    let lastError: any = null;

    // Try chat with fallback models
    const models = ["gemini-2.5-flash", "gemini-1.5-flash", "gemini-1.5-pro"];
    for (const modelName of models) {
      try {
        console.log(`[Gemini API Chat] Attempting chat with model: ${modelName}`);
        const chatModel = getGeminiModel(modelName);
        const chat = chatModel.startChat({ history: chatHistory });
        const chatResult = await chat.sendMessage(lastMessage);
        replyText = chatResult.response.text();
        console.log(`[Gemini API Chat] Chat successful with model: ${modelName}`);
        break;
      } catch (err: any) {
        console.warn(`[Gemini API Chat] Model ${modelName} failed. Status: ${err.status || "Error"}. Message: ${err.message || err}`);
        lastError = err;
      }
    }

    if (!replyText && lastError) {
      throw lastError;
    }

    return NextResponse.json({ text: replyText });
  } catch (error) {
    console.error("API Chat/Planner error:", error);
    return NextResponse.json({ error: "Failed to communicate with AI" }, { status: 500 });
  }
}
