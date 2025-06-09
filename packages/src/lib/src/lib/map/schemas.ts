import { z } from 'zod';

// Options

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
		.optional()
});

export type MapConfiguration = z.infer<typeof mapConfigurationSchema>;

// Popups

export const mapPopupDataSchema = z.object({
	id: z.string().min(1),
	rank: z.number(),
	lat: z.number().min(-90).max(90),
	lng: z.number().min(-180).max(180),
	width: z.number().min(56),
	height: z.number().min(56)
});

export const mapPopupStateSchema = z.tuple([z.number(), z.array(z.tuple([z.number(), z.number()]))]);

export const mapPopupContentCallbackSchema = z.function().args(z.string()).returns(z.promise(z.any()));

export const mapPopupSchema = z.object({
	data: mapPopupDataSchema,
	state: mapPopupStateSchema,
	callbacks: z.object({
		body: mapPopupContentCallbackSchema,
		pin: mapPopupContentCallbackSchema.optional()
	})
});

export const mapPopupsSchema = z.array(mapPopupSchema);

export const mapPopupStatesRequestSchema = z.object({
	key: z.string(),
	data: z.array(mapPopupDataSchema)
});

export type MapPopupData = z.infer<typeof mapPopupDataSchema>;
export type MapPopupState = z.infer<typeof mapPopupStateSchema>;
export type MapPopupContentCallback = z.infer<typeof mapPopupContentCallbackSchema>;
export type MapPopup = z.infer<typeof mapPopupSchema>;
export type MapPopupStatesRequest = z.infer<typeof mapPopupStatesRequestSchema>;
