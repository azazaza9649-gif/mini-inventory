import { describe, expect, it } from 'vitest';
import { CategoryService } from './category.service';
import type { CategoryRepository, ItemRepository } from '../repositories/types';
import { HttpError } from '../errors';

function makeCategoryRepo(): CategoryRepository {
  const data: { id: string; name: string; createdAt: Date }[] = [];

  return {
    create: async ({ name }) => {
      if (data.some(c => c.name === name)) {
        throw { code: 'P2002' };
      }
      const created = { id: `c_${data.length + 1}`, name, createdAt: new Date() };
      data.push(created);
      return created;
    },
    findById: async id => data.find(c => c.id === id) ?? null,
    list: async () => [...data],
    deleteById: async id => {
      const idx = data.findIndex(c => c.id === id);
      if (idx >= 0) data.splice(idx, 1);
    },
  };
}

function makeItemRepo(countByCategoryId: (id: string) => number): ItemRepository {
  return {
    create: async () => {
      throw new Error('not used');
    },
    findById: async () => {
      throw new Error('not used');
    },
    list: async () => {
      throw new Error('not used');
    },
    deleteById: async () => {
      throw new Error('not used');
    },
    countByCategoryId: async id => countByCategoryId(id),
  };
}

describe('CategoryService', () => {
  it('creates category and trims name', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('  Food  ');
    expect(created.name).toBe('Food');
  });

  it('rejects empty name', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.createCategory('   ')).rejects.toBeInstanceOf(HttpError);
    await expect(service.createCategory('   ')).rejects.toMatchObject({ statusCode: 400 });
  });

  it('returns 409 on duplicate name', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await service.createCategory('Food');
    await expect(service.createCategory('Food')).rejects.toMatchObject({ statusCode: 409 });
  });

  it('deletes category when no items', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('Food');
    await service.deleteCategory(created.id);

    const list = await service.listCategories();
    expect(list).toHaveLength(0);
  });

  it('returns 404 when deleting missing category', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.deleteCategory('missing')).rejects.toMatchObject({ statusCode: 404 });
  });

  it('returns 409 when category has items', async () => {
    const categoryRepo = makeCategoryRepo();
    const itemRepo = makeItemRepo(id => (id === 'c_1' ? 1 : 0));
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('Food');
    await expect(service.deleteCategory(created.id)).rejects.toMatchObject({ statusCode: 409 });
  });
});
