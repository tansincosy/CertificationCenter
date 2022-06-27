/*
  Warnings:

  - You are about to drop the column `client_locked` on the `oauth_client_details` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE `oauth_client_details` DROP COLUMN `client_locked`,
    ADD COLUMN `is_locked` INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE `oauth_terminal` (
    `id` VARCHAR(191) NOT NULL,
    `is_locked` TINYINT NULL DEFAULT 0,
    `name` VARCHAR(191) NULL DEFAULT '',
    `type` VARCHAR(191) NULL DEFAULT '',
    `engine` VARCHAR(191) NULL DEFAULT '',
    `os` VARCHAR(191) NULL DEFAULT '',
    `is_online` TINYINT NULL DEFAULT 0,
    `oAuth_client_details_Id` VARCHAR(191) NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_link_user_on_terminal` (
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `user_id` VARCHAR(191) NOT NULL,
    `terminal_id` VARCHAR(191) NOT NULL,

    PRIMARY KEY (`user_id`, `terminal_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oauth_terminal` ADD CONSTRAINT `oauth_terminal_oAuth_client_details_Id_fkey` FOREIGN KEY (`oAuth_client_details_Id`) REFERENCES `oauth_client_details`(`client_id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_link_user_on_terminal` ADD CONSTRAINT `oauth_link_user_on_terminal_terminal_id_fkey` FOREIGN KEY (`terminal_id`) REFERENCES `oauth_terminal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_link_user_on_terminal` ADD CONSTRAINT `oauth_link_user_on_terminal_user_id_fkey` FOREIGN KEY (`user_id`) REFERENCES `oauth_user`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
