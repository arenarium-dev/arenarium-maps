import { MAP_MAX_ZOOM, MAP_MIN_ZOOM } from '@workspace/shared/src/constants.js';

import { z } from 'zod';

// Options

export const mapCoordinateSchema = z.object({
	lat: z.number(),
	lng: z.number()
});

export const mapPositionSchema = z.object({
	center: mapCoordinateSchema,
	zoom: z.number()
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
	restriction: z
		.object({
			minZoom: z.number().min(MAP_MIN_ZOOM).max(MAP_MAX_ZOOM).optional(),
			maxZoom: z.number().min(MAP_MIN_ZOOM).max(MAP_MAX_ZOOM).optional(),
			maxBounds: mapBoundsSchema.optional()
		})
		.optional(),
	style: mapStyleSchema
});

export type MapCoordinate = z.infer<typeof mapCoordinateSchema>;
export type MapPosition = z.infer<typeof mapPositionSchema>;
export type MapBounds = z.infer<typeof mapBoundsSchema>;
export type MapOptions = z.infer<typeof mapOptionsSchema>;
export type MapStyle = z.infer<typeof mapStyleSchema>;

// Events

export const mapEventType = z.enum(['idle', 'move', 'click', 'popup_click']);
export const mapEventIdleHandlerSchema = z.function().returns(z.void());
export const mapEventMoveHandlerSchema = z.function().args(mapPositionSchema).returns(z.void());
export const mapEventClickHandlerSchema = z.function().args(mapCoordinateSchema).returns(z.void());

export interface EventPayloadMap {
	idle: null;
	move: MapPosition;
	click: MapCoordinate;
}

export interface EventHandlerMap {
	idle: MapEventIdleHandler;
	move: MapEventMoveHandler;
	click: MapEventClickHandler;
}

export type EventId = keyof EventHandlerMap;
export type EventHandler<E extends EventId> = (payload: EventPayloadMap[E]) => void;

export const eventHandlerSchemas = {
	idle: mapEventIdleHandlerSchema,
	move: mapEventMoveHandlerSchema,
	click: mapEventClickHandlerSchema
} satisfies { [K in EventId]: z.ZodType<EventHandlerMap[K]> };

export type MapEvent = z.infer<typeof mapEventType>;
export type MapEventIdleHandler = z.infer<typeof mapEventIdleHandlerSchema>;
export type MapEventMoveHandler = z.infer<typeof mapEventMoveHandlerSchema>;
export type MapEventClickHandler = z.infer<typeof mapEventClickHandlerSchema>;

// Popups

export const mapPopupDataSchema = z.object({
	id: z.string(),
	rank: z.number(),
	lat: z.number(),
	lng: z.number(),
	width: z.number(),
	height: z.number()
});

export const mapPopupStateSchema = z.tuple([z.number(), z.array(z.tuple([z.number(), z.number()]))]);

export const mapPopupContentCallbackSchema = z.function().args(z.string()).returns(z.promise(z.any()));

export const mapPopupSchema = z.object({
	data: mapPopupDataSchema,
	state: mapPopupStateSchema,
	contentCallback: mapPopupContentCallbackSchema
});

export const mapPopupsSchema = z.array(mapPopupSchema);

export const mapPopupStatesRequestSchema = z.object({
	apiKey: z.string(),
	data: z.array(mapPopupDataSchema),
	minZoom: z.number(),
	maxZoom: z.number()
});

export type MapPopupData = z.infer<typeof mapPopupDataSchema>;
export type MapPopupState = z.infer<typeof mapPopupStateSchema>;
export type MapPopupContentCallback = z.infer<typeof mapPopupContentCallbackSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
export type MapPopupStatesRequest = z.infer<typeof mapPopupStatesRequestSchema>;
