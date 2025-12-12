import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function metodeRoutes(fastify, options) {
  // Get semua metode pembayaran
  fastify.get('/', async (request, reply) => {
    try {
      const methods = await prisma.metode.findMany({
        orderBy: {
          id: 'asc',
        },
      });
      return methods;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil data metode' });
    }
  });
}

export default metodeRoutes;