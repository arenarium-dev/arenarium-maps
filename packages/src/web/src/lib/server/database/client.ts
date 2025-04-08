import { drizzle, type DrizzleD1Database } from 'drizzle-orm/d1';
import type { BatchItem as DrizzleBatchItem } from 'drizzle-orm/batch';

import * as schema from '$lib/server/database/schema';

export type Database = DrizzleD1Database<typeof schema>;
export type BatchItem = DrizzleBatchItem<'sqlite'>;

let db: Database | undefined = undefined;

export function getDb(d1Database: D1Database | undefined) {
	if (!d1Database) {
		throw new Error('Database not found');
	}

	if (!db) {
		db = drizzle(d1Database, { schema });
	}

	return db;
}

export async function batch(db: Database, items: Array<BatchItem>, chunk?: number) {
	while (items.length > 0) {
		const chunkSize = chunk ?? items.length;
		const chunkItems = items.splice(0, chunkSize);

		if (chunkItems.length > 0) {
			const batchItems = getTuple<BatchItem>(chunkItems);
			await db.batch(batchItems);
		}
	}
}

export function getTuple<T>(array: T[]): [T, ...T[]] {
	if (array.length > 1) {
		return [array[0], ...array.slice(1)];
	} else {
		return [array[0]];
	}
}
