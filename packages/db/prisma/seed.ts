import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import { readFileSync } from "fs";
import { join } from "path";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  // Create superuser
  const hashedPassword = await bcrypt.hash("Password1$", 12);
  await prisma.user.upsert({
    where: { email: "superuser@sierra.local" },
    update: {},
    create: {
      name: "superuser",
      email: "superuser@sierra.local",
      hashedPassword,
      role: "ADMIN",
    },
  });
  console.log("Seeded superuser (superuser@sierra.local).");

  // Create products
  const products = await Promise.all([
    prisma.product.upsert({
      where: { sku: "SHIRT-BLK-M" },
      update: {},
      create: {
        name: "Classic Black T-Shirt",
        description: "A comfortable, everyday black t-shirt made from 100% cotton.",
        price: 29.99,
        sku: "SHIRT-BLK-M",
        category: "Shirts",
        images: ["/images/black-tshirt.svg"],
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "SHIRT-WHT-M" },
      update: {},
      create: {
        name: "Classic White T-Shirt",
        description: "A clean, versatile white t-shirt for any occasion.",
        price: 29.99,
        sku: "SHIRT-WHT-M",
        category: "Shirts",
        images: ["/images/white-tshirt.svg"],
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "JEANS-BLU-32" },
      update: {},
      create: {
        name: "Slim Fit Blue Jeans",
        description: "Modern slim-fit jeans in classic blue denim.",
        price: 79.99,
        sku: "JEANS-BLU-32",
        category: "Pants",
        images: ["/images/blue-jeans.svg"],
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "HOODIE-GRY-L" },
      update: {},
      create: {
        name: "Cozy Grey Hoodie",
        description: "A warm fleece-lined hoodie perfect for cooler days.",
        price: 59.99,
        sku: "HOODIE-GRY-L",
        category: "Outerwear",
        images: ["/images/grey-hoodie.svg"],
        isActive: true,
      },
    }),
    prisma.product.upsert({
      where: { sku: "CAP-NAV-OS" },
      update: {},
      create: {
        name: "Navy Baseball Cap",
        description: "A classic navy baseball cap with adjustable strap.",
        price: 24.99,
        sku: "CAP-NAV-OS",
        category: "Accessories",
        images: ["/images/navy-cap.svg"],
        isActive: true,
      },
    }),
  ]);

  // Create inventory for each product
  for (const product of products) {
    await prisma.inventoryItem.upsert({
      where: { productId: product.id },
      update: {},
      create: {
        productId: product.id,
        quantityOnHand: 100,
        quantityReserved: 0,
        reorderPoint: 10,
      },
    });
  }

  console.log(`Seeded ${products.length} products with inventory.`);

  // Apply GIN indexes for JSONB attributes columns
  try {
    const ginSql = readFileSync(
      join(__dirname, "migrations", "gin-indexes.sql"),
      "utf-8",
    );
    const statements = ginSql
      .split(";")
      .map((s) => s.trim())
      .filter(Boolean);

    for (const stmt of statements) {
      await prisma.$executeRawUnsafe(stmt);
    }
    console.log("Applied GIN indexes on attributes columns.");
  } catch (err) {
    console.warn("Warning: Could not apply GIN indexes:", err);
  }
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
