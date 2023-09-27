-- CreateTable
CREATE TABLE `LabelOrders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weight_from` INTEGER NOT NULL,
    `weight_to` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(5, 2) NOT NULL,
    `inputFile` VARCHAR(191) NOT NULL,
    `outputFile` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `LabelOrders` ADD CONSTRAINT `LabelOrders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
