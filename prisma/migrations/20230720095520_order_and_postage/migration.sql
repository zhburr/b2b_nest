/*
  Warnings:

  - You are about to alter the column `price` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `weight` on the `products` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.
  - You are about to alter the column `balance` on the `users` table. The data in that column could be lost. The data in that column will be cast from `Decimal(65,30)` to `Decimal(5,2)`.

*/
-- AlterTable
ALTER TABLE `products` MODIFY `price` DECIMAL(5, 2) NULL,
    MODIFY `weight` DECIMAL(5, 2) NOT NULL;

-- AlterTable
ALTER TABLE `users` MODIFY `balance` DECIMAL(5, 2) NULL;

-- CreateTable
CREATE TABLE `OrderUpload` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `csv` VARCHAR(191) NOT NULL,
    `userId` INTEGER NOT NULL,
    `totalAmount` DECIMAL(5, 2) NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Postage` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weight_from` INTEGER NOT NULL,
    `weight_to` INTEGER NOT NULL,
    `price` DECIMAL(5, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderUpload` ADD CONSTRAINT `OrderUpload_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
