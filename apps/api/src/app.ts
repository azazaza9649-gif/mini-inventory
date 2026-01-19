import Fastify from 'fastify';
import type { FastifyInstance } from 'fastify';

import type { PrismaClient } from '@prisma/client';
import { HttpError } from './errors';
import { createRepositories } from './repositories/prisma';
import { CategoryService } from './services/category.service';
import { ItemService } from './services/item.service';

export function createApp(prisma: PrismaClient): FastifyInstance {
  const app = Fastify({ logger: true });

  app.setErrorHandler((error, _req, reply) => {
    if (error instanceof HttpError) {
      return reply.code(error.statusCode).send({ error: error.message });
    }

    app.log.error(error);
    return reply.code(500).send({ error: 'internal error' });
  });

  app.get('/health', async () => ({ ok: true }));

  const repos = createRepositories(prisma);
  const categoryService = new CategoryService(repos.category, repos.item);
  const itemService = new ItemService(repos.item, repos.category);

  app.post('/categories', async (req, reply) => {
    const body = req.body as { name?: string };
    const category = await categoryService.createCategory(body?.name);
    return reply.code(201).send(category);
  });

  app.get('/categories', async () => categoryService.listCategories());

  app.delete('/categories/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await categoryService.deleteCategory(id);
    return reply.code(204).send();
  });

  app.post('/items', async (req, reply) => {
    const body = req.body as { name?: string; quantity?: number; categoryId?: string };
    const item = await itemService.createItem(body);
    return reply.code(201).send(item);
  });

  app.get('/items', async req => {
    const query = req.query as Partial<{ categoryId: string }>;
    return itemService.listItems({ categoryId: query.categoryId });
  });

  app.delete('/items/:id', async (req, reply) => {
    const { id } = req.params as { id: string };
    await itemService.deleteItem(id);
    return reply.code(204).send();
  });

  return app;
}
