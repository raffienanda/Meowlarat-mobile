import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function findplaceRoutes(fastify, options) {
  
  // 1. Endpoint untuk Lokasi Peta (Physical Petplaces)
  // URL: /api/findplace
  fastify.get('/', async (request, reply) => {
    try {
      const places = await prisma.petplace.findMany();
      return places;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Gagal mengambil data lokasi" });
    }
  });

  // 2. Endpoint untuk Toko Online
  // URL: /api/findplace/online
  fastify.get('/online', async (request, reply) => {
    try {
      const onlineShops = await prisma.tokoonline.findMany();
      return onlineShops;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Gagal mengambil data toko online" });
    }
  });

}

export default findplaceRoutes;