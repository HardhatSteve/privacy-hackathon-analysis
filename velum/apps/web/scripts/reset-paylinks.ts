/**
 * Reset all paylinks in the database.
 *
 * This script is needed after changing the signing message
 * (which changes the derived keys), making old paylinks unreachable.
 *
 * Usage: npx tsx scripts/reset-paylinks.ts
 */
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const count = await prisma.paylink.count();

  if (count === 0) {
    console.log("No paylinks to delete.");
    return;
  }

  console.log(`Found ${count} paylinks. Deleting...`);
  const result = await prisma.paylink.deleteMany();
  console.log(`Deleted ${result.count} paylinks.`);
}

main()
  .catch((e) => {
    console.error("Error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
