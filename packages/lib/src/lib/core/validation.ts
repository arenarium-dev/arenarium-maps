import { z } from 'zod';

export const mapOptionsSchema = z.object({
	container: z.string().or(z.instanceof(HTMLElement)),
	position: z.object({
		center: z.object({
			lat: z.number(),
			lng: z.number()
		}),
		zoom: z.number()
	}),
	theme: z.literal('dark').or(z.literal('light'))
	// events: z.object({
	//     onLoading: z.function().returns(z.void()).nullable(),
	//     onLoaded: z.function().returns(z.void()).nullable(),
	// }),
});

export type MapOptions = z.infer<typeof mapOptionsSchema>;
