import { getUser } from '$lib/server/auth';

import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async (event) => {
	const serverUser = await getUser(event);
	const clientUser: App.User | undefined = serverUser
		? {
				id: serverUser.id,
				name: serverUser.name,
				email: serverUser.email,
				image: serverUser.image
			}
		: undefined;

	return {
		user: clientUser
	};
};
