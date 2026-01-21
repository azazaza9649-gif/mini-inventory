import type { PrismaClient } from '@prisma/client';

export async function resetDb(prisma: PrismaClient): Promise<void> {
  await prisma.item.deleteMany();
  await prisma.category.deleteMany();
}
