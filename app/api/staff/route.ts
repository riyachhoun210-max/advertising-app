import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

// GET - List all staff users
export async function GET() {
  try {
    const session = await getSession();
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const staffUsers = await prisma.user.findMany({
      where: { role: "staff" },
      select: {
        id: true,
        username: true,
        role: true,
        position: true,
        createdAt: true,
      },
    });

    return NextResponse.json(staffUsers);
  } catch (error) {
    console.error("Error fetching staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST - Create new staff user
export async function POST(request: NextRequest) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { username, password, position } = await request.json();

    if (!username || !password || !position) {
      return NextResponse.json(
        { error: "Username, password, and position are required" },
        { status: 400 }
      );
    }

    // Check if username already exists
    const existingUser = await prisma.user.findUnique({
      where: { username },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newStaff = await prisma.user.create({
      data: {
        username,
        password: hashedPassword,
        role: "staff",
        position,
      },
      select: {
        id: true,
        username: true,
        role: true,
        position: true,
        createdAt: true,
      },
    });

    return NextResponse.json(newStaff, { status: 201 });
  } catch (error) {
    console.error("Error creating staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
