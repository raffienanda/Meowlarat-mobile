-- CreateTable
CREATE TABLE "artikel" (
    "id" SERIAL NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "teks" TEXT NOT NULL,

    CONSTRAINT "artikel_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "cat" (
    "id" SERIAL NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "age" VARCHAR(255) NOT NULL,
    "gender" VARCHAR(10) NOT NULL,
    "ras" VARCHAR(255) NOT NULL,
    "karakteristik" TEXT NOT NULL,
    "isvaccinated" BOOLEAN NOT NULL,
    "isadopted" BOOLEAN,
    "adopter" VARCHAR(255),
    "adoptdate" DATE,
    "isTaken" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "cat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "adoption_requests" (
    "id" SERIAL NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "message" TEXT,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "cat_id" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "adoption_requests_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donasi" (
    "id" SERIAL NOT NULL,
    "nominal" INTEGER NOT NULL,
    "pesan" TEXT NOT NULL,
    "metode" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "bukti_transfer" VARCHAR(255),

    CONSTRAINT "donasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "judul" VARCHAR(255) NOT NULL,
    "isi" TEXT NOT NULL,
    "location" VARCHAR(255) NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "response" TEXT DEFAULT '-',

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metode" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL DEFAULT 'Transfer Bank',
    "logo" VARCHAR(255),
    "rek" VARCHAR(255),
    "an" VARCHAR(255),
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "metode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petplace" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "address" TEXT NOT NULL,
    "latitude" DOUBLE PRECISION NOT NULL,
    "longitude" DOUBLE PRECISION NOT NULL,
    "rating" INTEGER NOT NULL DEFAULT 5,
    "description" TEXT,

    CONSTRAINT "petplace_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "posts" (
    "id" SERIAL NOT NULL,
    "teks" TEXT NOT NULL,
    "id_thread" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "posts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "shelter" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "lokasi" VARCHAR(255) NOT NULL,

    CONSTRAINT "shelter_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tanggungjawab" (
    "id" SERIAL NOT NULL,
    "id_cat" INTEGER NOT NULL,
    "gambarmakanan1" VARCHAR(255),
    "gambarmakanan2" VARCHAR(255),
    "gambarmakanan3" VARCHAR(255),
    "gambaraktivitas1" VARCHAR(255),
    "gambaraktivitas2" VARCHAR(255),
    "gambaraktivitas3" VARCHAR(255),
    "gambarkotoran1" VARCHAR(255),
    "gambarkotoran2" VARCHAR(255),
    "gambarkotoran3" VARCHAR(255),

    CONSTRAINT "tanggungjawab_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "threads" (
    "id" SERIAL NOT NULL,
    "title" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "teks" TEXT NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "threads_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "tokoonline" (
    "id" SERIAL NOT NULL,
    "source" VARCHAR(50) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "link" TEXT NOT NULL,
    "notes" TEXT,

    CONSTRAINT "tokoonline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "id" SERIAL NOT NULL,
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "bio" VARCHAR(255) NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "pekerjaan" VARCHAR(100) DEFAULT '-',
    "gaji" INTEGER DEFAULT 0,
    "jumlah_kucing" INTEGER DEFAULT 0,
    "luas_rumah" VARCHAR(50) DEFAULT 'Sedang',
    "punya_halaman" BOOLEAN DEFAULT false,
    "resetPasswordToken" VARCHAR(255),
    "resetPasswordExpires" TIMESTAMP(3),

    CONSTRAINT "users_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "adoption_requests_username_cat_id_key" ON "adoption_requests"("username", "cat_id");

-- CreateIndex
CREATE UNIQUE INDEX "users_username_key" ON "users"("username");

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "cat" ADD CONSTRAINT "cat_adopter_fkey" FOREIGN KEY ("adopter") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_cat_id_fkey" FOREIGN KEY ("cat_id") REFERENCES "cat"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "adoption_requests" ADD CONSTRAINT "adoption_requests_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "donasi" ADD CONSTRAINT "donasi_metode_fkey" FOREIGN KEY ("metode") REFERENCES "metode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "donasi" ADD CONSTRAINT "donasi_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "laporan" ADD CONSTRAINT "laporan_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_id_thread_fkey" FOREIGN KEY ("id_thread") REFERENCES "threads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tanggungjawab" ADD CONSTRAINT "tanggungjawab_id_cat_fkey" FOREIGN KEY ("id_cat") REFERENCES "cat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
