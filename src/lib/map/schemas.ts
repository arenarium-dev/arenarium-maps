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
	api: z
		.object({
			states: z
				.object({
					url: z.string(),
					key: z.string()
				})
				.optional(),
			log: z
				.object({
					enabled: z.boolean()
				})
				.optional()
		})
		.optional()
});

export type MapConfiguration = z.infer<typeof mapConfigurationSchema>;

// Map

export const mapLatitudeSchema = z.number().min(-90).max(90);
export const mapLongitudeSchema = z.number().min(-180).max(180);
export const mapBoundsSchema = z.object({
	sw: z.object({ lat: mapLatitudeSchema, lng: mapLongitudeSchema }),
	ne: z.object({ lat: mapLatitudeSchema, lng: mapLongitudeSchema })
});
export const mapHtmlElementSchema = z.any().refine((element) => element instanceof HTMLElement, 'Must be an HTMLElement');

export const mapProviderParametersSchema = z.object({
	mapSize: z.number(),
	zoomMin: z.number(),
	zoomMax: z.number(),
	zoomScale: z.number()
});

export const mapProviderMarkerSchema = z.object({
	instance: z.any(),
	inserted: z.function().returns(z.boolean()),
	insert: z.function().returns(z.void()),
	remove: z.function().returns(z.void()),
	update: z.function().args(z.number()).returns(z.void())
});

export const mapProviderSchema = z.object({
	parameters: mapProviderParametersSchema,
	getContainer: z.function().args().returns(mapHtmlElementSchema),
	getZoom: z.function().args().returns(z.number()),
	getBounds: z.function().args().returns(mapBoundsSchema),
	panBy: z.function().args(z.number(), z.number()).returns(z.void()),
	createMarker: z.function().args(mapHtmlElementSchema, mapLatitudeSchema, mapLongitudeSchema, z.number()).returns(mapProviderMarkerSchema)
});

export type MapLatitude = z.infer<typeof mapLatitudeSchema>;
export type MapLongitude = z.infer<typeof mapLongitudeSchema>;
export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type MapHtmlElement = z.infer<typeof mapHtmlElementSchema>;
export type MapProvider = z.infer<typeof mapProviderSchema>;
export type MapProviderMarker = z.infer<typeof mapProviderMarkerSchema>;
export type MapProviderParameters = z.infer<typeof mapProviderParametersSchema>;

// Markers

export const mapBodyCallbackSchema = z.function().args(z.string()).returns(z.promise(mapHtmlElementSchema));

export const mapMarkerSchema = z.object({
	id: z.string().min(1),
	rank: z.number(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	tooltip: z.object({
		style: z
			.object({
				width: z.number(),
				height: z.number(),
				margin: z.number(),
				radius: z.number()
			})
			.refine((data) => Math.min(data.width, data.height) / data.margin >= 5, 'Tooltip width and height must be at least 5 times the margin'),
		body: mapBodyCallbackSchema
	}),
	pin: z
		.object({
			style: z.object({
				width: z.number(),
				height: z.number(),
				radius: z.number()
			}),
			body: mapBodyCallbackSchema
		})
		.optional(),
	popup: z
		.object({
			style: z.object({
				width: z.number(),
				height: z.number(),
				radius: z.number(),
				margin: z.number()
			}),
			body: mapBodyCallbackSchema
		})
		.optional()
});

export const mapMarkersSchema = z.array(mapMarkerSchema);

export type MapBodyCallback = z.infer<typeof mapBodyCallbackSchema>;
export type MapMarker = z.infer<typeof mapMarkerSchema>;

// Tooltip states

export const mapTooltipStateSchema = z.tuple([z.number(), z.array(z.tuple([z.number(), z.number()]))]);

export const mapTooltipStateInputSchema = z.object({
	id: z.string(),
	rank: z.number(),
	lat: z.number(),
	lng: z.number(),
	width: z.number(),
	height: z.number(),
	margin: z.number()
});

export const mapTooltipStatesRequestSchema = z.object({
	key: z.string(),
	parameters: mapProviderParametersSchema,
	input: z.array(mapTooltipStateInputSchema)
});

export type MapTooltipState = z.infer<typeof mapTooltipStateSchema>;
export type MapTooltipStateInput = z.infer<typeof mapTooltipStateInputSchema>;
export type MapTooltipStatesRequest = z.infer<typeof mapTooltipStatesRequestSchema>;

// Log

export const logLevelSchema = z.enum(['info', 'warn', 'error']);

export const logSchema = z.object({
	title: z.string(),
	level: logLevelSchema,
	content: z.any()
});

export type Log = z.infer<typeof logSchema>;
export type LogLevel = z.infer<typeof logLevelSchema>;
