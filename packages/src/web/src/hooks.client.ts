import type { ClientInit, HandleClientError } from '@sveltejs/kit';

import { dev } from '$app/environment';

export const init: ClientInit = async () => {
	let theme = 'dark';

	const userSettingTheme = window.localStorage.getItem('theme');
	if (userSettingTheme) {
		theme = userSettingTheme;
	} else {
		const userPreferenceLight = window.matchMedia('(prefers-color-scheme: light)');
		theme = userPreferenceLight.matches ? 'light' : 'dark';
	}

	window.document.documentElement.className = theme;
};

export const handleError: HandleClientError = async (input) => {
	if (dev) {
		console.error(input.error);
		return;
	}

	const errorIgnoreStatuses = [404];
	if (errorIgnoreStatuses.includes(input.status)) {
		return;
	}

	const body = {
		message: input.message,
		data: {
			error: input.error,
			event: input.event
		}
	};

	console.error(body);
};
