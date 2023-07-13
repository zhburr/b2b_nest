/*
  Warnings:

  - Added the required column `weight` to the `products` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `products` ADD COLUMN `location` VARCHAR(191) NULL,
    ADD COLUMN `weight` DECIMAL(65, 30) NOT NULL;

-- AlterTable
ALTER TABLE `products_approval` MODIFY `remarks` LONGTEXT NULL;
