-- CreateTable
CREATE TABLE `oauth_client_details` (
    `client_id` VARCHAR(191) NOT NULL,
    `resource_ids` VARCHAR(191) NOT NULL DEFAULT '',
    `client_secret` VARCHAR(191) NOT NULL DEFAULT '',
    `scope` VARCHAR(191) NOT NULL DEFAULT '',
    `authorized_grant_types` VARCHAR(191) NOT NULL DEFAULT '',
    `web_server_redirect_uri` VARCHAR(191) NOT NULL DEFAULT '',
    `authorities` VARCHAR(191) NOT NULL DEFAULT '',
    `access_token_validity` INTEGER NOT NULL DEFAULT 1800,
    `refresh_token_validity` INTEGER NOT NULL DEFAULT 604800,
    `additional_information` VARCHAR(191) NOT NULL DEFAULT '',
    `auto_approve` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`client_id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_client_token` (
    `id` VARCHAR(191) NOT NULL,
    `token_id` VARCHAR(191) NOT NULL DEFAULT '',
    `token` VARCHAR(191) NOT NULL DEFAULT '',
    `authentication_id` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_token` (
    `id` VARCHAR(191) NOT NULL,
    `token_id` LONGTEXT NOT NULL,
    `token` LONGTEXT NOT NULL,
    `username` VARCHAR(191) NOT NULL DEFAULT '',
    `authentication_id` LONGTEXT NOT NULL,
    `authentication` LONGTEXT NOT NULL,
    `refresh_token` LONGTEXT NOT NULL,
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `client_id` VARCHAR(191) NOT NULL DEFAULT '',

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_approvals` (
    `id` VARCHAR(191) NOT NULL,
    `user_id` VARCHAR(191) NOT NULL DEFAULT '',
    `client_id` VARCHAR(191) NOT NULL DEFAULT '',
    `scope` VARCHAR(191) NOT NULL DEFAULT '',
    `status` VARCHAR(191) NOT NULL DEFAULT '',
    `code` VARCHAR(191) NOT NULL DEFAULT '',
    `expires_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    UNIQUE INDEX `oauth_approvals_code_key`(`code`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_custom_client_details` (
    `id` VARCHAR(191) NOT NULL,
    `appId` VARCHAR(191) NOT NULL,
    `client_id` VARCHAR(191) NOT NULL DEFAULT '',
    `resource_ids` VARCHAR(191) NOT NULL DEFAULT '',
    `app_secret` VARCHAR(191) NOT NULL DEFAULT '',
    `scope` VARCHAR(191) NOT NULL DEFAULT '',
    `grant_types` VARCHAR(191) NOT NULL DEFAULT '',
    `redirect_url` VARCHAR(191) NOT NULL DEFAULT '',
    `authorities` VARCHAR(191) NOT NULL DEFAULT '',
    `access_token_validity` INTEGER NOT NULL DEFAULT 1800,
    `refresh_token_validity` INTEGER NOT NULL DEFAULT 604800,
    `additional_information` VARCHAR(191) NOT NULL DEFAULT '',
    `auto_approve_scope` VARCHAR(191) NOT NULL DEFAULT '',
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `oauth_user` (
    `id` VARCHAR(191) NOT NULL,
    `username` VARCHAR(191) NOT NULL DEFAULT '',
    `password` VARCHAR(191) NOT NULL DEFAULT '',
    `enable` INTEGER NOT NULL DEFAULT 1,
    `updated_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `created_at` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `is_locked` INTEGER NULL DEFAULT 1,
    `email` VARCHAR(191) NULL DEFAULT '',

    UNIQUE INDEX `oauth_user_username_key`(`username`),
    UNIQUE INDEX `oauth_user_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `oauth_token` ADD CONSTRAINT `oauth_token_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_client_details`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `oauth_approvals` ADD CONSTRAINT `oauth_approvals_client_id_fkey` FOREIGN KEY (`client_id`) REFERENCES `oauth_client_details`(`client_id`) ON DELETE RESTRICT ON UPDATE CASCADE;
