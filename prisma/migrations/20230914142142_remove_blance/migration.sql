/*
  Warnings:

  - You are about to drop the column `balance` on the `users` table. All the data in the column will be lost.
  - You are about to drop the column `credit` on the `users` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `users` DROP COLUMN `balance`,
    DROP COLUMN `credit`;
