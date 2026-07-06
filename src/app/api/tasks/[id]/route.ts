import { NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// PUT (update) task
export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const body = await request.json();
    const { title, description, priority, category, dueDate, estPomodoros, actPomodoros, completed } = body;

    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        title: title !== undefined ? title : existingTask.title,
        description: description !== undefined ? description : existingTask.description,
        priority: priority !== undefined ? priority : existingTask.priority,
        category: category !== undefined ? category : existingTask.category,
        dueDate: dueDate !== undefined ? (dueDate ? new Date(dueDate) : null) : existingTask.dueDate,
        estPomodoros: estPomodoros !== undefined ? parseInt(estPomodoros) : existingTask.estPomodoros,
        actPomodoros: actPomodoros !== undefined ? parseInt(actPomodoros) : existingTask.actPomodoros,
        completed: completed !== undefined ? completed : existingTask.completed,
      },
    });

    return NextResponse.json(updatedTask);
  } catch (error) {
    console.error("API PUT Task error:", error);
    return NextResponse.json({ error: "Failed to update task" }, { status: 500 });
  }
}

// DELETE task
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const existingTask = await prisma.task.findUnique({
      where: { id },
    });

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 });
    }

    await prisma.task.delete({
      where: { id },
    });

    return NextResponse.json({ message: "Task deleted successfully" });
  } catch (error) {
    console.error("API DELETE Task error:", error);
    return NextResponse.json({ error: "Failed to delete task" }, { status: 500 });
  }
}
