// src/server.js
import Fastify from 'fastify';
import cors from '@fastify/cors';
import jwt from '@fastify/jwt';
import formbody from '@fastify/formbody';
import multipart from '@fastify/multipart';
import fastifyStatic from '@fastify/static';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Import Routes
import artikelRoutes from './routes/artikel.js';
import authRoutes from './routes/auth.js';
import catRoutes from './routes/cats.js';
import forumRoutes from './routes/forum.js';
import statsRoutes from './routes/stats.js';
import laporRoutes from './routes/lapor.js';
import tanggungjawabRoutes from './routes/tanggungjawab.js';
import donasiRoutes from './routes/donasi.js';
import metodeRoutes from './routes/metode.js';
import findplaceRoutes from './routes/findplace.js';
import shelterRoutes from './routes/shelter.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const fastify = Fastify({ logger: true });

// 1. Registrasi Plugin Utama
fastify.register(cors, { 
  origin: true, 
  methods: ['GET', 'PUT', 'POST', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
});

fastify.register(formbody);
fastify.register(jwt, {
  secret: process.env.JWT_SECRET || 'rahasia_super_aman_meow'
});

// 2. Registrasi Plugin Upload
fastify.register(multipart);

// 3. Registrasi Folder Static
fastify.register(fastifyStatic, {
  root: path.join(__dirname, '../uploads'),
  prefix: '/uploads/', 
});

// 4. Registrasi Routes

fastify.register(artikelRoutes, { prefix: '/api/artikel' });
fastify.register(authRoutes, { prefix: '/api/auth' });
fastify.register(catRoutes, { prefix: '/api/cats' });
fastify.register(forumRoutes, { prefix: '/api/forum' });
fastify.register(statsRoutes, { prefix: '/api/stats' });
fastify.register(laporRoutes, { prefix: '/api/lapor' }); 
fastify.register(tanggungjawabRoutes, { prefix: '/api/tanggungjawab' });
fastify.register(donasiRoutes, { prefix: '/api/donasi' });
fastify.register(metodeRoutes, { prefix: '/api/metode' });
fastify.register(findplaceRoutes, { prefix: '/api/findplace' });
fastify.register(shelterRoutes, { prefix: '/api/shelter' });

// Endpoint Cek Server
fastify.get('/', async (request, reply) => {
  return { status: 'OK', message: 'MeowLarat Backend is Running!' };
});

const start = async () => {
  try {
    // TAMBAHKAN host: '0.0.0.0' agar bisa diakses device lain satu wifi
    await fastify.listen({ port: 3000, host: '0.0.0.0' }); 
    console.log('Server berjalan di http://0.0.0.0:3000');
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();