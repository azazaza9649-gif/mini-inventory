import 'dotenv/config';
import Fastify from 'fastify';
import { prisma } from './db';

type CreateCategoryBody = { name?: string };
type CreateItemBody = { name?: string; quantity?: number; categoryId?: string };

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  app.get('/health', async () => ({ ok: true }));

  // -------- Categories --------
  app.post('/categories', async (req, reply) => {
    const body = req.body as CreateCategoryBody;
    const name = body?.name?.trim();

    if (!name) return reply.code(400).send({ error: 'name is required' });

    try {
      const category = await prisma.category.create({
        data: { name },
      });
      return reply.code(201).send(category);
    } catch (err: unknown) {
      const code =
        typeof err === 'object' && err !== null && 'code' in err
          ? (err as { code?: unknown }).code
          : undefined;

      if (code === 'P2002') return reply.code(409).send({ error: 'category already exists' });
      throw err;
    }
  });

  app.get('/categories', async () => {
    return prisma.category.findMany({ orderBy: { createdAt: 'desc' } });
  });

  app.delete('/categories/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const category = await prisma.category.findUnique({ where: { id } });
    if (!category) return reply.code(404).send({ error: 'category not found' });

    const itemsCount = await prisma.item.count({ where: { categoryId: id } });
    if (itemsCount > 0) return reply.code(409).send({ error: 'category is used by items' });

    await prisma.category.delete({ where: { id } });
    return reply.code(204).send();
  });

  // -------- Items --------
  app.post('/items', async (req, reply) => {
    const body = req.body as CreateItemBody;

    const name = body?.name?.trim();
    const quantity = body?.quantity;
    const categoryId = body?.categoryId;

    if (!name) return reply.code(400).send({ error: 'name is required' });
    if (typeof quantity !== 'number' || quantity < 0)
      return reply.code(400).send({ error: 'quantity must be a non-negative number' });
    if (!categoryId) return reply.code(400).send({ error: 'categoryId is required' });

    const categoryExists = await prisma.category.findUnique({ where: { id: categoryId } });
    if (!categoryExists) return reply.code(404).send({ error: 'category not found' });

    const item = await prisma.item.create({
      data: { name, quantity, categoryId },
    });

    return reply.code(201).send(item);
  });

  app.get('/items', async req => {
    const query = req.query as Partial<{ categoryId: string }>;
    const categoryId = query.categoryId;

    return prisma.item.findMany({
      where: categoryId ? { categoryId } : undefined,
      orderBy: { createdAt: 'desc' },
    });
  });

  app.delete('/items/:id', async (req, reply) => {
    const { id } = req.params as { id: string };

    const item = await prisma.item.findUnique({ where: { id } });
    if (!item) return reply.code(404).send({ error: 'item not found' });

    await prisma.item.delete({ where: { id } });
    return reply.code(204).send();
  });

  // graceful shutdown
  app.addHook('onClose', async () => {
    await prisma.$disconnect();
  });

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ host: '0.0.0.0', port });
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
