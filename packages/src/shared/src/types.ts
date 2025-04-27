export namespace Popup {
	export type State = [number, [number, number][]];

	export interface Data {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
	}

	export interface StatesRequest {
		apiKey: string;
		data: Data[];
		minZoom: number;
		maxZoom: number;
	}
}
