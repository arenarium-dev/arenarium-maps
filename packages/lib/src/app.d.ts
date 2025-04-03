// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		interface Marker {
			id: string;
			lat: number;
			lng: number;
			zet: number;
			angs: [number, number][];
		}
	}
}

export {};
