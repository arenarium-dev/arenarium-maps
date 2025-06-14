import { z } from 'zod';

// Configuration

export const mapConfigurationSchema = z.object({
	pin: z
		.object({
			fade: z.boolean().optional(),
			maxCount: z.number().optional(),
			maxZoom: z.number().optional()
		})
		.optional(),
	animation: z
		.object({
			queue: z
				.object({
					limit: z.number().optional()
				})
				.optional()
		})
		.optional(),
	states: z
		.object({
			api: z.string().optional()
		})
		.optional()
});

export type MapConfiguration = z.infer<typeof mapConfigurationSchema>;

// Map

export const mapLatitudeSchema = z.number().min(-90).max(90);
export const mapLongitudeSchema = z.number().min(-180).max(180);
export const mapHtmlElementSchema = z.any().refine((element) => element instanceof HTMLElement, 'Must be an HTMLElement');

export const mapProviderParametersSchema = z.object({
	mapSize: z.number(),
	zoomMin: z.number(),
	zoomMax: z.number(),
	zoomScale: z.number()
});

export const mapProviderMarkerSchema = z.object({
	instance: z.any(),
	inserted: z.function().args().returns(z.boolean()),
	insert: z.function().args().returns(z.void()),
	remove: z.function().args().returns(z.void()),
	update: z.function().args(z.number()).returns(z.void())
});

export const mapProviderSchema = z.object({
	parameters: mapProviderParametersSchema,
	getContainer: z.function().args().returns(mapHtmlElementSchema),
	getZoom: z.function().args().returns(z.number()),
	getWidth: z.function().args().returns(z.number()),
	getHeight: z.function().args().returns(z.number()),
	createMarker: z.function().args(mapHtmlElementSchema, mapLatitudeSchema, mapLongitudeSchema, z.number()).returns(mapProviderMarkerSchema)
});

export type MapLatitude = z.infer<typeof mapLatitudeSchema>;
export type MapLongitude = z.infer<typeof mapLongitudeSchema>;
export type MapHtmlElement = z.infer<typeof mapHtmlElementSchema>;
export type MapProvider = z.infer<typeof mapProviderSchema>;
export type MapProviderMarker = z.infer<typeof mapProviderMarkerSchema>;
export type MapProviderParameters = z.infer<typeof mapProviderParametersSchema>;

// Popups

export const mapPopupDataSchema = z
	.object({
		id: z.string().min(1),
		rank: z.number(),
		lat: z.number().min(-90).max(90),
		lng: z.number().min(-180).max(180),
		width: z.number(),
		height: z.number(),
		padding: z.number()
	})
	.refine((data) => Math.min(data.width, data.height) / data.padding >= 4, 'Popup width and height must be at least 4 times the padding');

export const mapPopupStateSchema = z.tuple([z.number(), z.array(z.tuple([z.number(), z.number()]))]);

export const mapPopupContentCallbackSchema = z.function().args(z.string()).returns(z.promise(z.any()));

export const mapPopupSchema = z.object({
	data: mapPopupDataSchema,
	callbacks: z.object({
		body: mapPopupContentCallbackSchema,
		pin: mapPopupContentCallbackSchema.optional()
	})
});

export const mapPopupsSchema = z.array(mapPopupSchema);

export const mapPopupStatesRequestSchema = z.object({
	key: z.string(),
	parameters: mapProviderParametersSchema,
	data: z.array(mapPopupDataSchema)
});

export type MapPopupData = z.infer<typeof mapPopupDataSchema>;
export type MapPopupState = z.infer<typeof mapPopupStateSchema>;
export type MapPopupContentCallback = z.infer<typeof mapPopupContentCallbackSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
export type MapPopupStatesRequest = z.infer<typeof mapPopupStatesRequestSchema>;
