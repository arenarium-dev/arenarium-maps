import * as v from 'valibot';

// Configuration

export const mapConfigurationSchema = v.object({
	pin: v.optional(
		v.object({
			fade: v.optional(v.boolean()),
			maxCount: v.optional(v.number()),
			maxZoom: v.optional(v.number())
		})
	),
	animation: v.optional(
		v.object({
			queue: v.optional(
				v.object({
					limit: v.optional(v.number())
				})
			)
		})
	),
	api: v.optional(
		v.object({
			key: v.optional(v.string()),
			log: v.optional(
				v.object({
					enabled: v.optional(v.boolean())
				})
			)
		})
	)
});

export type MapConfiguration = v.InferOutput<typeof mapConfigurationSchema>;

// Map

export const mapLatitudeSchema = v.pipe(v.number(), v.minValue(-90), v.maxValue(90));
export const mapLongitudeSchema = v.pipe(v.number(), v.minValue(-180), v.maxValue(180));
export const mapBoundsSchema = v.object({
	sw: v.object({ lat: mapLatitudeSchema, lng: mapLongitudeSchema }),
	ne: v.object({ lat: mapLatitudeSchema, lng: mapLongitudeSchema })
});
export const mapHtmlElementSchema = v.custom<HTMLElement>((data) => data instanceof HTMLElement);

export const mapProviderParametersSchema = v.object({
	mapSize: v.number(),
	zoomMin: v.number(),
	zoomMax: v.number(),
	zoomScale: v.number()
});

export const mapProviderMarkerSchema = v.object({
	instance: v.any(),
	inserted: v.pipe(v.function(), v.returns(v.boolean())),
	insert: v.pipe(v.function(), v.returns(v.void())),
	remove: v.pipe(v.function(), v.returns(v.void())),
	update: v.pipe(v.function(), v.args(v.tuple([v.number()])), v.returns(v.void()))
});

export const mapProviderSchema = v.object({
	parameters: mapProviderParametersSchema,
	getContainer: v.pipe(v.function(), v.returns(mapHtmlElementSchema)),
	getZoom: v.pipe(v.function(), v.returns(v.number())),
	getBounds: v.pipe(v.function(), v.returns(mapBoundsSchema)),
	panBy: v.pipe(v.function(), v.args(v.tuple([v.number(), v.number()])), v.returns(v.void())),
	createMarker: v.pipe(
		v.function(),
		v.args(v.tuple([mapHtmlElementSchema, mapLatitudeSchema, mapLongitudeSchema, v.number()])),
		v.returns(mapProviderMarkerSchema)
	)
});

export type MapLatitude = v.InferOutput<typeof mapLatitudeSchema>;
export type MapLongitude = v.InferOutput<typeof mapLongitudeSchema>;
export type MapBounds = v.InferOutput<typeof mapBoundsSchema>;
export type MapHtmlElement = v.InferOutput<typeof mapHtmlElementSchema>;
export type MapProvider = v.InferOutput<typeof mapProviderSchema>;
export type MapProviderMarker = v.InferOutput<typeof mapProviderMarkerSchema>;
export type MapProviderParameters = v.InferOutput<typeof mapProviderParametersSchema>;

// Markers

export const mapBodyCallbackSchema = v.pipe(
	v.function(),
	v.args(v.tuple([v.string()])),
	v.returns(v.custom<Promise<HTMLElement>>((data) => data instanceof Promise))
);

export const mapMarkerSchema = v.object({
	id: v.pipe(v.string(), v.minLength(1)),
	rank: v.number(),
	lat: mapLatitudeSchema,
	lng: mapLongitudeSchema,
	tooltip: v.object({
		style: v.pipe(
			v.object({
				width: v.number(),
				height: v.number(),
				margin: v.number(),
				radius: v.number()
			}),
			v.check((data) => Math.min(data.width, data.height) / data.margin >= 5, 'Tooltip width and height must be at least 5 times the margin')
		),
		body: mapBodyCallbackSchema
	}),
	pin: v.optional(
		v.object({
			style: v.object({
				width: v.number(),
				height: v.number(),
				radius: v.number()
			}),
			body: mapBodyCallbackSchema
		})
	),
	popup: v.optional(
		v.object({
			style: v.object({
				width: v.number(),
				height: v.number(),
				radius: v.number(),
				margin: v.number()
			}),
			body: mapBodyCallbackSchema
		})
	)
});

export const mapMarkersSchema = v.array(mapMarkerSchema);

export type MapBodyCallback = v.InferOutput<typeof mapBodyCallbackSchema>;
export type MapMarker = v.InferOutput<typeof mapMarkerSchema>;

// Tooltip states

export const mapTooltipStateSchema = v.tuple([v.number(), v.array(v.tuple([v.number(), v.number()]))]);

export const mapTooltipStateInputSchema = v.object({
	id: v.string(),
	rank: v.number(),
	lat: v.number(),
	lng: v.number(),
	width: v.number(),
	height: v.number(),
	margin: v.number()
});

export const mapTooltipStatesRequestSchema = v.object({
	key: v.string(),
	parameters: mapProviderParametersSchema,
	input: v.array(mapTooltipStateInputSchema)
});

export type MapTooltipState = v.InferOutput<typeof mapTooltipStateSchema>;
export type MapTooltipStateInput = v.InferOutput<typeof mapTooltipStateInputSchema>;
export type MapTooltipStatesRequest = v.InferOutput<typeof mapTooltipStatesRequestSchema>;

// Log

export const logLevelSchema = v.picklist(['info', 'warn', 'error']);

export const logSchema = v.object({
	title: v.string(),
	level: logLevelSchema,
	content: v.any()
});

export type Log = v.InferOutput<typeof logSchema>;
export type LogLevel = v.InferOutput<typeof logLevelSchema>;
