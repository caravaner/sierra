import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create superuser
  const hashedPassword = await bcrypt.hash("password", 12);
  await prisma.user.upsert({
    where: { email: "superuser@sierra.local" },
    update: {},
    create: {
      name: "superuser",
      email: "superuser@sierra.local",
      hashedPassword,
      role: "SUPERADMIN",
    },
  });
  console.log("Seeded superuser (superuser@sierra.local).");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
