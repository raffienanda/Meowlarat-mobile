import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs'; // Pastikan sudah install: npm install bcryptjs

const prisma = new PrismaClient();

async function main() {
  // --- BAGIAN 1: PETPLACE (Biarkan seperti semula) ---
  await prisma.petplace.deleteMany();

  const petplaces = [
    {
      nama: "Meow City Petshop",
      category: "Petshop",
      img_url: "petshop3.png", 
      address: "Jl. Ir. H. Juanda No. 100, Dago, Bandung",
      latitude: -6.8858,
      longitude: 107.6143,
      rating: 5,
      description: "Menyediakan makanan premium dan aksesoris lucu."
    },
    {
      nama: "Klinik Hewan Sehat",
      category: "Vet",
      img_url: "vet1.png",
      address: "Jl. Sunda No. 55, Sumurbandung, Bandung",
      latitude: -6.9175,
      longitude: 107.6191,
      rating: 5,
      description: "Dokter hewan berpengalaman siap siaga 24 jam untuk anabul sakit."
    },
    {
      nama: "Fluffy Grooming Spa",
      category: "Grooming",
      img_url: "grooming1.png",
      address: "Jl. LLRE Martadinata (Riau) No. 12, Bandung",
      latitude: -6.9094, 
      longitude: 107.6180,
      rating: 4,
      description: "Layanan spa, mandi kutu, dan potong kuku yang bikin anabul rileks."
    },
    {
      nama: "Pet Kingdom Sukajadi",
      category: "Petshop",
      img_url: "petshop1.png",
      address: "Jl. Sukajadi No. 135, Bandung",
      latitude: -6.8902,
      longitude: 107.5960,
      rating: 5,
      description: "Supermarket kebutuhan hewan terlengkap dengan area bermain."
    },
    {
      nama: "Happy Paws Store",
      category: "Petshop",
      img_url: "petshop2.png",
      address: "Jl. Buah Batu No. 200, Bandung",
      latitude: -6.9450,
      longitude: 107.6300,
      rating: 4,
      description: "Diskon makanan kucing kering dan basah setiap hari Jumat."
    },
    {
      nama: "Dr. Meow Vet Care",
      category: "Vet",
      img_url: "vet1.png", // Menggunakan gambar vet yang sama jika stok gambar terbatas
      address: "Jl. Dr. Setiabudi No. 45, Bandung",
      latitude: -6.8700,
      longitude: 107.5990,
      rating: 5,
      description: "Spesialis vaksinasi, sterilisasi, dan operasi minor."
    }
  ];

  for (const place of petplaces) {
    await prisma.petplace.create({ data: place });
  }
  console.log(`✅ Data petplace (${petplaces.length} lokasi) selesai.`);

  // --- BAGIAN 2: TOKO ONLINE (Biarkan seperti semula) ---
  console.log('🌱 Memulai seeding Toko Online...');
  await prisma.tokoonline.deleteMany();
  const onlineShops = [
    {
      source: "SHOPEE",
      nama: "Toko Kucing Gemoy",
      deskripsi: "Menjual perlengkapan grooming.",
      link: "https://shopee.co.id",
      notes: "Promo setiap tanggal kembar"
    }
  ];
  for (const shop of onlineShops) {
    await prisma.tokoonline.create({ data: shop });
  }
  console.log('✅ Data toko online selesai.');


  // --- BAGIAN 4: USER IWAN (UPDATED) ---
  console.log('👤 Membuat User Iwan...');

  const userData = {
    username: 'iwan',
    email: 'iwan@gmail.com',
    passwordRaw: '12345',
    nama: 'Iwan Fals',
    phone: '081234567890',
    bio: 'Pecinta kucing jalanan',
    img_url: 'default.jpg'
  };

  // 1. Cek & Hapus jika email/username sudah ada biar gak bentrok
  const existingUser = await prisma.users.findFirst({
    where: {
      OR: [
        { username: userData.username },
        { email: userData.email }
      ]
    }
  });

  if (existingUser) {
    console.log(`⚠️ User lama ditemukan (${existingUser.username}), menghapus data lama...`);
    // Hapus relasi dulu kalau ada (opsional, tergantung schema constraint)
    // await prisma.cat.updateMany({ where: { adopter: existingUser.username }, data: { adopter: null, isAdopted: false } });
    
    await prisma.users.delete({
      where: { username: existingUser.username }
    });
  }

  // 2. Buat Hash Password
  const hashedPassword = await bcrypt.hash(userData.passwordRaw, 10);

  // 3. Buat User Baru
  const newUser = await prisma.users.create({
    data: {
      username: userData.username,
      email: userData.email,
      nama: userData.nama,
      password: hashedPassword, // Simpan password yang sudah di-hash
      phone: userData.phone,
      bio: userData.bio,
      img_url: userData.img_url
    },
  });

  console.log(`✅ SUKSES! Login User:`);
  console.log(`   Username: ${userData.username}`);
  console.log(`   Password: ${userData.passwordRaw}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });