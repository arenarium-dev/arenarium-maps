import { relations, sql } from 'drizzle-orm';
import { text, integer, sqliteTable, uniqueIndex, index, foreignKey, real } from 'drizzle-orm/sqlite-core';

export const kv = sqliteTable('tableKv', {
	key: text('key').notNull().primaryKey(),
	value: text('value', { mode: 'json' }).notNull(),
	timestamp: integer('timestamp', { mode: 'timestamp' })
		.notNull()
		.default(sql`(unixepoch())`)
});

export const users = sqliteTable(
	'tableUsers',
	{
		// Base
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
			.default(sql`(unixepoch())`),
		// Extended
		latitude: real('latitude'),
		longitude: real('longitude'),
		tier: integer('tier')
	},
	(table) => ({
		emailIdx: uniqueIndex('tableUsersEmailIndex').on(table.email)
	})
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

export const posts = sqliteTable(
	'tablePosts',
	{
		id: text('id').primaryKey(),
		// References
		userId: text('userId').notNull(),
		replyId: text('replyId'),
		// Status
		active: integer('active', { mode: 'boolean' }).notNull(),
		// Date
		createdDate: integer('createdDate', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		updatedDate: integer('updatedDate', { mode: 'timestamp' }),
		// Location
		lat: real('lat').notNull(),
		lng: real('lng').notNull(),
		// Link
		link: text('linkMetadata', { mode: 'json' }),
		// Message
		message: text('message'),
		// Tags
		tags: text('tags'),
		// Mode
		mode: integer('mode').notNull().default(0),
		// Rectangle
		rectangle: text('rectangleMetadata', { mode: 'json' }),
		// Derived
		votes: integer('votes').notNull().default(0),
		replies: integer('replies').notNull().default(0)
	},
	(table) => ({
		userIdIdx: index('tablePostsUserIdIndex').on(table.userId),
		createdDateIdx: index('tablePostsDateIndex').on(table.createdDate),
		userReference: foreignKey({
			name: 'tablePostsUserIdFk',
			columns: [table.userId],
			foreignColumns: [users.id],			
		}),
		replyReference: foreignKey({
			name: 'tablePostsReplyIdFk',
			columns: [table.replyId],
			foreignColumns: [table.id],	
		})
	})
);

export const votes = sqliteTable(
	'tableVotes',
	{
		userId: text('userId').notNull(),
		postId: text('postId').notNull(),
		value: integer('value').notNull(),
		date: integer('date', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => ({
		userIdx: index('tableVotesUserIdIndex').on(table.userId),
		postIdx: index('tableVotesPostIdIndex').on(table.postId),
		dateIdx: index('tableVotesDateIndex').on(table.date),
		postReference: foreignKey({
			name: 'tableVotesPostIdFk',
			columns: [table.postId],
			foreignColumns: [posts.id]
		})
	})
);

export const notifications = sqliteTable(
	'tableNotifications',
	{
		id: text('id').primaryKey(),
		userId: text('userId').notNull(),
		data: text('data', { mode: 'json' }).notNull(),
		read: integer('read', { mode: 'boolean' }).notNull(),
		date: integer('date', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`)
	},
	(table) => ({
		userIdx: index('tableNotificationsUserIdIndex').on(table.userId),
		dateIdx: index('tableNotificationsDateIndex').on(table.date)
	})
);

export const logs = sqliteTable(
	'tableLogs',
	{
		index: integer('index').primaryKey(),
		date: integer('date', { mode: 'timestamp' })
			.notNull()
			.default(sql`(unixepoch())`),
		message: text('title').notNull(),
		data: text('data', { mode: 'json' }).notNull()
	},
	(table) => ({
		dateIdx: index('tableLogsDateIndex').on(table.date)
	})
);

export const userRelations = relations(users, ({ many }) => ({
	userPosts: many(posts)
}));

export const postRelations = relations(posts, ({ one, many }) => ({
	postUser: one(users, { fields: [posts.userId], references: [users.id] }),
	postReply: one(posts, { relationName: 'reply', fields: [posts.replyId], references: [posts.id] }),
	postReplies: many(posts, { relationName: 'reply' }),
	postVotes: many(votes)
}));

export const voteRelations = relations(votes, ({ one }) => ({
	votePost: one(posts, { fields: [votes.postId], references: [posts.id] })
}));

export type DbKv = typeof kv.$inferSelect;
export type DbKvInsert = typeof kv.$inferInsert;

export type DbUser = typeof users.$inferSelect;
export type DbUserInsert = typeof users.$inferInsert;

export type DbPost = typeof posts.$inferSelect;
export type DbPostInsert = typeof posts.$inferInsert;

export type DbVote = typeof votes.$inferSelect;
export type DbVoteInsert = typeof votes.$inferInsert;

export type DbNotification = typeof notifications.$inferSelect;
export type DbNotificationInsert = typeof notifications.$inferInsert;

export type DbLog = typeof logs.$inferSelect;
export type DbLogInsert = typeof logs.$inferInsert;
