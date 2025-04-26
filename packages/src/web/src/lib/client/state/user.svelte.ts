import type { Page } from '@sveltejs/kit';

import { createAuthClient } from 'better-auth/svelte';

export class User {
	client: ReturnType<typeof createAuthClient> | undefined;
	details = $state<App.User>();

	public initialize(page: Page) {
		this.client = createAuthClient({
			baseURL: page.url.origin
		});

		this.details = page.data.user;
	}

	public async signIn() {
		if (!this.client) throw new Error('Client not initialized');

		await this.client.signIn.social({
			provider: 'github',
			callbackURL: '/'
		});
	}

	public async signOut() {
		if (!this.client) throw new Error('Client not initialized');

		await this.client.signOut();
		window.location.reload();
	}
}
