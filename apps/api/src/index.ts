import 'dotenv/config';
import { prisma } from './db';
import { createApp } from './app';

async function main(): Promise<void> {
  const app = createApp(prisma);

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
