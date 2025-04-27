export namespace Types {
	export type PopupState = [number, [number, number][]];

	export interface PopupData {
		id: string;
		rank: number;
		lat: number;
		lng: number;
		width: number;
		height: number;
	}

	export interface PopupStatesRequest {
		apiKey: string;
		data: PopupData[];
		minZoom: number;
		maxZoom: number;
	}

	export interface Popup {
		data: PopupData;
		state: PopupState;
	}
}
