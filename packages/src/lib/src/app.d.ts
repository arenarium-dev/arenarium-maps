// See https://svelte.dev/docs/kit/types#app.d.ts
// for information about these interfaces
declare global {
	namespace App {
		// interface Error {}
		// interface Locals {}
		// interface PageData {}
		// interface PageState {}
		// interface Platform {}

		namespace Map {
			interface Marker {
				id: string;
				rank: number;
				lat: number;
				lng: number;
			}
		}
	}
}

export {};
