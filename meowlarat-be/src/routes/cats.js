import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function catRoutes(fastify, options) {
  
  // 1. GET SEMUA KUCING AVAILABLE
  fastify.get('/', async (request, reply) => {
    try {
      const cats = await prisma.cat.findMany({
        where: { isAdopted: false }, 
        orderBy: { id: 'desc' }
      });
      return cats;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil data', error: error.message });
    }
  });

  // 2. GET LIST "LIST KUCING ANDA" (Gabungan Pending & Siap Diambil)
  // Kriteria: isAdopted = true DAN isTaken = false
  // (Tidak peduli adoptdate null atau tidak, selama belum diambil, masuk sini)
  fastify.get('/pending/:username', async (request, reply) => {
    const { username } = request.params;
    try {
      const pendingCats = await prisma.cat.findMany({
        where: { 
          isAdopted: true,
          adopter: username,
          isTaken: false // Penting: Hanya yang belum diklik "Ambil"
        },
        orderBy: { id: 'desc' }
      });
      return pendingCats;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil data pending', error: error.message });
    }
  });

  // 3. GET LIST "SEJARAH ADOPSI" (Selesai)
  // Kriteria: isAdopted = true DAN isTaken = true (Sudah diambil user)
  fastify.get('/history/:username', async (request, reply) => {
    const { username } = request.params;
    try {
      const historyCats = await prisma.cat.findMany({
        where: { 
          isAdopted: true,
          adopter: username,
          isTaken: true // Penting: Hanya yang sudah diambil
        },
        orderBy: { adoptdate: 'desc' }
      });
      return historyCats;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil history', error: error.message });
    }
  });

  // ... (Endpoint GET /:id dan POST / tetap sama, tidak perlu diubah) ...
  // 4. GET DETAIL KUCING
  fastify.get('/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      const cat = await prisma.cat.findUnique({ where: { id: Number(id) } });
      if (!cat) return reply.code(404).send({ message: 'Kucing tidak ditemukan' });
      return cat;
    } catch (error) {
      return reply.code(500).send({ message: 'Error server' });
    }
  });

  // 5. TAMBAH KUCING BARU
  fastify.post('/', async (request, reply) => {
    const { nama, age, gender, ras, karakteristik, img_url, isVaccinated } = request.body;
    const isVaccinatedBool = String(isVaccinated).toLowerCase() === 'true';

    try {
      const newCat = await prisma.cat.create({
        data: {
          nama, age, gender, ras, karakteristik, img_url,
          isVaccinated: isVaccinatedBool, 
          isAdopted: false,
          isTaken: false // Default false
        }
      });
      return newCat;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal menambah kucing', error: error.message });
    }
  });

  // 6. USER REQUEST ADOPSI
  fastify.put('/adopt/:id', async (request, reply) => {
    const { id } = request.params;
    const { username } = request.body;

    if (!username) return reply.code(400).send({ message: 'Username wajib diisi' });

    try {
      const currentCat = await prisma.cat.findUnique({ where: { id: Number(id) } });
      if (!currentCat) return reply.code(404).send({ message: 'Kucing tidak ditemukan' });
      if (currentCat.isAdopted) return reply.code(400).send({ message: 'Kucing ini sudah diadopsi/pending' });

      const updatedCat = await prisma.cat.update({
        where: { id: Number(id) },
        data: {
          isAdopted: true,
          adopter: username,
          adoptdate: null,
          isTaken: false
        }
      });

      return { message: 'Permintaan adopsi dikirim.', data: updatedCat };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal memproses adopsi', error: error.message });
    }
  });

  // 7. ADMIN VERIFIKASI ADOPSI (Hanya set tanggal, BELUM pindah ke history user)
  fastify.put('/verify/:id', async (request, reply) => {
    const { id } = request.params;
    const { date } = request.body; 

    try {
      const updatedCat = await prisma.cat.update({
        where: { id: Number(id) },
        data: {
          adoptdate: date ? new Date(date) : new Date() 
          // isTaken tetap false
        }
      });
      return { message: 'Adopsi diverifikasi', data: updatedCat };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal verifikasi', error: error.message });
    }
  });

  // 8. BARU: USER KLIK TOMBOL "AMBIL" (Pindah ke History)
  fastify.put('/take/:id', async (request, reply) => {
    const { id } = request.params;

    try {
      const updatedCat = await prisma.cat.update({
        where: { id: Number(id) },
        data: {
          isTaken: true // Ini yang memindahkan ke history di mata user
        }
      });
      return { message: 'Kucing berhasil diambil!', data: updatedCat };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal mengambil kucing', error: error.message });
    }
  });
}

export default catRoutes;