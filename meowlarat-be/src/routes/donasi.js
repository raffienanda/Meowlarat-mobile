import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);
const prisma = new PrismaClient();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, '../../uploads/img-donasi');

if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

async function donasiRoutes(fastify, options) {
  
  // 1. GET SEMUA DONASI (Untuk Tab "Semua")
  fastify.get('/', async (request, reply) => {
    try {
      // Ambil data donasi dari database, urutkan dari yang terbaru
      const listDonasi = await prisma.donasi.findMany({
        orderBy: { id: 'desc' },
        include: {
          metode_donasi_metodeTometode: true // Ambil nama bank/metode pembayaran
        }
      });

      // Hitung total nominal semua donasi
      const total = listDonasi.reduce((acc, curr) => acc + curr.nominal, 0);

      return reply.send({ 
        status: 'success', 
        data: listDonasi, 
        total: total 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil data donasi' });
    }
  });

  // 2. GET RIWAYAT DONASI USER (BARU: Untuk Tab "Saya")
  // Endpoint ini yang sebelumnya hilang, makanya riwayat tidak tampil.
  fastify.get('/history/:username', async (request, reply) => {
    const { username } = request.params;
    try {
      const listDonasi = await prisma.donasi.findMany({
        where: { username: username }, // Filter khusus user ini
        orderBy: { id: 'desc' },
        include: {
          metode_donasi_metodeTometode: true
        }
      });

      return reply.send({ 
        status: 'success', 
        data: listDonasi 
      });
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil riwayat donasi user' });
    }
  });

  // 3. POST DONASI BARU
  fastify.post('/', async (request, reply) => {
    try {
      const parts = request.parts();
      let fields = {};
      let fileName = null;

      for await (const part of parts) {
        if (part.file) {
          const timestamp = Date.now();
          const ext = path.extname(part.filename);
          fileName = `bukti-${timestamp}${ext}`;
          const savePath = path.join(uploadDir, fileName);
          await pump(part.file, fs.createWriteStream(savePath));
        } else {
          fields[part.fieldname] = part.value;
        }
      }

      const nominalInt = parseInt(fields.nominal);
      const metodeInt = parseInt(fields.metode);

      const newDonasi = await prisma.donasi.create({
        data: {
          nominal: nominalInt,
          pesan: fields.pesan || '-',
          metode: metodeInt,
          username: fields.username, 
          bukti_transfer: fileName,
          status: 'PENDING' // Default status biar user tau donasinya belum diverifikasi
        }
      });

      return reply.send({ status: 'success', data: newDonasi });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal memproses donasi', error: error.message });
    }
  });
}

export default donasiRoutes;