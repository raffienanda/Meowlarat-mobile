import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer'; // Import Nodemailer
import crypto from 'crypto'; // Import Crypto bawaan Node.js untuk generate token

const prisma = new PrismaClient();

// Konfigurasi Transporter Email (Sesuaikan dengan email pengirimmu)
// Tips: Jika pakai Gmail, gunakan "App Password", bukan password login biasa.
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'emailmu@gmail.com', // GANTI DENGAN EMAIL PENGIRIM
    pass: 'password_app_kamu'  // GANTI DENGAN APP PASSWORD GMAIL
  }
});

async function authRoutes(fastify, options) {
  
  // REGISTER USER (KODE LAMA TETAP SAMA)
  fastify.post('/register', async (request, reply) => {
    const { username, email, nama, phone, password, bio, img_url } = request.body;

    if (!username || !email || !password || !nama) {
      return reply.code(400).send({ message: 'Username, Email, Nama, dan Password wajib diisi' });
    }

    const existingUser = await prisma.users.findFirst({
      where: { OR: [{ username: username }, { email: email }] }
    });

    if (existingUser) {
      return reply.code(400).send({ message: 'Username atau Email sudah terdaftar!' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    try {
      const newUser = await prisma.users.create({
        data: {
          username, email, nama, phone: phone || "-", password: hashedPassword, bio: bio || "-", img_url: img_url || "default.png"
        }
      });
      return { message: 'Registrasi berhasil', user: newUser.username };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mendaftar user', error: error.message });
    }
  });

  // LOGIN USER (KODE LAMA TETAP SAMA)
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;

    const user = await prisma.users.findUnique({ where: { username: username } });

    if (!user) {
      return reply.code(401).send({ message: 'Username atau password salah' });
    }

    const isValid = await bcrypt.compare(password, user.password);
    if (!isValid) {
      return reply.code(401).send({ message: 'Username atau password salah' });
    }

    const token = fastify.jwt.sign({ username: user.username, email: user.email, nama: user.nama });

    return { 
      message: 'Login berhasil', 
      token, 
      user: { username: user.username, nama: user.nama, img_url: user.img_url } 
    };
  });

  // === BAGIAN BARU: FORGOT PASSWORD ===
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body;

    console.log("1. Request masuk untuk email:", email);

    // 1. Cari user berdasarkan email
    const user = await prisma.users.findUnique({
      where: { email: email }
    });

    if (!user) {
      // Demi keamanan, jangan beri tahu jika email tidak ditemukan secara eksplisit
      return reply.code(404).send({ message: 'Jika email terdaftar, link reset akan dikirim.' });
    }

    // 2. Generate Token Random
    const token = crypto.randomBytes(20).toString('hex');
    
    // 3. Set waktu expired (contoh: 1 jam dari sekarang)
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    // 4. Simpan token ke database user tersebut
    await prisma.users.update({
      where: { email: email },
      data: {
        resetPasswordToken: token,
        resetPasswordExpires: expiryDate
      }
    });

    // 5. Kirim Email
    // Link frontend (sesuaikan port frontendmu, default Vue biasanya 5173 atau 8080)
    // Di file resetPassowrd.vue kamu pakai port frontend untuk membuka halamannya
    const resetUrl = `http://localhost:5173/reset-password?token=${token}`; 

    console.log("========================================");
    console.log("LINK RESET PASSWORD (COPAS KE BROWSER):");
    console.log(resetUrl);
    console.log("========================================");

    // const mailOptions = {
    //   from: 'MeowLarat Support <no-reply@meowlarat.com>',
    //   to: email,
    //   subject: 'Reset Password MeowLarat',
    //   text: `Kamu menerima email ini karena ada permintaan reset password.\n\n` +
    //         `Silakan klik link berikut untuk mereset password:\n\n${resetUrl}\n\n` +
    //         `Link ini berlaku selama 1 jam.\n` +
    //         `Jika kamu tidak meminta ini, abaikan saja.`
    // };

    // try {
    //   await transporter.sendMail(mailOptions);
    //   return { message: 'Link reset telah dikirim ke email Anda.' };
    // } catch (error) {
    //   console.error(error);
    //   return reply.code(500).send({ message: 'Gagal mengirim email' });
    // }
  });

  // === BAGIAN BARU: RESET PASSWORD ===
  fastify.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body;

    if (!token || !password) {
      return reply.code(400).send({ message: 'Token dan password baru diperlukan' });
    }

    // 1. Cari user dengan token tersebut DAN token belum expired
    const user = await prisma.users.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: {
          gt: new Date() // Expires harus lebih besar dari waktu sekarang (Greater Than)
        }
      }
    });

    if (!user) {
      return reply.code(400).send({ message: 'Token tidak valid atau sudah kadaluwarsa' });
    }

    // 2. Hash password baru
    const hashedPassword = await bcrypt.hash(password, 10);

    // 3. Update user: simpan password baru & hapus token
    await prisma.users.update({
      where: { username: user.username },
      data: {
        password: hashedPassword,
        resetPasswordToken: null,   // Hapus token agar tidak bisa dipakai lagi
        resetPasswordExpires: null
      }
    });

    return { message: 'Password berhasil diubah. Silakan login kembali.' };
  });

  // GET ME (KODE LAMA)
  fastify.get('/me', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    try {
      const username = request.user.username;
      const user = await prisma.users.findUnique({
        where: { username: username },
        include: { 
          cat: {
            where: {
              adoptdate: { not: null } // ✅ FILTER: Hanya ambil kucing yang punya tanggal adopsi
            }
          } 
        }
      });

      if (!user) return reply.code(404).send({ message: 'User tidak ditemukan' });
      delete user.password;
      return user;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal mengambil profil', error: error.message });
    }
  });

  // UPDATE ME (KODE LAMA)
  fastify.put('/me', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    const { nama, bio } = request.body;
    const username = request.user.username;
    try {
      const updatedUser = await prisma.users.update({
        where: { username: username },
        data: { nama: nama, bio: bio }
      });
      return { message: 'Profil berhasil diupdate', user: updatedUser };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal update profil', error: error.message });
    }
  });
}

export default authRoutes;