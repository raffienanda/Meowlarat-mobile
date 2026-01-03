import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);
const prisma = new PrismaClient();

async function laporRoutes(fastify, options) {

  // 1. BUAT LAPORAN BARU (POST)
  fastify.post('/', async (request, reply) => {
    try {
      const parts = request.parts();
      let body = {};
      let uploadedFileName = null;

      for await (const part of parts) {
        if (part.file) {
          const extension = path.extname(part.filename);
          const filename = `lapor-${Date.now()}${extension}`;
          const savePath = path.join(process.cwd(), 'uploads/img-lapor', filename);

          await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
          await pump(part.file, fs.createWriteStream(savePath));
          uploadedFileName = filename;
        } else {
          body[part.fieldname] = part.value;
        }
      }

      // PERBAIKAN: Pakai 'prisma.laporan' (sesuai nama tabelmu)
      const newReport = await prisma.laporan.create({
        data: {
          username: body.username,
          judul: body.judul,
          isi: body.isi,
          location: body.location || "-",
          img_url: uploadedFileName || "default-lapor.png",
          date: new Date(),
          status: 'PENDING', 
          response: '-'
        }
      });

      return { success: true, message: 'Laporan berhasil dikirim!', data: newReport };

    } catch (error) {
      console.error(error);
      return reply.code(500).send({ message: 'Gagal mengirim laporan', error: error.message });
    }
  });

  // 2. GET RIWAYAT LAPORAN USER (GET)
  fastify.get('/history/:username', async (request, reply) => {
    const { username } = request.params;
    try {
      // PERBAIKAN: Pakai 'prisma.laporan'
      const reports = await prisma.laporan.findMany({
        where: { username: username },
        orderBy: { date: 'desc' }
      });
      return reports;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal mengambil riwayat', error: error.message });
    }
  });

  // 3. GET SEMUA LAPORAN (UNTUK ADMIN & FEED WARGA)
  fastify.get('/all', async (request, reply) => {
    try {
      // PERBAIKAN: Pakai 'prisma.laporan'
      const reports = await prisma.laporan.findMany({
        orderBy: { date: 'desc' },
        include: { users: true } // Relasi ke tabel 'users'
      });
      return reports;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal ambil data', error: error.message });
    }
  });

  // 4. UPDATE STATUS LAPORAN (UNTUK ADMIN)
  fastify.put('/status/:id', async (request, reply) => {
    const { id } = request.params;
    const { status, response } = request.body; 

    try {
      // PERBAIKAN: Pakai 'prisma.laporan'
      const updated = await prisma.laporan.update({
        where: { id: Number(id) },
        data: { 
          status: status,
          response: response || undefined 
        }
      });
      return { success: true, message: 'Status laporan diupdate', data: updated };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal update status', error: error.message });
    }
  });

}

export default laporRoutes;