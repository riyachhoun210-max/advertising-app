import prisma from "../lib/prisma";
import bcrypt from "bcryptjs";

async function main() {
  console.log("Seeding database...");

  // Create admin user
  const adminPassword = await bcrypt.hash("admin123", 10);
  const admin = await prisma.user.upsert({
    where: { username: "admin" },
    update: {},
    create: {
      username: "admin",
      password: adminPassword,
      role: "admin",
    },
  });
  console.log("Created admin user:", admin.username);

  // Create Project Manager
  const pmPassword = await bcrypt.hash("pm123", 10);
  const pm = await prisma.user.upsert({
    where: { username: "john_pm" },
    update: {},
    create: {
      username: "john_pm",
      password: pmPassword,
      role: "staff",
      position: "project_manager",
    },
  });
  console.log("Created Project Manager:", pm.username);

  // Create Media Buyer
  const mbPassword = await bcrypt.hash("mb123", 10);
  const mediaBuyer = await prisma.user.upsert({
    where: { username: "sarah_mb" },
    update: {},
    create: {
      username: "sarah_mb",
      password: mbPassword,
      role: "staff",
      position: "media_buyer",
    },
  });
  console.log("Created Media Buyer:", mediaBuyer.username);

  // Create Graphic Designer
  const gdPassword = await bcrypt.hash("gd123", 10);
  const graphicDesigner = await prisma.user.upsert({
    where: { username: "mike_gd" },
    update: {},
    create: {
      username: "mike_gd",
      password: gdPassword,
      role: "staff",
      position: "graphic_design",
    },
  });
  console.log("Created Graphic Designer:", graphicDesigner.username);

  console.log("Database seeding completed!");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
