-- CreateTable
CREATE TABLE "Post" (
    "id" SERIAL NOT NULL,
    "title" TEXT NOT NULL,
    "imageUrl" TEXT NOT NULL DEFAULT 'https://picsum.photos/seed/1/640/320',
    "content" TEXT NOT NULL,
    "author" TEXT NOT NULL DEFAULT 'Thigas',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Post_pkey" PRIMARY KEY ("id")
);
