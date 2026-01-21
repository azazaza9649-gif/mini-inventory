import { describe, expect, it, beforeAll, afterAll, beforeEach } from 'vitest';
import { PrismaClient } from '@prisma/client';
import { createApp } from '../app';
import { resetDb } from '../test-utils/reset-db';

const prisma = new PrismaClient();

describe('API E2E', () => {
  const app = createApp(prisma);

  beforeAll(async () => {
    await app.ready();
  });

  afterAll(async () => {
    await app.close();
    await prisma.$disconnect();
  });

  beforeEach(async () => {
    await resetDb(prisma);
  });

  it('creates category, creates item, blocks deleting category with items', async () => {
    const cRes = await app.inject({
      method: 'POST',
      url: '/categories',
      payload: { name: 'Food' },
    });

    expect(cRes.statusCode).toBe(201);
    const category = cRes.json() as { id: string };

    const iRes = await app.inject({
      method: 'POST',
      url: '/items',
      payload: { name: 'Bread', quantity: 2, categoryId: category.id },
    });
    expect(iRes.statusCode).toBe(201);

    const delCatRes = await app.inject({
      method: 'DELETE',
      url: `/categories/${category.id}`,
    });
    expect(delCatRes.statusCode).toBe(409);
  });

  it('filters items by categoryId', async () => {
    const c1 = (
      await app.inject({ method: 'POST', url: '/categories', payload: { name: 'A' } })
    ).json() as { id: string };
    const c2 = (
      await app.inject({ method: 'POST', url: '/categories', payload: { name: 'B' } })
    ).json() as { id: string };

    await app.inject({
      method: 'POST',
      url: '/items',
      payload: { name: 'X', quantity: 1, categoryId: c1.id },
    });
    await app.inject({
      method: 'POST',
      url: '/items',
      payload: { name: 'Y', quantity: 1, categoryId: c2.id },
    });

    const res = await app.inject({ method: 'GET', url: `/items?categoryId=${c1.id}` });
    expect(res.statusCode).toBe(200);

    const items = res.json() as Array<{ categoryId: string }>;
    expect(items.length).toBe(1);
    expect(items[0]?.categoryId).toBe(c1.id);
  });
});
