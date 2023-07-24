-- AlterTable
ALTER TABLE `OrderUpload` ADD COLUMN `invoice` VARCHAR(191) NULL;

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

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_orderId_fkey` FOREIGN KEY (`orderId`) REFERENCES `OrderUpload`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `OrderLine` ADD CONSTRAINT `OrderLine_productSku_fkey` FOREIGN KEY (`productSku`) REFERENCES `products`(`sku`) ON DELETE RESTRICT ON UPDATE CASCADE;
