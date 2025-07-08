import { dev } from '$app/environment';

import type { Handle } from '@sveltejs/kit';
import type { HandleServerError } from '@sveltejs/kit';

import { discord } from '$lib/shared/discord';
import { getBetterAuth } from '$lib/server/auth';
import { svelteKitHandler } from 'better-auth/svelte-kit';

export const handle: Handle = async ({ event, resolve }) => {
	const auth = getBetterAuth(event);
	return svelteKitHandler({ event, resolve, auth });
};

export const handleError: HandleServerError = async (input) => {
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

	console.error(input.message);

	discord.log('Server Hook', {
		message: input.message,
		data: {
			error: input.error,
			event: input.event
		}
	});
};
