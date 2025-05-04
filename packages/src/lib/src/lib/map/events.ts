import { eventHandlerSchemas, type EventId, type EventHandlerMap, type EventPayloadMap } from './schemas.js';

// Type helper for a handler function for a specific event E
type EventHandler<E extends EventId> = (payload: EventHandlerMap[E]) => void;

export class MapEventEmitter {
	// Stores handlers: Map<EventId, Set<Function>>
	// Using Set to automatically handle duplicate handler registrations.
	// Storing as Function internally, but on/off methods enforce specific types.
	private handlers: Map<EventId, Set<Function>> = new Map();

	public on<E extends EventId>(eventId: E, handler: EventHandler<E>): void {
		const schema = eventHandlerSchemas[eventId];
		if (!schema) throw new Error(`No schema defined for event ${eventId}`);

		const schemaValidationResult = schema.safeParse(handler);
		if (!schemaValidationResult.success) throw new Error(`Invalid handler for event ${eventId}`);

		if (!this.handlers.has(eventId)) this.handlers.set(eventId, new Set());
		this.handlers.get(eventId)?.add(handler as Function);
	}

	public off<E extends EventId>(eventId: E, handler: EventHandler<E>): void {
		const eventHandlers = this.handlers.get(eventId);
		if (eventHandlers) {
			const deleted = eventHandlers.delete(handler as Function);
			if (deleted && eventHandlers.size === 0) {
				this.handlers.delete(eventId);
			}
		}
	}

	public emit<E extends EventId>(eventId: E, payload: EventPayloadMap[E]): void {
		const eventHandlers = this.handlers.get(eventId);
		if (eventHandlers && eventHandlers.size > 0) {
			[...eventHandlers].forEach((handler) => {
				try {
					handler(payload);
				} catch (error) {
					console.error(error);
				}
			});
		}
	}
}
