import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import { getSession } from "@/lib/auth";

// GET - Get tasks for current user (or all tasks for admin)
export async function GET(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const dateStr = searchParams.get("date");
    const userId = searchParams.get("userId");

    // Build where clause
    const whereClause: { userId?: number; date?: { gte: Date; lt: Date } } = {};

    // If admin and userId provided, get that user's tasks
    if (session.role === "admin" && userId) {
      whereClause.userId = parseInt(userId);
    } else if (session.role === "staff") {
      // Staff can only see their own tasks
      whereClause.userId = session.userId;
    }

    // Filter by date if provided
    if (dateStr) {
      const date = new Date(dateStr);
      const nextDay = new Date(date);
      nextDay.setDate(nextDay.getDate() + 1);
      whereClause.date = {
        gte: date,
        lt: nextDay,
      };
    }

    const tasks = await prisma.task.findMany({
      where: whereClause,
      orderBy: { createdAt: "asc" },
      include: {
        user: {
          select: {
            id: true,
            username: true,
            position: true,
          },
        },
      },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Error fetching tasks:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new task
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { date, taskName, plan, result } = await request.json();

    if (!taskName) {
      return NextResponse.json(
        { error: "Task name is required" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        date: new Date(date || new Date()),
        taskName,
        plan: plan || "",
        result: result || "",
        userId: session.userId,
      },
    });

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Error creating task:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
