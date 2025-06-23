import type { Log } from '@workspace/shared/src/types.js';

export async function log(title: string, content: any) {
	if (import.meta.env.DEV) return;

	try {
		const log: Log = {
			title,
			content
		};

		await fetch('https://arenarium.dev/api/public/v1/log', {
			method: 'POST',
			headers: { 'Content-Type': 'application/json' },
			body: JSON.stringify(log)
		});
	} catch (error) {
		console.error(error);
	}
}
