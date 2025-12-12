// prisma/seed.js
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Memulai seeding data Petplaces...');

  // Hapus data lama agar tidak duplikat saat di-run ulang (Opsional)
  await prisma.petplace.deleteMany();

  // Data Dummy di sekitar Bandung
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
      address: "Jl. R.E. Martadinata No. 45, Bandung",
      latitude: -6.9088,
      longitude: 107.6195,
      rating: 4,
      description: "Dokter hewan berpengalaman 24 jam."
    },
    {
      nama: "Grooming Centre PVJ",
      category: "Grooming",
      img_url: "grooming1.png",
      address: "Paris Van Java, Sukajadi, Bandung",
      latitude: -6.8897,
      longitude: 107.5964,
      rating: 5,
      description: "Spa dan grooming terbaik untuk anabul kesayangan."
    },
    {
      nama: "Pet Station Antapani",
      category: "Petshop",
      img_url: "petshop2.png",
      address: "Jl. Terusan Jakarta No. 70, Antapani",
      latitude: -6.9135,
      longitude: 107.6599,
      rating: 4,
      description: "Lengkap dan murah meriah."
    },
    {
      nama: "Pusat Pakan Kucing Setiabudi",
      category: "Petshop",
      img_url: "petshop1.png",
      address: "Jl. Dr. Setiabudi No. 120, Bandung",
      latitude: -6.8631,
      longitude: 107.5960,
      rating: 5,
      description: "Distributor resmi Royal Canin dan Pro Plan."
    }
  ];

  for (const place of petplaces) {
    await prisma.petplace.create({
      data: place,
    });
  }

  console.log(`✅ Berhasil menambahkan ${petplaces.length} data petplace!`);

  console.log('🌱 Memulai seeding Toko Online...');
  await prisma.tokoonline.deleteMany(); // Reset data lama

  const onlineShops = [
    {
      source: "SHOPEE",
      nama: "Toko Kucing Gemoy",
      deskripsi: "Menjual perlengkapan grooming dan makanan dengan harga terjangkau.",
      link: "https://shopee.co.id",
      notes: "Promo setiap tanggal kembar"
    },
    {
      source: "TOKOPEDIA",
      nama: "MeongCare Official",
      deskripsi: "Menjual produk kesehatan dan perawatan premium dari dokter hewan.",
      link: "https://tokopedia.com",
      notes: "Free ongkir se-Bandung"
    },
    {
      source: "TIKTOK SHOP",
      nama: "CatLovers Store",
      deskripsi: "Makanan basah dan vitamin favorit viral.",
      link: "https://tiktok.com",
      notes: "Live setiap malam minggu"
    }
  ];

  for (const shop of onlineShops) {
    await prisma.tokoonline.create({ data: shop });
  }
  
  console.log('✅ Seeding Toko Online Selesai!'); 
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });