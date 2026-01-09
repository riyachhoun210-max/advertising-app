import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import prisma from "@/lib/prisma";
import DashboardClient from "./DashboardClient";

export default async function DashboardPage() {
  const session = await getSession();

  if (!session) {
    redirect("/login");
  }

  // Get user's position from database
  const user = await prisma.user.findUnique({
    where: { id: session.userId },
    select: { position: true },
  });

  // Show 1 for admin, 2 for staff
  const displayNumber = session.role === "admin" ? 1 : 2;

  return (
    <DashboardClient
      username={session.username}
      role={session.role}
      position={user?.position || null}
      displayNumber={displayNumber}
    />
  );
}
