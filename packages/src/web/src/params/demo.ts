import type { ParamMatcher } from '@sveltejs/kit';

import { DemoSchema, type Demo } from '$lib/shared/demo';

export const match = ((param: string): param is Demo => {
	return DemoSchema.safeParse(param).success;
}) satisfies ParamMatcher;
