import { describe, expect, it } from 'vitest';
import { CategoryService } from './category.service';
import { type CategoryRepository, type ItemRepository } from '../repositories/types';
import { HttpError } from '../errors';

type CategoryRow = { id: string; name: string; createdAt: Date };

function makeCategoryRepo(): { repo: CategoryRepository; data: CategoryRow[] } {
  const data: CategoryRow[] = [];

  const repo: CategoryRepository = {
    create: async ({ name }) => {
      if (data.some(c => c.name === name)) {
        throw { code: 'P2002' };
      }
      const created: CategoryRow = { id: `c_${data.length + 1}`, name, createdAt: new Date() };
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

  return { repo, data };
}

function makeCategoryRepoWithThrow(throwValue: unknown): CategoryRepository {
  return {
    create: async () => {
      throw throwValue;
    },
    findById: async () => null,
    list: async () => [],
    deleteById: async () => {},
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
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('  Food  ');
    expect(created.name).toBe('Food');
  });

  it('rejects empty name', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.createCategory('   ')).rejects.toBeInstanceOf(HttpError);
    await expect(service.createCategory('   ')).rejects.toMatchObject({
      statusCode: 400,
      message: 'name is required',
    });
  });

  it('treats undefined name as 400 with correct message', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.createCategory(undefined)).rejects.toMatchObject({
      statusCode: 400,
      message: 'name is required',
    });
  });

  it('returns 409 on duplicate name with message', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await service.createCategory('Food');
    await expect(service.createCategory('Food')).rejects.toMatchObject({
      statusCode: 409,
      message: 'category already exists',
    });
  });

  it('lists categories', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await service.createCategory('A');
    await service.createCategory('B');

    const list = await service.listCategories();
    expect(list.map(c => c.name)).toEqual(['A', 'B']);
  });

  it('deletes category when no items', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('Food');
    await service.deleteCategory(created.id);

    const list = await service.listCategories();
    expect(list).toHaveLength(0);
  });

  it('returns 404 when deleting missing category with message', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.deleteCategory('missing')).rejects.toMatchObject({
      statusCode: 404,
      message: 'category not found',
    });
  });

  it('returns 409 when category has items with message', async () => {
    const { repo: categoryRepo } = makeCategoryRepo();
    const itemRepo = makeItemRepo(id => (id === 'c_1' ? 1 : 0));
    const service = new CategoryService(categoryRepo, itemRepo);

    const created = await service.createCategory('Food');
    await expect(service.deleteCategory(created.id)).rejects.toMatchObject({
      statusCode: 409,
      message: 'category is used by items',
    });
  });

  it('rethrows non-P2002 errors (not converted to 409)', async () => {
    const categoryRepo = makeCategoryRepoWithThrow(new Error('boom'));
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.createCategory('Food')).rejects.toMatchObject({
      message: 'boom',
    });
  });

  it('does not crash when repo throws a string (rethrows as-is)', async () => {
    const categoryRepo = makeCategoryRepoWithThrow('oops');
    const itemRepo = makeItemRepo(() => 0);
    const service = new CategoryService(categoryRepo, itemRepo);

    await expect(service.createCategory('Food')).rejects.toBe('oops');
  });
});
