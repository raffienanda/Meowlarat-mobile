// types.ts

// Model: artikel
export interface artikel {
  id: number;
  img_url: string;
  nama: string;
  category: string;
  teks: string;
}

// Model: cat
export interface cat {
  id: number;
  img_url: string;
  nama: string;
  age: string;
  gender: string;
  ras: string;
  karakteristik: string;
  isVaccinated: boolean;
  isAdopted: boolean | null;
  adopter: string | null;
  adoptdate: string | null; // DateTime dari API biasanya berbentuk String
  isTaken: boolean;
  
  // Relasi (Optional, ada jika di-include dari backend)
  users?: users | null;
  tanggungjawab?: tanggungjawab[];
}

// Model: donasi
export interface donasi {
  id: number;
  nominal: number;
  pesan: string;
  metode: number;
  username: string;
  bukti_transfer: string | null;

  // Relasi
  metode_donasi_metodeTometode?: metode;
  users?: users;
}

// Model: laporan
export interface laporan {
  id: number;
  category: string;
  lokasi: string;
  deskripsi: string;
  img_url: string;
  notes: string;
}

// Model: metode
export interface metode {
  id: number;
  nama: string;
  category: string;
  logo: string | null;
  rek: string | null;
  an: string | null;
  isActive: boolean;

  // Relasi
  donasi_donasi_metodeTometode?: donasi[];
}

// Model: petplace
export interface petplace {
  id: number;
  nama: string;
  category: string;
  img_url: string;
  address: string;
  latitude: number;
  longitude: number;
  description: string | null;
}

// Model: posts
export interface posts {
  id: number;
  teks: string;
  id_thread: number;
  username: string;

  // Relasi
  threads?: threads;
  users?: users;
}

// Model: shelter
export interface shelter {
  id: number;
  nama: string;
  lokasi: string;
}

// Model: tanggungjawab
export interface tanggungjawab {
  id: number;
  id_cat: number;
  gambarmakanan1: string | null;
  gambarmakanan2: string | null;
  gambarmakanan3: string | null;
  gambaraktivitas1: string | null;
  gambaraktivitas2: string | null;
  gambaraktivitas3: string | null;
  gambarkotoran1: string | null;
  gambarkotoran2: string | null;
  gambarkotoran3: string | null;

  // Relasi
  cat?: cat;
}

// Model: threads
export interface threads {
  id: number;
  title: string;
  category: string;
  teks: string;
  username: string;

  // Relasi
  posts?: posts[];
  users?: users;
}

// Model: tokoonline
export interface tokoonline {
  id: number;
  source: string;
  nama: string;
  deskripsi: string;
  link: string;
  notes: string | null;
}

// Model: users
export interface users {
  username: string;
  email: string;
  nama: string;
  phone: string;
  password: string; // Hati-hati, jangan tampilkan password di UI
  bio: string;
  img_url: string;
  resetPasswordToken: string | null;
  resetPasswordExpires: string | null;

  // Relasi
  cat?: cat[];
  donasi?: donasi[];
  posts?: posts[];
  threads?: threads[];
}

// Interface Tambahan untuk Statistik (Response API Dashboard)
export interface Stats {
  available: number;
  adopted: number;
  shelterCount: number;
}