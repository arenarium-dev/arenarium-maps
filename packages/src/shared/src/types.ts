export namespace Popup {
	export interface Parameters {
		mapSize: number;
		zoomMin: number;
		zoomMax: number;
		zoomScale: number;
	}

	export interface Data {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		margin: number;
	}

	export interface StatesRequest {
		key: string;
		parameters: Parameters;
		data: Data[];
	}

	export type State = [number, [number, number][]];
}

export interface Log {
	title: string;
	content: any;
}
