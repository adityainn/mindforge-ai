import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// GET all tasks
export async function GET() {
  try {
    const tasks = await prisma.task.findMany({
      orderBy: [
        { completed: "asc" },
        { dueDate: "asc" },
        { createdAt: "desc" },
      ],
    });
    return NextResponse.json(tasks);
  } catch (error) {
    console.error("API GET Tasks error:", error);
    return NextResponse.json({ error: "Failed to fetch tasks" }, { status: 500 });
  }
}

// POST create task
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { title, description, priority, category, dueDate, estPomodoros } = body;

    if (!title) {
      return NextResponse.json({ error: "Title is required" }, { status: 400 });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description,
        priority: priority || "MEDIUM",
        category: category || "Study",
        dueDate: dueDate ? new Date(dueDate) : null,
        estPomodoros: estPomodoros ? parseInt(estPomodoros) : 1,
      },
    });

    return NextResponse.json(task);
  } catch (error) {
    console.error("API POST Task error:", error);
    return NextResponse.json({ error: "Failed to create task" }, { status: 500 });
  }
}
