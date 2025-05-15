PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tableApiKeys` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`createdAt` integer NOT NULL,
	`updatedAt` integer NOT NULL,
	`active` integer NOT NULL,
	`unlimited` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `tableUsers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tableApiKeys`("id", "userId", "key", "name", "createdAt", "updatedAt", "active", "unlimited") SELECT "id", "userId", "key", "name", "createdAt", "updatedAt", "active", "unlimited" FROM `tableApiKeys`;--> statement-breakpoint
DROP TABLE `tableApiKeys`;--> statement-breakpoint
ALTER TABLE `__new_tableApiKeys` RENAME TO `tableApiKeys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tableApiKeysIndex` ON `tableApiKeys` (`key`);--> statement-breakpoint
CREATE TABLE `__new_tableApiKeyUsages` (
	`id` text PRIMARY KEY NOT NULL,
	`keyId` text NOT NULL,
	`count` integer NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`keyId`) REFERENCES `tableApiKeys`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tableApiKeyUsages`("id", "keyId", "count", "date") SELECT "id", "keyId", "count", "date" FROM `tableApiKeyUsages`;--> statement-breakpoint
DROP TABLE `tableApiKeyUsages`;--> statement-breakpoint
ALTER TABLE `__new_tableApiKeyUsages` RENAME TO `tableApiKeyUsages`;--> statement-breakpoint
CREATE INDEX `tableApiKeyUsagesIndex` ON `tableApiKeyUsages` (`keyId`);