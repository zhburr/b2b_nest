/*
  Warnings:

  - Added the required column `updateAt` to the `OrderLine` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `OrderLine` ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `updateAt` DATETIME(3) NOT NULL;
