// src/routes/forum.js
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function forumRoutes(fastify, options) {

  // 1. AMBIL DAFTAR TOPIK (GET /)
  fastify.get('/', async (request, reply) => {
    try {
      const { category } = request.query;
      console.log(`📥 Request Forum Kategori: ${category || 'Semua'}`);

      const whereClause = category ? { category: category } : {};

      const threads = await prisma.threads.findMany({
        where: whereClause,
        include: {
          users: { select: { nama: true, img_url: true } }
        },
        orderBy: { id: 'desc' } // Urutkan dari yang terbaru
      });
      
      return threads;
    } catch (error) {
      console.error("❌ ERROR GET FORUM:", error);
      reply.code(500).send(error);
    }
  });

  // 2. BUAT TOPIK BARU (POST /)
  fastify.post('/', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    try {
      const { title, category, teks } = request.body; 
      const username = request.user.username;

      const newThread = await prisma.threads.create({
        data: {
          title,
          category,
          teks,
          username
        }
      });

      return newThread;
    } catch (error) {
      console.error("❌ ERROR POST FORUM:", error);
      reply.code(500).send(error);
    }
  });

  // 3. LIHAT DETAIL TOPIK & KOMENTAR (GET /:id)
  fastify.get('/:id', async (request, reply) => {
    try {
      const { id } = request.params;
      
      const thread = await prisma.threads.findUnique({
        where: { id: Number(id) },
        include: {
          users: { select: { nama: true, img_url: true } },
          posts: { // Ambil komentar (posts) yang terhubung
            include: {
              users: { select: { nama: true, img_url: true } }
            },
            orderBy: { id: 'asc' } // Komentar lama di atas
          }
        }
      });

      if (!thread) {
        return reply.code(404).send({ error: "Topik tidak ditemukan" });
      }
      
      return thread;
    } catch (error) {
      console.error("❌ ERROR GET DETAIL THREAD:", error);
      reply.code(500).send(error);
    }
  });

  // 4. KIRIM KOMENTAR BARU (POST /:id/posts)
  fastify.post('/:id/posts', {
    onRequest: [async (request) => await request.jwtVerify()]
  }, async (request, reply) => {
    try {
      const { id } = request.params; // ID Thread dari URL
      const { teks } = request.body;
      const username = request.user.username;

      const newPost = await prisma.posts.create({
        data: {
          teks,
          id_thread: Number(id), // Hubungkan komentar ke thread ini
          username
        },
        include: {
          users: { select: { nama: true, img_url: true } } // Return data user agar tampilan langsung update
        }
      });

      return newPost;
    } catch (error) {
      console.error("❌ ERROR POST COMMENT:", error);
      reply.code(500).send(error);
    }
  });
}

export default forumRoutes;