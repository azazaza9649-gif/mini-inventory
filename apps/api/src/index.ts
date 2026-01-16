import Fastify from "fastify";

async function main(): Promise<void> {
  const app = Fastify({ logger: true });

  app.get("/health", async () => ({ ok: true }));

  const port = Number(process.env.PORT ?? 3000);
  await app.listen({ host: "0.0.0.0", port });
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
