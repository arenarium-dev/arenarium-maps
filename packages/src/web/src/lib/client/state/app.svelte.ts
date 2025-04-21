import { Theme } from '$lib/client/state/theme.svelte';
import { Loading } from '$lib/client/state/loading.svelte';
import { Toast } from '$lib/client/state/toast.svelte';

export class App {
	progress = new Loading();
	spinner = new Loading();

	theme = new Theme();
	toast = new Toast();

	initialize() {
		this.theme.initialize();
	}
}

export const app = new App();
