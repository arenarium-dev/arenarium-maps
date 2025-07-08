CREATE TABLE `tableUserAccounts` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`accountId` text NOT NULL,
	`providerId` text NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`accessTokenExpiresAt` integer,
	`refreshTokenExpiresAt` integer,
	`scope` text,
	`idToken` text,
	`password` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tableApiKeyUsages` (
	`index` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`keyIndex` integer NOT NULL,
	`count` integer NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL,
	FOREIGN KEY (`keyIndex`) REFERENCES `tableApiKeys`(`index`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `tableApiKeyUsagesIndex` ON `tableApiKeyUsages` (`keyIndex`);--> statement-breakpoint
CREATE TABLE `tableApiKeys` (
	`index` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
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
CREATE INDEX `tableApiKeysIndex` ON `tableApiKeys` (`key`);--> statement-breakpoint
CREATE TABLE `tableUserSessions` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`token` text NOT NULL,
	`expiresAt` integer DEFAULT (unixepoch()) NOT NULL,
	`ipAddress` text NOT NULL,
	`userAgent` text NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tableUsers` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`emailVerified` integer DEFAULT false NOT NULL,
	`name` text NOT NULL,
	`icon` text,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `tableUsers_email_unique` ON `tableUsers` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `tableUsersEmailIndex` ON `tableUsers` (`email`);--> statement-breakpoint
CREATE TABLE `tableUserVerifications` (
	`id` text PRIMARY KEY NOT NULL,
	`identifier` text NOT NULL,
	`value` text NOT NULL,
	`expiresAt` integer DEFAULT (unixepoch()) NOT NULL,
	`createdAt` integer DEFAULT (unixepoch()) NOT NULL,
	`updatedAt` integer DEFAULT (unixepoch()) NOT NULL
);
