// src/routes/lapor.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import util from 'util';
import { pipeline } from 'stream';
import path from 'path';
import { fileURLToPath } from 'url';

const pump = util.promisify(pipeline);
const prisma = new PrismaClient();

// Setup path untuk ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function routes(fastify, options) {
  fastify.post('/', async (request, reply) => {
    try {
      // Folder tujuan: meowlarat-be/uploads/lapor
      const uploadDir = path.join(__dirname, '../../uploads/img-lapor');
      
      // Buat folder jika belum ada
      if (!fs.existsSync(uploadDir)){
          fs.mkdirSync(uploadDir, { recursive: true });
      }

      const parts = request.parts();
      
      let category = '';
      let lokasi = '';
      let deskripsi = '';
      let notes = '';
      let img_url = ''; // Default jika user tidak upload foto

      // Loop semua field yang dikirim dari Frontend
      for await (const part of parts) {
        if (part.type === 'file') {
          // --- Proses File Gambar ---
          const fileExtension = path.extname(part.filename);
          const uniqueFileName = `lapor-${Date.now()}${fileExtension}`;
          const savePath = path.join(uploadDir, uniqueFileName);
          
          // Simpan file ke disk
          await pump(part.file, fs.createWriteStream(savePath));
          
          // Simpan URL gambar (sesuai setting prefix di server.js)
          img_url = `http://localhost:3000/uploads/img-lapor/${uniqueFileName}`;
          
        } else {
          // --- Proses Text Data ---
          // Pastikan nama field ini SAMA PERSIS dengan yang dikirim Frontend (FormData)
          if (part.fieldname === 'jenis_laporan') category = part.value;
          if (part.fieldname === 'lokasi_kucing') lokasi = part.value;
          if (part.fieldname === 'deskripsi_singkat') deskripsi = part.value;
          if (part.fieldname === 'catatan_tambahan') notes = part.value;
        }
      }

      // Validasi data minimal (sesuai prisma schema)
      if (!category || !lokasi || !deskripsi) {
        return reply.code(400).send({ message: 'Mohon lengkapi data wajib (Kategori, Lokasi, Deskripsi)' });
      }

      // Jika user tidak upload foto, gunakan placeholder
      if (!img_url) {
         img_url = 'https://placehold.co/600x400?text=No+Image';
      }

      // Simpan ke Database
      const newLaporan = await prisma.laporan.create({
        data: {
          category,
          lokasi,
          deskripsi,
          img_url,
          notes: notes || '', // Default string kosong jika notes tidak ada
        },
      });

      return reply.code(201).send({
        message: 'Laporan berhasil dikirim!',
        data: newLaporan
      });

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Terjadi kesalahan server', error: error.message });
    }
  });
}

export default routes;