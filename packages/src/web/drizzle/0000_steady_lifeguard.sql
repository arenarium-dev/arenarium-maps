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
	`id` text PRIMARY KEY NOT NULL,
	`keyId` text NOT NULL,
	`count` integer NOT NULL,
	`date` integer DEFAULT (unixepoch()) NOT NULL
);
--> statement-breakpoint
CREATE INDEX `tableApiKeyUsagesIndex` ON `tableApiKeyUsages` (`keyId`);--> statement-breakpoint
CREATE TABLE `tableApiKeys` (
	`id` text PRIMARY KEY NOT NULL,
	`userId` text NOT NULL,
	`key` text NOT NULL,
	`name` text NOT NULL,
	`domains` text NOT NULL,
	`createdAt` integer,
	`updatedAt` integer,
	`active` integer NOT NULL
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
