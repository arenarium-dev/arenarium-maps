import { z } from 'zod';

export const mapThemeSchema = z.object({
	name: z.literal('dark').or(z.literal('light')),
	colors: z.object({
		primary: z.string().max(64),
		background: z.string().max(64),
		text: z.string().max(64)
	})
});

export const mapOptionsSchema = z.object({
	container: z.string(),
	position: z.object({
		center: z.object({
			lat: z.number(),
			lng: z.number()
		}),
		zoom: z.number()
	}),
	theme: mapThemeSchema
	// events: z.object({
	//     onLoading: z.function().returns(z.void()).nullable(),
	//     onLoaded: z.function().returns(z.void()).nullable(),
	// }),
});

export const mapPopupSchema = z.object({
	id: z.string(),
	index: z.number(),
	lat: z.number(),
	lng: z.number(),
	width: z.number(),
	height: z.number()
});

export const mapPopupsSchema = z.array(mapPopupSchema);

export type MapOptions = z.infer<typeof mapOptionsSchema>;
export type MapTheme = z.infer<typeof mapThemeSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
