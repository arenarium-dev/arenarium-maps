import { relations, sql } from 'drizzle-orm';
import { text, integer, sqliteTable, uniqueIndex, index, foreignKey } from 'drizzle-orm/sqlite-core';

//#region BetterAuth

export const users = sqliteTable(
	'tableUsers',
	{
		id: text('id').primaryKey(),
		email: text('email').notNull().unique(),
		emailVerified: integer('emailVerified', { mode: 'boolean' }).notNull().default(false),
		name: text('name').notNull(),
		image: text('icon'),
		createdAt: integer('createdAt', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedAt: integer('updatedAt', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [uniqueIndex('tableUsersEmailIndex').on(table.email)]
);

export const sessions = sqliteTable('tableUserSessions', {
	id: text('id').primaryKey(),
	userId: text('userId').notNull(),
	token: text('token').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	ipAddress: text('ipAddress').notNull(),
	userAgent: text('userAgent').notNull(),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const account = sqliteTable('tableUserAccounts', {
	id: text('id').primaryKey(),
	userId: text('userId').notNull(),
	accountId: text('accountId').notNull(),
	providerId: text('providerId').notNull(),
	accessToken: text('accessToken'),
	refreshToken: text('refreshToken'),
	accessTokenExpiresAt: integer('accessTokenExpiresAt', { mode: 'timestamp' }),
	refreshTokenExpiresAt: integer('refreshTokenExpiresAt', { mode: 'timestamp' }),
	scope: text('scope'),
	idToken: text('idToken'),
	password: text('password'),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const verification = sqliteTable('tableUserVerifications', {
	id: text('id').primaryKey(),
	identifier: text('identifier').notNull(),
	value: text('value').notNull(),
	expiresAt: integer('expiresAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	createdAt: integer('createdAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`),
	updatedAt: integer('updatedAt', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

//#endregion

export const apiKeys = sqliteTable(
	'tableApiKeys',
	{
		index: integer().primaryKey({ autoIncrement: true }),
		userId: text('userId').notNull(),
		key: text('key').notNull(),
		name: text('name').notNull(),
		domains: text('domains'),
		createdAt: integer('createdAt', { mode: 'timestamp' }).notNull(),
		updatedAt: integer('updatedAt', { mode: 'timestamp' }).notNull(),
		active: integer('active', { mode: 'boolean' }).notNull(),
		unlimited: integer('unlimited', { mode: 'boolean' }).notNull()
	},
	(table) => [
		index('tableApiKeysIndex').on(table.key),
		foreignKey({
			name: 'tableApiKeysUserIdFk',
			columns: [table.userId],
			foreignColumns: [users.id]
		})
	]
);

export const apiKeyUsages = sqliteTable(
	'tableApiKeyUsages',
	{
		index: integer().primaryKey({ autoIncrement: true }),
		keyIndex: integer('keyIndex').notNull(),
		count: integer('count').notNull(),
		date: integer('date', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => [
		index('tableApiKeyUsagesIndex').on(table.keyIndex),
		foreignKey({
			name: 'tableApiKeyUsagesKeyIndexFk',
			columns: [table.keyIndex],
			foreignColumns: [apiKeys.index]
		})
	]
);

export const userRelations = relations(users, ({ many }) => ({
	userApiKeys: many(apiKeys)
}));

export const apiKeyRelations = relations(apiKeys, ({ one, many }) => ({
	apiKeyUser: one(users, { fields: [apiKeys.userId], references: [users.id] }),
	apiKeyUsages: many(apiKeyUsages)
}));

export const apiKeyUsageRelations = relations(apiKeyUsages, ({ one }) => ({
	apiKeyUsageKey: one(apiKeys, { fields: [apiKeyUsages.keyIndex], references: [apiKeys.index] })
}));

export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;

export type DbApiKey = typeof apiKeys.$inferSelect;
export type DbApiKeyInsert = typeof apiKeys.$inferInsert;

export type DbApiKeyUsage = typeof apiKeyUsages.$inferSelect;
export type DbApiKeyUsageInsert = typeof apiKeyUsages.$inferInsert;
