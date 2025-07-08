export namespace Tooltip {
	export interface Parameters {
		mapSize: number;
		zoomMin: number;
		zoomMax: number;
		zoomScale: number;
	}

	export interface StateInput {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		margin: number;
	}

	export type State = [number, [number, number][]];

	export interface StatesRequest {
		key: string;
		parameters: Parameters;
		input: StateInput[];
	}
}

export interface Log {
	title: string;
	content: any;
}
