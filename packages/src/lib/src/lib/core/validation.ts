import { z } from 'zod';

export const mapOptionsSchema = z.object({
	container: z.string(),
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

export const mapMarkerSchema = z.object({
	id: z.string(),
	rank: z.number(),
	lat: z.number(),
	lng: z.number(),
	width: z.number(),
	height: z.number()
});

export const mapMarkersSchema = z.array(mapMarkerSchema);

export type MapOptions = z.infer<typeof mapOptionsSchema>;

export type MapMarker = z.infer<typeof mapMarkerSchema>;
