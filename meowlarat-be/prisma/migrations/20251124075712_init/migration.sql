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

    CONSTRAINT "cat_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "donasi" (
    "id" SERIAL NOT NULL,
    "nominal" INTEGER NOT NULL,
    "pesan" TEXT NOT NULL,
    "metode" INTEGER NOT NULL,
    "username" VARCHAR(255) NOT NULL,

    CONSTRAINT "donasi_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "laporan" (
    "id" SERIAL NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "lokasi" VARCHAR(255) NOT NULL,
    "deskripsi" TEXT NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "laporan_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "metode" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,

    CONSTRAINT "metode_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "petplace" (
    "id" SERIAL NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "category" VARCHAR(255) NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,

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
    "deskripsi" TEXT NOT NULL,
    "notes" TEXT NOT NULL,

    CONSTRAINT "tokoonline_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "users" (
    "username" VARCHAR(255) NOT NULL,
    "email" VARCHAR(255) NOT NULL,
    "nama" VARCHAR(255) NOT NULL,
    "phone" VARCHAR(15) NOT NULL,
    "password" VARCHAR(255) NOT NULL,
    "bio" VARCHAR(255) NOT NULL,
    "img_url" VARCHAR(255) NOT NULL,

    CONSTRAINT "users_pkey" PRIMARY KEY ("username")
);

-- CreateIndex
CREATE UNIQUE INDEX "users_email_key" ON "users"("email");

-- AddForeignKey
ALTER TABLE "cat" ADD CONSTRAINT "cat_adopter_fkey" FOREIGN KEY ("adopter") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "donasi" ADD CONSTRAINT "donasi_metode_fkey" FOREIGN KEY ("metode") REFERENCES "metode"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "donasi" ADD CONSTRAINT "donasi_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_id_thread_fkey" FOREIGN KEY ("id_thread") REFERENCES "threads"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "posts" ADD CONSTRAINT "posts_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "tanggungjawab" ADD CONSTRAINT "tanggungjawab_id_cat_fkey" FOREIGN KEY ("id_cat") REFERENCES "cat"("id") ON DELETE NO ACTION ON UPDATE NO ACTION;

-- AddForeignKey
ALTER TABLE "threads" ADD CONSTRAINT "threads_username_fkey" FOREIGN KEY ("username") REFERENCES "users"("username") ON DELETE NO ACTION ON UPDATE NO ACTION;
