-- CreateTable
CREATE TABLE `users` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `firstName` VARCHAR(191) NOT NULL,
    `lastName` VARCHAR(191) NOT NULL,
    `email` VARCHAR(191) NOT NULL,
    `password` VARCHAR(191) NOT NULL,
    `isVat` BOOLEAN NOT NULL DEFAULT false,
    `emailVerified` BOOLEAN NOT NULL DEFAULT false,
    `otp` INTEGER NULL,
    `role` ENUM('Customer', 'Client', 'Admin') NOT NULL,
    `avatar` VARCHAR(191) NULL,
    `canUploadOrder` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `users_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Payment` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `paymentType` ENUM('Debit', 'Credit') NOT NULL DEFAULT 'Debit',
    `amount` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `availableBalance` DECIMAL(5, 2) NOT NULL DEFAULT 0,
    `description` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products_approval` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `csv` VARCHAR(191) NOT NULL,
    `status` ENUM('Pending', 'Approved', 'Rejected') NOT NULL DEFAULT 'Pending',
    `userId` INTEGER NOT NULL,
    `remarks` LONGTEXT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `products` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `title` VARCHAR(191) NOT NULL,
    `sku` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(5, 2) NULL,
    `userId` INTEGER NOT NULL,
    `image` VARCHAR(191) NULL,
    `weight` DECIMAL(5, 2) NOT NULL,
    `location` VARCHAR(191) NULL,
    `packaging` ENUM('Parcel', 'Large') NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `products_sku_key`(`sku`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderUpload` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `csv` VARCHAR(191) NOT NULL,
    `invoice` VARCHAR(191) NULL,
    `userId` INTEGER NOT NULL,
    `totalAmount` DECIMAL(5, 2) NULL,
    `paid` BOOLEAN NOT NULL DEFAULT false,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,
    `delivered` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `OrderLine` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `orderId` INTEGER NOT NULL,
    `productSku` VARCHAR(191) NOT NULL,
    `productQuantity` INTEGER NOT NULL,
    `buyerName` VARCHAR(191) NOT NULL,
    `buyerAddress1` VARCHAR(191) NOT NULL,
    `buyerAddress2` VARCHAR(191) NULL,
    `buyerCity` VARCHAR(191) NOT NULL,
    `buyerCountry` VARCHAR(191) NOT NULL,
    `buyerPostCode` VARCHAR(191) NOT NULL,
    `trackingNo` VARCHAR(191) NULL,
    `trackingCompany` VARCHAR(191) NULL,
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

-- CreateTable
CREATE TABLE `LabelPrice` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weight_from` INTEGER NOT NULL,
    `weight_to` INTEGER NOT NULL,
    `price` DECIMAL(5, 2) NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `LabelOrders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `weight_from` INTEGER NOT NULL,
    `weight_to` INTEGER NOT NULL,
    `quantity` INTEGER NOT NULL,
    `price` DECIMAL(5, 2) NOT NULL,
    `inputFile` VARCHAR(191) NOT NULL,
    `outputFile` VARCHAR(191) NULL,
    `deliverd` BOOLEAN NOT NULL DEFAULT false,
    `userId` INTEGER NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updateAt` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Payment` ADD CONSTRAINT `Payment_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products_approval` ADD CONSTRAINT `products_approval_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `products` ADD CONSTRAINT `products_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderUpload` ADD CONSTRAINT `OrderUpload_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `OrderUpload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_productSku_fkey` FOREIGN KEY (`productSku`) REFERENCES `products`(`sku`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `LabelOrders` ADD CONSTRAINT `LabelOrders_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;