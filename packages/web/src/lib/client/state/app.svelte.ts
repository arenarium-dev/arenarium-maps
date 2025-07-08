import type { Page } from '@sveltejs/kit';

import { Theme } from '$lib/client/state/theme.svelte';
import { Loading } from '$lib/client/state/loading.svelte';
import { Toast } from '$lib/client/state/toast.svelte';
import { User } from '$lib/client/state/user.svelte';

export class App {
	ready = $state<boolean>(false);

	progress = new Loading();
	spinner = new Loading();

	theme = new Theme();
	toast = new Toast();
	user = new User();

	initialize(page: Page) {
		this.theme.initialize();
		this.user.initialize(page);
		this.ready = true;
	}
}

export const app = new App();
