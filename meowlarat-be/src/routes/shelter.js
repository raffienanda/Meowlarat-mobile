// meowlarat-be/src/routes/shelter.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function shelterRoutes(fastify, options) {
  
  // GET /api/shelter
  fastify.get('/', async (request, reply) => {
    try {
      const shelters = await prisma.shelter.findMany({
        orderBy: {
          id: 'asc' // Atau 'desc' tergantung kebutuhan
        }
      });
      return shelters;
    } catch (error) {
      fastify.log.error(error);
      return reply.status(500).send({ error: "Gagal mengambil data shelter" });
    }
  });

}

export default shelterRoutes;