// meowlarat-be/prisma/seed.js
import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Membersihkan data lama...');
  await prisma.adoption_requests.deleteMany();
  await prisma.tanggungjawab.deleteMany();
  await prisma.donasi.deleteMany();
  await prisma.laporan.deleteMany();
  await prisma.posts.deleteMany();
  await prisma.threads.deleteMany();
  await prisma.cat.deleteMany();
  await prisma.users.deleteMany();
  await prisma.metode.deleteMany();
  await prisma.petplace.deleteMany();
  await prisma.tokoonline.deleteMany();
  await prisma.artikel.deleteMany();

  console.log('🌱 Memulai Seeding...');

  const passwordHash = await bcrypt.hash('12345', 10);
  
  // USER ADMIN: IWAN
  const userIwan = await prisma.users.create({
    data: {
      username: 'iwan', email: 'iwan@gmail.com', nama: 'Iwan Fals', password: passwordHash, phone: '081234567890', bio: 'Admin MeowLarat', img_url: 'default.jpg', pekerjaan: 'Musisi', gaji: 10000000, luas_rumah: 'Besar', punya_halaman: true, jumlah_kucing: 2,
      role: 'ADMIN' // <--- ROLE ADMIN
    }
  });

  // USER BIASA: BUDI
  const userBudi = await prisma.users.create({
    data: {
      username: 'budi', email: 'budi@gmail.com', nama: 'Budi Santoso', password: passwordHash, phone: '089876543210', bio: 'Ingin mengadopsi teman baru.', img_url: 'default.jpg', pekerjaan: 'PNS', gaji: 5000000, luas_rumah: 'Sedang', punya_halaman: false, jumlah_kucing: 0,
      role: 'USER' // <--- ROLE USER
    }
  });

  // USER BIASA: SITI
  const userSiti = await prisma.users.create({
    data: {
      username: 'siti', email: 'siti@gmail.com', nama: 'Siti Aminah', password: passwordHash, phone: '085678901234', bio: 'Suka memberi makan kucing jalanan.', img_url: 'default.jpg',
      role: 'USER'
    }
  });

  console.log('✅ Users dibuat: Iwan (ADMIN), Budi (USER), Siti (USER)');

  // --- DATA KUCING, LOKASI, DLL (BAWAAN SEED LAMA) ---
  await prisma.petplace.createMany({
    data: [
      { nama: "Meow City Petshop", category: "Petshop", img_url: "petshop3.png", address: "Jl. Ir. H. Juanda No. 100, Dago", latitude: -6.8858, longitude: 107.6143, rating: 5, description: "Menyediakan makanan premium." },
      { nama: "Klinik Hewan Sehat", category: "Vet", img_url: "vet1.png", address: "Jl. Sunda No. 55, Bandung", latitude: -6.9175, longitude: 107.6191, rating: 5, description: "Dokter hewan 24 jam." }
    ]
  });

  await prisma.tokoonline.create({ data: { source: "SHOPEE", nama: "Toko Kucing Gemoy", deskripsi: "Menjual perlengkapan grooming.", link: "https://shopee.co.id", notes: "Promo tanggal kembar" }});
  
  await prisma.metode.createMany({ data: [
    { nama: "Bank BCA", category: "Transfer Bank", logo: "bca.png", rek: "1234567890", an: "Yayasan MeowLarat" },
    { nama: "Bank Mandiri", category: "Transfer Bank", logo: "mandiri.png", rek: "0987654321", an: "Yayasan MeowLarat" },
    { nama: "QRIS", category: "E-Wallet", logo: "qris.jpg", rek: "-", an: "MeowLarat Official" }
  ]});

  const cat1 = await prisma.cat.create({
    data: { nama: "Mochi", img_url: "mochi.jpg", age: "1 Tahun", gender: "Jantan", ras: "Domestik", karakteristik: "Manja", isVaccinated: true, isAdopted: false, isTaken: false }
  });
  const cat2 = await prisma.cat.create({
    data: { nama: "Luna", img_url: "luna.jpg", age: "5 Bulan", gender: "Betina", ras: "Mixdome", karakteristik: "Aktif", isVaccinated: false, isAdopted: false, isTaken: false }
  });

  // REQUEST
  await prisma.adoption_requests.create({
    data: { cat_id: cat1.id, username: "budi", status: "PENDING", message: "Saya suka Mochi!", date: new Date() }
  });
  await prisma.adoption_requests.create({
    data: { cat_id: cat2.id, username: "siti", status: "PENDING", message: "Luna lucu sekali.", date: new Date() }
  });

  // LAPORAN
  await prisma.laporan.create({
    data: { username: "siti", judul: "Kucing Terjebak", isi: "Di selokan.", location: "Dago", img_url: "lapor-1763894887122.jpeg", status: "PENDING", date: new Date() }
  });

  console.log('🎉 SEEDING SELESAI! Iwan siap jadi Admin.');
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(async () => { await prisma.$disconnect(); });