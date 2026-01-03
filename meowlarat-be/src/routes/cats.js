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

  // 2. GET LIST "STATUS ADOPSI" (Gabungan Antrian & Menunggu Jemput)
  // REVISI: Sekarang ambil dari tabel 'adoption_requests'
  fastify.get('/pending/:username', async (request, reply) => {
    const { username } = request.params;
    try {
      // Cari request user yang masih PENDING atau APPROVED (tapi kucing belum taken)
      const requests = await prisma.adoption_requests.findMany({
        where: { 
          username: username,
          status: { in: ['PENDING', 'APPROVED'] } 
        },
        include: { cat: true }, // Sertakan data kucingnya
        orderBy: { date: 'desc' }
      });

      // KITA MAPPING AGAR FORMATNYA SAMA DENGAN FORMAT 'CAT' DI FRONTEND
      // Supaya frontend tidak perlu rombak codingan list
      const formattedData = requests
        .filter(req => !req.cat.isTaken) // Filter: kalau sudah diambil (isTaken), jangan muncul disini (masuk history)
        .map(req => {
          return {
            ...req.cat, // Ambil semua data kucing
            // Timpa field tertentu sesuai status request
            // Jika APPROVED, pastikan adoptdate ada. Jika PENDING, null.
            adoptdate: req.status === 'APPROVED' ? (req.cat.adoptdate || new Date()) : null,
            status_request: req.status // Info tambahan kalau butuh
          };
        });

      return formattedData;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil data pending', error: error.message });
    }
  });

  // 3. GET LIST "SEJARAH ADOPSI" (Selesai)
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

  // ==========================================
  // 9. API ADMIN: AMBIL DAFTAR ANTRIAN (DIPINDAHKAN KE SINI)
  // ==========================================
  // WAJIB ditaruh SEBELUM route '/:id' agar tidak bentrok
  fastify.get('/requests', async (request, reply) => {
    try {
      const requests = await prisma.adoption_requests.findMany({
        where: { status: 'PENDING' },
        include: {
          cat: true,  // Sertakan data kucing
          user: true  // Sertakan data user (buat liat gaji, pekerjaan)
        },
        orderBy: { date: 'desc' }
      });
      return requests;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal ambil data request', error: error.message });
    }
  });

  // 4. GET DETAIL KUCING
  // (Endpoint ini menangkap semua pola /:id, makanya /requests harus di atasnya)
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

  // 6. USER REQUEST ADOPSI (REVISI: BISA DAFTAR LAGI KALAU DITOLAK)
  fastify.put('/adopt/:id', async (request, reply) => {
    const { id } = request.params;
    const { username, message } = request.body; 

    if (!username) return reply.code(400).send({ message: 'Username wajib diisi' });

    try {
      const catId = Number(id);

      // A. Validasi User & Profil
      const user = await prisma.users.findUnique({ where: { username: username } });
      if (!user) return reply.code(404).send({ message: 'User tidak ditemukan' });

      const isProfileIncomplete = 
        !user.gaji || user.gaji === 0 || 
        !user.pekerjaan || user.pekerjaan === "-" || user.pekerjaan.trim() === "";

      if (isProfileIncomplete) {
        return reply.code(400).send({ 
          success: false,
          code: 'PROFILE_INCOMPLETE', 
          message: 'Profil belum lengkap.' 
        });
      }

      // B. Cek Kucing
      const currentCat = await prisma.cat.findUnique({ where: { id: catId } });
      if (!currentCat) return reply.code(404).send({ message: 'Kucing tidak ditemukan' });
      
      // Jika kucing sudah resmi diadopsi orang lain, tolak
      if (currentCat.isAdopted) {
          return reply.code(400).send({ message: 'Yah, kucing ini sudah diadopsi orang lain 😢' });
      }

      // C. CEK STATUS REQUEST SEBELUMNYA
      const existingRequest = await prisma.adoption_requests.findUnique({
        where: {
          username_cat_id: {
            username: username,
            cat_id: catId
          }
        }
      });

      if (existingRequest) {
        // KASUS 1: Masih Pending -> Gak boleh spam
        if (existingRequest.status === 'PENDING') {
            return reply.code(400).send({ message: 'Sabar ya, pengajuanmu sedang direview admin.' });
        }
        // KASUS 2: Sudah Approved -> Gak perlu request lagi
        if (existingRequest.status === 'APPROVED') {
            return reply.code(400).send({ message: 'Kamu sudah disetujui untuk kucing ini!' });
        }
        // KASUS 3: REJECTED -> BOLEH COBA LAGI (Update jadi PENDING)
        if (existingRequest.status === 'REJECTED') {
            await prisma.adoption_requests.update({
                where: { id: existingRequest.id },
                data: {
                    status: 'PENDING',
                    message: message || "Saya mencoba mengajukan lagi 🙏",
                    date: new Date() // Reset tanggal biar naik ke atas di list admin
                }
            });
            return { success: true, message: 'Pengajuan dikirim ulang! Semoga kali ini beruntung 🤞' };
        }
      }

      // D. REQUEST BARU (Belum pernah request sama sekali)
      await prisma.adoption_requests.create({
        data: {
          cat_id: catId,
          username: username,
          message: message || "Saya berminat adopsi",
          status: "PENDING"
        }
      });

      return { success: true, message: 'Permintaan adopsi berhasil dikirim! Tunggu kabar dari admin.' };

    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal memproses adopsi', error: error.message });
    }
  });

  // 7. ADMIN VERIFIKASI ADOPSI (OPSIONAL - Digantikan fitur Approve di bawah)
  fastify.put('/verify/:id', async (request, reply) => {
    const { id } = request.params;
    const { date } = request.body; 

    try {
      const updatedCat = await prisma.cat.update({
        where: { id: Number(id) },
        data: {
          adoptdate: date ? new Date(date) : new Date() 
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

  // ==========================================
  // 10. API ADMIN: APPROVE (TERIMA) PELAMAR
  // (Pastikan ini ada di file kamu untuk logic Auto-Reject)
  fastify.put('/requests/approve/:id', async (request, reply) => {
    const { id } = request.params; 
    try {
      const requestId = Number(id);

      const targetRequest = await prisma.adoption_requests.findUnique({
        where: { id: requestId }
      });

      if (!targetRequest) return reply.code(404).send({ message: 'Request tidak ditemukan' });

      // Transaksi Database: Approve 1, Reject Sisanya
      await prisma.$transaction([
        // 1. Ubah status request ini jadi APPROVED
        prisma.adoption_requests.update({
          where: { id: requestId },
          data: { status: 'APPROVED' }
        }),

        // 2. OTOMATIS REJECT PELAMAR LAIN untuk kucing ini
        prisma.adoption_requests.updateMany({
          where: { 
            cat_id: targetRequest.cat_id,
            id: { not: requestId } // Kecuali ID yang diterima
          },
          data: { status: 'REJECTED' }
        }),

        // 3. Kunci Kucing (isAdopted = true)
        prisma.cat.update({
          where: { id: targetRequest.cat_id },
          data: {
            isAdopted: true,
            adopter: targetRequest.username,
            adoptdate: new Date(),
            isTaken: false 
          }
        })
      ]);

      return { success: true, message: 'Adopsi disetujui! Kandidat lain otomatis ditolak.' };

    } catch (error) {
      console.error(error);
      return reply.code(500).send({ message: 'Gagal approve', error: error.message });
    }
  });

  // ==========================================
  // 11. API ADMIN: REJECT (TOLAK) PELAMAR
  // ==========================================
  fastify.put('/requests/reject/:id', async (request, reply) => {
    const { id } = request.params;
    try {
      await prisma.adoption_requests.update({
        where: { id: Number(id) },
        data: { status: 'REJECTED' }
      });
      return { success: true, message: 'Permintaan ditolak.' };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal menolak', error: error.message });
    }
  });
}

export default catRoutes;