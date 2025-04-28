import { createFetch } from '@better-fetch/fetch';

export namespace Fetch {
	export const that = createFetch({
		throw: true
	});
}
