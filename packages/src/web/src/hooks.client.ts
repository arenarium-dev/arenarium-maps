import { dev } from '$app/environment';

import type { ClientInit, HandleClientError } from '@sveltejs/kit';

import { init as SentryInit, replayIntegration as SentryReplayIntegration, handleErrorWithSentry as SentryHandleError } from '@sentry/sveltekit';

// If you don't want to use Session Replay, remove the `Replay` integration,
// `replaysSessionSampleRate` and `replaysOnErrorSampleRate` options.
SentryInit({
	dsn: 'https://48677200e2fa419798b4623b3ffe6ed4@o4509365658976256.ingest.de.sentry.io/4509365660549200',
	tracesSampleRate: 1,
	replaysSessionSampleRate: 0.1,
	replaysOnErrorSampleRate: 1,
	integrations: [SentryReplayIntegration()]
});

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

export const handleError: HandleClientError = SentryHandleError(async (input) => {
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
});
