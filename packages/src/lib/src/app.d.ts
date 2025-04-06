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
			interface Position {
				lat: number;
				lng: number;
				zoom: number;
			}

			interface Bounds {
				sw: { lat: number; lng: number };
				ne: { lat: number; lng: number };
			}

			namespace Component {
				type SetPopupsContentCallbackFunction = (callback: (ids: string[]) => Promise<string[]>) => void;
				type SetPopupsFunction = (popups: Types.Popup[]) => void;
			}
		}
	}
}

export {};
