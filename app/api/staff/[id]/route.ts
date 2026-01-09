import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { getSession } from "@/lib/auth";

// PUT - Update staff user
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const staffId = parseInt(id);
    const { username, password, position } = await request.json();

    if (!username || !position) {
      return NextResponse.json(
        { error: "Username and position are required" },
        { status: 400 }
      );
    }

    // Check if user exists and is staff
    const existingUser = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!existingUser || existingUser.role !== "staff") {
      return NextResponse.json(
        { error: "Staff user not found" },
        { status: 404 }
      );
    }

    // Check if new username is taken by another user
    const usernameExists = await prisma.user.findFirst({
      where: {
        username,
        id: { not: staffId },
      },
    });

    if (usernameExists) {
      return NextResponse.json(
        { error: "Username already exists" },
        { status: 400 }
      );
    }

    // Prepare update data
    const updateData: { username: string; password?: string; position: string } = { username, position };
    
    if (password) {
      updateData.password = await bcrypt.hash(password, 10);
    }

    const updatedStaff = await prisma.user.update({
      where: { id: staffId },
      data: updateData,
      select: {
        id: true,
        username: true,
        role: true,
        position: true,
        createdAt: true,
      },
    });

    return NextResponse.json(updatedStaff);
  } catch (error) {
    console.error("Error updating staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE - Delete staff user
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    
    if (!session || session.role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const staffId = parseInt(id);

    // Check if user exists and is staff
    const existingUser = await prisma.user.findUnique({
      where: { id: staffId },
    });

    if (!existingUser || existingUser.role !== "staff") {
      return NextResponse.json(
        { error: "Staff user not found" },
        { status: 404 }
      );
    }

    await prisma.user.delete({
      where: { id: staffId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting staff:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
