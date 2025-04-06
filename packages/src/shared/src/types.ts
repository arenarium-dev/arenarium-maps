export namespace Types {
    export type PopupContentCallback = (ids: string[]) => Promise<string[]>;

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
        zet: number;
        angs: [number, number][];
    }

    export interface Block {
        id: string;
        sw: { lat: number; lng: number };
        ne: { lat: number; lng: number };
        zs: number;
        ze: number;
        markers: Marker[];
    }
}