import { z } from 'zod';

// Options
export const mapCoordinateSchema = z.object({
	lat: z.number(),
	lng: z.number()
});

export const mapBoundsSchema = z.object({
	sw: mapCoordinateSchema,
	ne: mapCoordinateSchema
});

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

// Popups
export const mapPopupSchema = z.object({
	id: z.string(),
	rank: z.number(),
	lat: z.number(),
	lng: z.number(),
	width: z.number(),
	height: z.number()
});

export const mapPopupsSchema = z.array(mapPopupSchema);

export const mapPopupCallbackSchema = z.function().args(mapBoundsSchema).returns(z.promise(mapPopupsSchema));

export const mapPopupContentCallbackSchema = z.function().args(z.string()).returns(z.promise(z.string()));

export type MapCoordinate = z.infer<typeof mapCoordinateSchema>;
export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type MapOptions = z.infer<typeof mapOptionsSchema>;
export type MapStyle = z.infer<typeof mapStyleSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
export type MapPopupCallback = z.infer<typeof mapPopupCallbackSchema>;
export type MapPopupContentCallback = z.infer<typeof mapPopupContentCallbackSchema>;
