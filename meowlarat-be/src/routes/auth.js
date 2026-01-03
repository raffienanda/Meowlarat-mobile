import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';
import nodemailer from 'nodemailer';
import crypto from 'crypto';
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
    user: 'emailmu@gmail.com', // GANTI EMAIL PENGIRIM
    pass: 'password_app_kamu'  // GANTI APP PASSWORD
  }
});

async function authRoutes(fastify, options) {
  
  // 1. REGISTER
  fastify.post('/register', async (request, reply) => {
    const { username, email, nama, phone, password, bio, img_url } = request.body;

    if (!username || !email || !password || !nama) {
      return reply.code(400).send({ message: 'Data wajib diisi semua' });
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
      return reply.code(500).send({ message: 'Gagal mendaftar', error: error.message });
    }
  });

  // 2. LOGIN
  fastify.post('/login', async (request, reply) => {
    const { username, password } = request.body;
    const user = await prisma.users.findUnique({ where: { username: username } });

    if (!user || !(await bcrypt.compare(password, user.password))) {
      return reply.code(401).send({ message: 'Username atau password salah' });
    }

    const token = fastify.jwt.sign({ id: user.id, username: user.username, email: user.email, nama: user.nama });

    return { 
      message: 'Login berhasil', 
      token, 
      user: { username: user.username, nama: user.nama, img_url: user.img_url } 
    };
  });

  // 3. GET PROFIL SAYA
  fastify.get('/me', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    try {
      const username = request.user.username;
      const user = await prisma.users.findUnique({
        where: { username: username },
        include: { 
          cat: { where: { adoptdate: { not: null } } } 
        }
      });

      if (!user) return reply.code(404).send({ message: 'User tidak ditemukan' });
      delete user.password;
      return user;
    } catch (error) {
      return reply.code(500).send({ message: 'Gagal ambil profil', error: error.message });
    }
  });

  // 4. UPDATE PROFIL (PUT)
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
        } else {
          body[part.fieldname] = part.value;
        }
      }

      const updateData = {
        nama: body.nama,
        email: body.email,
        phone: body.phone,
        bio: body.bio,
      };

      if (uploadedFileName) {
        updateData.img_url = uploadedFileName;
      }

      const updatedUser = await prisma.users.update({
        where: { username: decoded.username },
        data: updateData
      });

      return { status: 'success', message: 'Profil diperbarui', user: updatedUser };

    } catch (err) {
      console.error(err);
      return reply.code(500).send({ message: 'Gagal update profil' });
    }
  });

  // ==========================================
  // BAGIAN LUPA PASSWORD (WIZARD FLOW)
  // ==========================================

  // 5. STEP 1: REQUEST KODE OTP (POST /forgot-password)
  fastify.post('/forgot-password', async (request, reply) => {
    const { email } = request.body;
    const user = await prisma.users.findUnique({ where: { email } });

    if (!user) {
        console.log(`[Forgot PW] Email ${email} tidak ditemukan.`);
        return reply.code(404).send({ message: 'Email tidak terdaftar.' });
    }

    // Generate Kode 6 Angka
    const token = Math.floor(100000 + Math.random() * 900000).toString(); 
    
    // Set expired 1 jam
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 1);

    await prisma.users.update({
      where: { email },
      data: { resetPasswordToken: token, resetPasswordExpires: expiryDate }
    });

    // JALAN TIKUS: LIHAT TERMINAL
    console.log("========================================");
    console.log(">>> KODE OTP KAMU: " + token + " <<<");
    console.log("========================================");

    const mailOptions = {
      from: 'MeowLarat Support <no-reply@meowlarat.com>',
      to: email,
      subject: 'Kode Reset Password',
      text: `Kode OTP kamu adalah: ${token}`
    };

    try {
      await transporter.sendMail(mailOptions);
      return { message: 'Kode OTP terkirim ke email.' };
    } catch (error) {
      return { message: 'Kode OTP digenerate (Cek Terminal).' };
    }
  });

  // 6. STEP 2: CEK KODE OTP (POST /verify-otp)
  fastify.post('/verify-otp', async (request, reply) => {
    const { token } = request.body;

    // Cari user yang punya token ini dan belum expired
    const user = await prisma.users.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) {
      return reply.code(400).send({ valid: false, message: 'Kode salah atau kadaluwarsa' });
    }

    return { valid: true, message: 'Kode valid' };
  });

  // 7. STEP 3: RESET PASSWORD (POST /reset-password)
  fastify.post('/reset-password', async (request, reply) => {
    const { token, password } = request.body;
    
    const user = await prisma.users.findFirst({
      where: {
        resetPasswordToken: token,
        resetPasswordExpires: { gt: new Date() }
      }
    });

    if (!user) return reply.code(400).send({ message: 'Token expired atau salah' });

    const hashedPassword = await bcrypt.hash(password, 10);

    await prisma.users.update({
      where: { username: user.username },
      data: { password: hashedPassword, resetPasswordToken: null, resetPasswordExpires: null }
    });

    return { message: 'Password berhasil diubah.' };
  });
}

export default authRoutes;