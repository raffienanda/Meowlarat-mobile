// meowlarat-be/src/routes/artikel.js
import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import { pipeline } from 'stream';
import util from 'util';
import { fileURLToPath } from 'url';

const pump = util.promisify(pipeline);
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

// --- HELPER FUNCTIONS ---

// Palette warna kategori
const CATEGORY_COLORS = {
  kesehatan: '#e74c3c',
  perawatan: '#3498db',
  nutrisi: '#27ae60',
  adopsi: '#f39c12',
  edukasi: '#9b59b6',
  default: '#95a5a6'
};

function getColorForCategory(cat) {
  if (!cat) return CATEGORY_COLORS.default;
  const key = cat.toLowerCase();
  return CATEGORY_COLORS[key] || CATEGORY_COLORS.default;
}

// Helper untuk menghapus tag HTML (untuk snippet)
function stripHtml(html) {
  if (!html || typeof html !== 'string') return '';
  return html.replace(/<[^>]+>/g, ''); 
}

// --- MAIN ROUTES ---

async function artikelRoutes(fastify, options) {
  // GET /artikel
  // Query params: ?q=search&page=1&limit=10&category=...
  fastify.get('/', async (request, reply) => {
    try {
      const { q, page = 1, limit = 12, category } = request.query || {};
      const take = Number(limit) || 12;
      const skip = (Math.max(Number(page), 1) - 1) * take;

      const where = {
        AND: [
          category ? { category: { equals: category } } : {},
          q
            ? {
                OR: [
                  { nama: { contains: String(q), mode: 'insensitive' } },
                  { teks: { contains: String(q), mode: 'insensitive' } }
                ]
              }
            : {}
        ]
      };

      const [items, total] = await Promise.all([
        prisma.artikel.findMany({
          where,
          orderBy: { id: 'desc' },
          take,
          skip
        }),
        prisma.artikel.count({ where })
      ]);

      // Return data + snippet bersih + warna
      const data = items.map(a => {
        const cleanText = stripHtml(a.teks);
        return {
          id: a.id,
          img_url: a.img_url,
          nama: a.nama,
          category: a.category,
          teks_snippet:
            cleanText.length > 220
              ? cleanText.slice(0, 220).trim() + '...'
              : cleanText,
          color: getColorForCategory(a.category)
        };
      });

      return { data, meta: { total, page: Number(page), limit: take } };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil daftar artikel', error: error.message });
    }
  });

  // GET /artikel/:id  <-- slug uses the article id (as requested)
  fastify.get('/:id', async (request, reply) => {
    try {
      const id = Number(request.params.id);
      if (Number.isNaN(id)) return reply.code(400).send({ message: 'ID artikel tidak valid' });

      const artikel = await prisma.artikel.findUnique({ where: { id } });
      if (!artikel) return reply.code(404).send({ message: 'Artikel tidak ditemukan' });

      const response = {
        id: artikel.id,
        img_url: artikel.img_url,
        nama: artikel.nama,
        category: artikel.category,
        teks: artikel.teks, // HTML asli dikirim untuk detail
        color: getColorForCategory(artikel.category)
      };

      return response;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ message: 'Gagal mengambil artikel', error: error.message });
    }
  });
}

export default artikelRoutes;