export namespace Popup {
	export type State = [number, [number, number][]];

	export interface Data {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
		padding: number;
	}

	export interface StatesRequest {
		key: string;
		data: Data[];
	}
}

export interface Log {
	title: string;
	content: any;
}
