// meowlarat-be/src/routes/auth.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import fs from 'fs';
import path from 'path';
import util from 'util';
import { pipeline } from 'stream';

const pump = util.promisify(pipeline);
const prisma = new PrismaClient();

// Konfigurasi Email
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: 'emailmu@gmail.com', 
    pass: 'password_app_kamu'
  }
});

async function authRoutes(fastify, options) {
  
  // 1. REGISTER
  fastify.post('/register', async (request, reply) => {
    // Ambil alamat dari body
    const { username, email, nama, phone, password, bio, img_url, alamat } = request.body;

    if (!username || !email || !password || !nama || !alamat) {
      return reply.code(400).send({ message: 'Data wajib diisi semua (termasuk Alamat)' });
    }

    const existingUser = await prisma.users.findFirst({ where: { OR: [{ username }, { email }] } });
    if (existingUser) return reply.code(400).send({ message: 'Username atau Email sudah terdaftar!' });

    const hashedPassword = await bcrypt.hash(password, 10);
    try {
      const newUser = await prisma.users.create({
        data: { 
            username, email, nama, password: hashedPassword, 
            phone: phone || "-", 
            bio: bio || "-", 
            alamat: alamat, // Simpan alamat
            img_url: img_url || "default.png", 
            role: "USER" 
        }
      });
      return { message: 'Registrasi berhasil', user: newUser.username };
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal mendaftar', error: error.message });
    }
  });

  // 2. LOGIN
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    const user = await prisma.users.findUnique({ where: { username } });
    if (!user || !(await bcrypt.compare(password, user.password))) return reply.code(401).send({ message: 'Username atau password salah' });

    const token = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email, nama: user.nama, role: user.role });
    return { message: 'Login berhasil', token, user: { username: user.username, nama: user.nama, img_url: user.img_url, role: user.role } };
  });

  // 3. ME
  fastify.get('/me', { onRequest: [async (request) => await request.jwtVerify()] }, async (request, reply) => {
    try {
      const user = await prisma.users.findUnique({ where: { id: request.user.id } });
      if (!user) return reply.code(404).send({ message: 'User tidak ditemukan' });
      delete user.password;
      return user;
    } catch (error) { return reply.code(500).send({ message: 'Gagal ambil profil' }); }
  });

  // 4. UPDATE FOTO
  fastify.put('/update', async (request, reply) => {
    try {
      const authHeader = request.headers.authorization;
      if (!authHeader) return reply.code(401).send({ message: 'Token tidak ditemukan' });
      const token = authHeader.replace('Bearer ', '');
      const decoded = fastify.jwt.verify(token);
      const parts = request.parts();
      let body = {};
      let uploadedFileName = null;
      for await (const part of parts) {
        if (part.file) {
          const extension = path.extname(part.filename);
          const filename = `user-${decoded.username}-${Date.now()}${extension}`;
          const savePath = path.join(process.cwd(), 'uploads/img-profil', filename);
          await fs.promises.mkdir(path.dirname(savePath), { recursive: true });
          await pump(part.file, fs.createWriteStream(savePath));
          uploadedFileName = filename;
        } else { body[part.fieldname] = part.value; }
      }
      const updateData = { nama: body.nama, email: body.email, phone: body.phone, bio: body.bio };
      if (uploadedFileName) updateData.img_url = uploadedFileName;
      const updatedUser = await prisma.users.update({ where: { username: decoded.username }, data: updateData });
      return { status: 'success', message: 'Foto profil diperbarui', user: updatedUser };
    } catch (err) { return reply.code(500).send({ message: 'Gagal update profil' }); }
  });

  // 5. UPDATE PROFIL (HANDLE ALAMAT & USERNAME CHANGE)
  fastify.put('/update/:username', async (request, reply) => {
    const { username } = request.params; 
    const body = request.body;
    
    // JIKA GANTI USERNAME
    if (body.username && body.username !== username) {
       const existing = await prisma.users.findUnique({ where: { username: body.username } });
       if (existing) return reply.code(400).send({ message: 'Username sudah digunakan!' });

       const oldUser = await prisma.users.findUnique({ where: { username } });
       if (!oldUser) return reply.code(404).send({ message: 'User lama tidak ditemukan.' });

       try {
         // KARENA SUDAH CASCADE, KITA BISA LANGSUNG UPDATE USERNAME DI PARENT
         // DAN ANAK-ANAKNYA (Cat, Laporan, dll) AKAN IKUT BERUBAH OTOMATIS
         const updatedUser = await prisma.users.update({
            where: { username: username },
            data: {
              username: body.username, // Username Baru
              nama: body.nama,
              phone: body.phone,
              bio: body.bio,
              alamat: body.alamat, // Update Alamat
              
              pekerjaan: body.pekerjaan,
              gaji: Number(body.gaji),
              jumlah_kucing: Number(body.jumlah_kucing) || 0,
              luas_rumah: body.luas_rumah,
              punya_halaman: body.punya_halaman
            }
         });

         // Buat Token Baru dengan Username Baru
         const newToken = fastify.jwt.sign({ 
            id: updatedUser.id, 
            username: updatedUser.username, 
            email: updatedUser.email, 
            nama: updatedUser.nama, 
            role: updatedUser.role 
         });

         return { 
            status: 'success', 
            message: 'Username & Profil berhasil diganti!', 
            user: updatedUser,
            new_token: newToken 
         };

       } catch (error) {
         return reply.code(500).send({ message: 'Gagal update username', error: error.message });
       }

    } else {
       // UPDATE BIASA
       try {
         const updatedUser = await prisma.users.update({
            where: { username: username },
            data: {
              nama: body.nama,
              phone: body.phone,
              bio: body.bio,
              alamat: body.alamat, // Update Alamat
              pekerjaan: body.pekerjaan,
              gaji: Number(body.gaji),
              luas_rumah: body.luas_rumah,
              punya_halaman: body.punya_halaman,
              jumlah_kucing: Number(body.jumlah_kucing) || 0
            }
         });
         return { status: 'success', message: 'Profil berhasil disimpan!', user: updatedUser };
       } catch (error) {
         return reply.code(500).send({ message: 'Gagal update profil', error: error.message });
       }
    }
  });

  // ... (SISA KODE FORGOT PASSWORD SAMA SEPERTI SEBELUMNYA)
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body;
    const user = await prisma.users.findUnique({ where: { email } });
    if (!user) return reply.code(404).send({ message: 'Email tidak terdaftar.' });
    const token = Math.floor(100000 + Math.random() * 900000).toString(); 
    const expiryDate = new Date(); expiryDate.setHours(expiryDate.getHours() + 1);
    await prisma.users.update({ where: { email }, data: { resetPasswordToken: token, resetPasswordExpires: expiryDate } });
    console.log(">>> KODE OTP: " + token + " <<<");
    return { message: 'Kode OTP terkirim ke email.' };
  });

  fastify.post('/verify-otp', async (request, reply) => {
    const { token } = request.body;
    const user = await prisma.users.findFirst({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } } });
    if (!user) return reply.code(400).send({ valid: false, message: 'Kode salah' });
    return { valid: true, message: 'Kode valid' };
  });

  fastify.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body;
    const user = await prisma.users.findFirst({ where: { resetPasswordToken: token, resetPasswordExpires: { gt: new Date() } } });
    if (!user) return reply.code(400).send({ message: 'Token expired' });
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.users.update({ where: { username: user.username }, data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null } });
    return { message: 'Password berhasil diubah.' };
  });
}

export default authRoutes;