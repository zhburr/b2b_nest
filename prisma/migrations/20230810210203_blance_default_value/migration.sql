/*
  Warnings:

  - Made the column `balance` on table `users` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE `users` MODIFY `balance` DECIMAL(5, 2) NOT NULL DEFAULT 0;
