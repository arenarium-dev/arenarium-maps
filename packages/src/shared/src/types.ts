export namespace Types {
    export interface Popup {
        id: string;
        index: number;
        lat: number;
        lng: number;
        width: number;
        height: number;
    }

    export interface Marker {
        id: string;
        lat: number;
        lng: number;
        width: number;
        height: number;
        zet: number;
        angs: [number, number][];
    }
}