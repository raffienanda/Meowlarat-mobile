import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function statsRoutes(fastify, options) {
  
  fastify.get('/', async (request, reply) => {
    try {
      // 1. Hitung "Siap Adopsi" (ready)
      // Syarat: Belum diadopsi (false/null) DAN Belum diambil orang (isTaken false)
      const readyCount = await prisma.cat.count({
        where: {
          AND: [
            { 
              OR: [
                { isAdopted: false },
                { isAdopted: null }
              ] 
            },
            { isTaken: false }
          ]
        }
      });

      // 2. Hitung "Teradopsi" (adopted)
      const adoptedCount = await prisma.cat.count({
        where: { isAdopted: true }
      });

      // 3. Hitung "Mitra Shelter" (shelters)
      const shelterCount = await prisma.shelter.count();

      // PENTING: Nama key di sini HARUS sama dengan state di Frontend (beranda.tsx)
      return { 
        ready: readyCount,      // Frontend pakai stats.ready
        adopted: adoptedCount,  // Frontend pakai stats.adopted
        shelters: shelterCount  // Frontend pakai stats.shelters
      };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil statistik' });
    }
  });
}

export default statsRoutes;