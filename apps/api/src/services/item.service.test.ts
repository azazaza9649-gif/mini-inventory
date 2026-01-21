import { describe, expect, it } from 'vitest';
import { ItemService } from './item.service';
import { type CategoryRepository, type ItemRepository } from '../repositories/types';

function makeCategoryRepo(existsIds: Set<string>): CategoryRepository {
  return {
    create: async () => {
      throw new Error('not used');
    },
    findById: async id => (existsIds.has(id) ? { id, name: 'C', createdAt: new Date() } : null),
    list: async () => [],
    deleteById: async () => {},
  };
}

function makeItemRepo(): {
  repo: ItemRepository;
  calls: {
    created?: { name: string; quantity: number; categoryId: string };
    listedFilter?: { categoryId?: string };
    deletedId?: string;
    findId?: string;
  };
} {
  const calls: {
    created?: { name: string; quantity: number; categoryId: string };
    listedFilter?: { categoryId?: string };
    deletedId?: string;
    findId?: string;
  } = {};

  const repo: ItemRepository = {
    create: async data => {
      expect(data).toEqual(
        expect.objectContaining({
          name: expect.any(String),
          quantity: expect.any(Number),
          categoryId: expect.any(String),
        }),
      );

      calls.created = data;
      return {
        id: 'i1',
        name: data.name,
        quantity: data.quantity,
        categoryId: data.categoryId,
        createdAt: new Date(),
      };
    },
    findById: async id => {
      calls.findId = id;
      return id === 'exists'
        ? {
            id: 'exists',
            name: 'X',
            quantity: 1,
            categoryId: 'c1',
            createdAt: new Date(),
          }
        : null;
    },
    list: async filter => {
      calls.listedFilter = filter ?? {};
      return [
        {
          id: 'i1',
          name: 'X',
          quantity: 1,
          categoryId: filter?.categoryId ?? 'c1',
          createdAt: new Date(),
        },
      ];
    },
    deleteById: async id => {
      calls.deletedId = id;
    },
    countByCategoryId: async () => 0,
  };

  return { repo, calls };
}

describe('ItemService', () => {
  it('rejects empty or undefined name with message', async () => {
    const { repo } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    await expect(
      service.createItem({ name: undefined, quantity: 1, categoryId: 'c1' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'name is required',
    });

    await expect(
      service.createItem({ name: '   ', quantity: 1, categoryId: 'c1' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'name is required',
    });
  });

  it('rejects non-number or negative quantity with message', async () => {
    const { repo } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    await expect(
      service.createItem({ name: 'X', quantity: -1, categoryId: 'c1' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'quantity must be a non-negative number',
    });

    await expect(
      service.createItem({ name: 'X', quantity: undefined, categoryId: 'c1' }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'quantity must be a non-negative number',
    });
  });

  it('rejects missing categoryId with message', async () => {
    const { repo } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    await expect(
      service.createItem({ name: 'X', quantity: 1, categoryId: undefined }),
    ).rejects.toMatchObject({
      statusCode: 400,
      message: 'categoryId is required',
    });
  });

  it('returns 404 when category does not exist', async () => {
    const { repo } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set()));

    await expect(
      service.createItem({ name: 'X', quantity: 1, categoryId: 'c1' }),
    ).rejects.toMatchObject({
      statusCode: 404,
      message: 'category not found',
    });
  });

  it('creates item and passes correct data to repo', async () => {
    const { repo, calls } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    const created = await service.createItem({
      name: '  Bread  ',
      quantity: 2,
      categoryId: 'c1',
    });

    expect(created.name).toBe('Bread');
    expect(calls.created).toEqual({ name: 'Bread', quantity: 2, categoryId: 'c1' });
  });

  it('listItems forwards filter to repo', async () => {
    const { repo, calls } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    const items = await service.listItems({ categoryId: 'c1' });
    expect(items.length).toBe(1);
    expect(calls.listedFilter).toEqual({ categoryId: 'c1' });
  });

  it('deleteItem returns 404 when item missing, otherwise deletes', async () => {
    const { repo, calls } = makeItemRepo();
    const service = new ItemService(repo, makeCategoryRepo(new Set(['c1'])));

    await expect(service.deleteItem('missing')).rejects.toMatchObject({
      statusCode: 404,
      message: 'item not found',
    });

    await service.deleteItem('exists');
    expect(calls.deletedId).toBe('exists');
  });
});
