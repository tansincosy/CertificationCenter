-- AlterTable
ALTER TABLE `oauth_client_details` ADD COLUMN `client_locked` INTEGER NOT NULL DEFAULT 0;
