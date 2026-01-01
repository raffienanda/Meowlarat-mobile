import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';
import { PrismaClient } from '@prisma/client';

const pump = util.promisify(pipeline);
const prisma = new PrismaClient();

async function tanggungJawabRoutes(fastify, options) {
  
  fastify.post('/', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    // 1. Siapkan variabel penampung
    let cat_id;
    let week;
    let img_makanan = null, img_aktivitas = null, img_kotoran = null;

    try {
      const parts = request.parts();

      // 2. Loop semua part (File & Field)
      for await (const part of parts) {
        if (part.file) {
          // --- HANDLER FILE ---
          const timestamp = Date.now();
          const ext = path.extname(part.filename) || '.jpg'; // Fallback extension
          const filename = `tj-${part.fieldname}-${timestamp}${ext}`;

          // Gunakan process.cwd() agar path selalu relative dari root project
          const uploadDir = path.join(process.cwd(), 'uploads/img-tanggungjawab');
          
          if (!fs.existsSync(uploadDir)){
              fs.mkdirSync(uploadDir, { recursive: true });
          }

          const savePath = path.join(uploadDir, filename);
          
          // Simpan file
          await pump(part.file, fs.createWriteStream(savePath));

          // Assign nama file ke variabel
          if (part.fieldname === 'bukti_makanan') img_makanan = filename;
          if (part.fieldname === 'bukti_aktivitas') img_aktivitas = filename;
          if (part.fieldname === 'bukti_kotoran') img_kotoran = filename;

        } else {
          // --- HANDLER FIELD (Text) ---
          // part.value kadang terpotong di versi lama, tapi biasanya aman untuk ID pendek
          if (part.fieldname === 'cat_id') cat_id = parseInt(part.value);
          if (part.fieldname === 'week') week = parseInt(part.value);
        }
      }

      // 3. Validasi Data
      console.log(`Debug Upload: CatID=${cat_id}, Week=${week}`); // Cek di terminal server
      
      if (!cat_id || isNaN(cat_id) || !week || isNaN(week)) {
          return reply.code(400).send({ message: 'Data cat_id atau week tidak valid/kosong.' });
      }

      // 4. Siapkan Data untuk Prisma
      let updateData = {};
      
      // Helper untuk hanya memasukkan data yang ada (tidak null)
      const addIfExist = (field, val) => { if(val) updateData[field] = val; };

      if (week === 1) {
          addIfExist('gambarmakanan1', img_makanan);
          addIfExist('gambaraktivitas1', img_aktivitas);
          addIfExist('gambarkotoran1', img_kotoran);
      } else if (week === 2) {
          addIfExist('gambarmakanan2', img_makanan);
          addIfExist('gambaraktivitas2', img_aktivitas);
          addIfExist('gambarkotoran2', img_kotoran);
      } else if (week === 3) {
          addIfExist('gambarmakanan3', img_makanan);
          addIfExist('gambaraktivitas3', img_aktivitas);
          addIfExist('gambarkotoran3', img_kotoran);
      }

      // 5. Simpan ke Database
      const existingReport = await prisma.tanggungjawab.findFirst({
        where: { id_cat: cat_id }
      });

      let laporan;
      if (existingReport) {
        // UPDATE
        laporan = await prisma.tanggungjawab.update({
          where: { id: existingReport.id },
          data: updateData
        });
      } else {
        // CREATE (Pertama kali)
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
      return reply.code(500).send({ message: 'Internal Server Error', error: error.message });
    }
  });

  // GET Route tetap sama...
  fastify.get('/:catId', async (request, reply) => {
    const { catId } = request.params;
    try {
      const report = await prisma.tanggungjawab.findFirst({
        where: { id_cat: parseInt(catId) }
      });
      return report || {};
    } catch (error) {
      return reply.code(500).send({ message: 'Error mengambil data' });
    }
  });
}

export default tanggungJawabRoutes;