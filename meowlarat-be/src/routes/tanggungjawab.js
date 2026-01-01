import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';
import { fileURLToPath } from 'url';
import { PrismaClient } from '@prisma/client'; // <--- TAMBAHAN PENTING

// Setup
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const pump = util.promisify(pipeline);
const prisma = new PrismaClient(); // <--- INISIALISASI PRISMA

async function tanggungJawabRoutes(fastify, options) {
  
  // POST: Upload Laporan (3 Foto untuk Minggu Tertentu)
  fastify.post('/', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    const parts = request.parts();
    
    let cat_id, week;
    let img_makanan, img_aktivitas, img_kotoran;

    // 1. Proses Upload File & Field
    for await (const part of parts) {
      if (part.file) {
        const timestamp = Date.now();
        const ext = path.extname(part.filename);
        // Nama file: tj-{fieldname}-{timestamp}.ext
        const filename = `tj-${part.fieldname}-${timestamp}${ext}`;
        
        // Pastikan folder upload ada
        const uploadDir = path.join(__dirname, '../../uploads/img-tanggungjawab');
        if (!fs.existsSync(uploadDir)){
            fs.mkdirSync(uploadDir, { recursive: true });
        }

        const savePath = path.join(uploadDir, filename);
        
        await pump(part.file, fs.createWriteStream(savePath));

        if (part.fieldname === 'bukti_makanan') img_makanan = filename;
        if (part.fieldname === 'bukti_aktivitas') img_aktivitas = filename;
        if (part.fieldname === 'bukti_kotoran') img_kotoran = filename;

      } else {
        if (part.fieldname === 'cat_id') cat_id = parseInt(part.value);
        if (part.fieldname === 'week') week = parseInt(part.value);
      }
    }

    if (!cat_id || !week) {
        return reply.code(400).send({ message: 'Data tidak lengkap (cat_id/week)' });
    }

    // 2. Tentukan Kolom Database Mana yang Diupdate Berdasarkan Minggu
    let updateData = {};
    if (week === 1) {
        updateData = { 
            gambarmakanan1: img_makanan, 
            gambaraktivitas1: img_aktivitas, 
            gambarkotoran1: img_kotoran 
        };
    } else if (week === 2) {
        updateData = { 
            gambarmakanan2: img_makanan, 
            gambaraktivitas2: img_aktivitas, 
            gambarkotoran2: img_kotoran 
        };
    } else if (week === 3) {
        updateData = { 
            gambarmakanan3: img_makanan, 
            gambaraktivitas3: img_aktivitas, 
            gambarkotoran3: img_kotoran 
        };
    }

    try {
      // 3. Cek Apakah Data Sudah Ada untuk Kucing Ini
      // GUNAKAN 'prisma' (bukan fastify.prisma)
      const existingReport = await prisma.tanggungjawab.findFirst({
        where: { id_cat: cat_id }
      });

      let laporan;
      if (existingReport) {
        // UPDATE: Jika sudah ada (misal minggu lalu sudah isi), update kolom minggu ini
        laporan = await prisma.tanggungjawab.update({
          where: { id: existingReport.id },
          data: updateData
        });
      } else {
        // CREATE: Jika belum ada sama sekali, buat baru
        laporan = await prisma.tanggungjawab.create({
          data: {
            id_cat: cat_id,
            ...updateData
          }
        });
      }

      return { message: `Laporan Minggu ${week} berhasil disimpan`, data: laporan };

    } catch (error) {
      console.error("Error Saving Report:", error);
      return reply.code(500).send({ message: 'Gagal menyimpan laporan', error: error.message });
    }
  });

  // GET: Ambil Data Laporan Kucing Tertentu
  fastify.get('/:catId', async (request, reply) => {
    const { catId } = request.params;
    try {
      const report = await prisma.tanggungjawab.findFirst({
        where: { id_cat: parseInt(catId) }
      });
      return report || {}; // Kembalikan object kosong jika belum ada
    } catch (error) {
      console.error(error);
      return reply.code(500).send({ message: 'Error mengambil data' });
    }
  });
}

export default tanggungJawabRoutes;