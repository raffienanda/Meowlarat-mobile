// meowlarat-be/src/routes/stats.js

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function statsRoutes(fastify, options) {
  
  fastify.get('/', async (request, reply) => {
    try {
      // 1. Hitung Kucing Tersedia (Hapus tanda kutip pada false)
      const availableCats = await prisma.cat.count({
        where: { isAdopted: false } 
      });

      // 2. Hitung Kucing Sudah Diadopsi (Hapus tanda kutip pada true)
      const adoptedCats = await prisma.cat.count({
        where: { isAdopted: true }
      });

      // 3. Hitung Jumlah Shelter
      const shelters = await prisma.shelter.count();

      return { 
        available: availableCats, 
        adopted: adoptedCats, 
        shelterCount: shelters 
      };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil statistik' });
    }
  });
}

export default statsRoutes;