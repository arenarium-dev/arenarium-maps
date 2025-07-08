// https://github.com/drizzle-team/drizzle-orm/blob/main/examples/cloudflare-d1/README.md

import { defineConfig } from 'drizzle-kit';

export default defineConfig({
	schema: './src/lib/server/database/schema.ts',
	out: './drizzle',
	dialect: 'sqlite',
	driver: 'd1-http',
	dbCredentials: {
		accountId: process.env.CLOUDFLARE_ACCOUNT_ID!,
		databaseId: process.env.CLOUDFLARE_DATABASE_ID!,
		token: process.env.CLOUDFLARE_D1_TOKEN!
	}
});
