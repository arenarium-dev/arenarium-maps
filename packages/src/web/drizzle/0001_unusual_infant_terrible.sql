PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_tableApiKeys` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`domains` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	`active` integer NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `tableUsers`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_tableApiKeys`("id", "userId", "key", "name", "domains", "createdAt", "updatedAt", "active") SELECT "id", "userId", "key", "name", "domains", "createdAt", "updatedAt", "active" FROM `tableApiKeys`;--> statement-breakpoint
DROP TABLE `tableApiKeys`;--> statement-breakpoint
ALTER TABLE `__new_tableApiKeys` RENAME TO `tableApiKeys`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `tableApiKeysIndex` ON `tableApiKeys` (`key`);