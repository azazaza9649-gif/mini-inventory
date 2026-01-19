import type { PrismaClient } from '@prisma/client';
import type { CategoryRepository, ItemRepository } from './types';

export function createRepositories(prisma: PrismaClient): {
  category: CategoryRepository;
  item: ItemRepository;
} {
  const category: CategoryRepository = {
    create: async data => prisma.category.create({ data }),
    findById: async id => prisma.category.findUnique({ where: { id } }),
    list: async () => prisma.category.findMany({ orderBy: { createdAt: 'desc' } }),
    deleteById: async id => {
      await prisma.category.delete({ where: { id } });
    },
  };

  const item: ItemRepository = {
    create: async data => prisma.item.create({ data }),
    findById: async id => prisma.item.findUnique({ where: { id } }),
    list: async filter =>
      prisma.item.findMany({
        where: filter?.categoryId ? { categoryId: filter.categoryId } : undefined,
        orderBy: { createdAt: 'desc' },
      }),
    deleteById: async id => {
      await prisma.item.delete({ where: { id } });
    },
    countByCategoryId: async categoryId => prisma.item.count({ where: { categoryId } }),
  };

  return { category, item };
}
