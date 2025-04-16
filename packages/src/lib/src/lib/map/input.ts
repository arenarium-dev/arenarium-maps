import { z } from 'zod';

export const mapStyleSchema = z.object({
	name: z.literal('dark').or(z.literal('light')),
	url: z.string().optional(),
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
	style: mapStyleSchema,
	events: z
		.object({
			onMapIdle: z.function().returns(z.void()).optional(),
			onMapMove: z
				.function()
				.args(z.object({ lat: z.number(), lng: z.number(), zoom: z.number() }))
				.returns(z.void())
				.optional(),
			onMapClick: z.function().returns(z.void()).optional(),
			onPopupClick: z.function().args(z.string()).returns(z.void()).optional(),
			onLoadingStart: z.function().returns(z.void()).optional(),
			onLoadingEnd: z.function().returns(z.void()).optional()
		})
		.optional()
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
export type MapStyle = z.infer<typeof mapStyleSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
