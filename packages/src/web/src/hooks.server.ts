import {sequence} from '@sveltejs/kit/hooks';
import * as Sentry from '@sentry/sveltekit';
import { dev } from '$app/environment';
import type { Handle } from '@sveltejs/kit';
import type { HandleServerError } from '@sveltejs/kit';

import { getBetterAuth } from '$lib/server/auth';

import { svelteKitHandler } from 'better-auth/svelte-kit';

Sentry.init({
    dsn: "https://48677200e2fa419798b4623b3ffe6ed4@o4509365658976256.ingest.de.sentry.io/4509365660549200",
    tracesSampleRate: 1
})

export const handle: Handle = sequence(Sentry.sentryHandle(), async ({ event, resolve }) => {
	const auth = getBetterAuth(event);
	return svelteKitHandler({ event, resolve, auth });
});

export const handleError: HandleServerError = Sentry.handleErrorWithSentry(async (input) => {
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
			event: {
				params: input.event.params,
				url: input.event.request.url,
				cf: input.event.platform?.cf,
				address: input.event.getClientAddress()
			}
		}
	};

	console.error(body);
});