import { app } from '$lib/client/state/app.svelte';

import type maplibregl from 'maplibre-gl';

import { MapDarkStyle, MapStyleLight } from '@arenarium/maps/maplibre';
import type { MapConfiguration } from '@arenarium/maps';

export enum Demo {
	Rentals = 'rentals',
	Events = 'events',
	News = 'news',
	SrbijaNekretnine = 'srbija-nekretnine',
	CityExpert = 'cityexpert'
}

export type DemoSize = 'small' | 'large';
export type DemoStyle = 'website' | 'light' | 'dark' | 'liberty';

export function getDemoName(demo: Demo) {
	switch (demo) {
		default:
			return 'Basic';
		case Demo.Rentals:
			return 'Rentals';
		case Demo.Events:
			return 'Events';
		case Demo.News:
			return 'News';
		case Demo.SrbijaNekretnine:
			return 'srbija-nekretnine.org';
		case Demo.CityExpert:
			return 'cityexpert.rs';
	}
}

export function getDemoStyle(demo: Demo, style: DemoStyle): string | maplibregl.StyleSpecification {
	switch (demo) {
		case Demo.SrbijaNekretnine: {
			return 'https://tiles.openfreemap.org/styles/bright';
		}
		case Demo.CityExpert: {
			return 'demo/cityexpert.style.json';
		}
		default: {
			switch (style) {
				case 'website': {
					return app.theme.get() == 'dark' ? MapDarkStyle : MapStyleLight;
				}
				case 'light': {
					return MapStyleLight;
				}
				case 'dark': {
					return MapDarkStyle;
				}
				case 'liberty': {
					return 'https://tiles.openfreemap.org/styles/liberty';
				}
			}
		}
	}
}

export function getDemoColors(demo: Demo, style: DemoStyle): { background: string; primary: string; text: string } {
	switch (demo) {
		case Demo.SrbijaNekretnine: {
			return {
				background: 'white',
				primary: '#ff4400',
				text: 'black'
			};
		}
		case Demo.CityExpert: {
			return {
				background: 'white',
				primary: 'white',
				text: 'black'
			};
		}
		default: {
			switch (style) {
				case 'website': {
					return app.theme.get() == 'dark'
						? { background: 'var(--surface)', primary: 'lightgreen', text: 'var(--on-surface)' }
						: { background: 'white', primary: 'darkgreen', text: 'black' };
				}
				case 'light': {
					return { background: 'white', primary: 'darkgreen', text: 'black' };
				}
				case 'dark': {
					return { background: 'var(--surface)', primary: 'lightgreen', text: 'var(--on-surface)' };
				}
				case 'liberty': {
					return { background: 'white', primary: 'blue', text: 'black' };
				}
			}
		}
	}
}

export function getDemoPosition(demo: Demo): { lat: number; lng: number; zoom: number } {
	switch (demo) {
		case Demo.SrbijaNekretnine: {
			return {
				lat: 44.811222,
				lng: 20.450989,
				zoom: 12
			};
		}
		case Demo.CityExpert: {
			return {
				lat: 44.811222,
				lng: 20.450989,
				zoom: 10
			};
		}
		default: {
			return {
				lat: 51.505,
				lng: -0.09,
				zoom: 4
			};
		}
	}
}

export function getDemoConfiguration(demo: Demo): MapConfiguration {
	switch (demo) {
		default: {
			return {
				pin: {
					fade: true
				}
			};
		}
		case Demo.CityExpert: {
			return {
				pin: {
					fade: false
				}
			};
		}
	}
}

export function getPopupDimensions(demo: Demo, size: DemoSize): { width: number; height: number; padding: number } {
	switch (demo) {
		default:
			switch (size) {
				case 'large':
					return { width: 64, height: 64, padding: 6 };
				case 'small':
					return { width: 48, height: 48, padding: 4 };
			}
		case Demo.Rentals:
			switch (size) {
				case 'large':
					return { width: 128, height: 104, padding: 8 };
				case 'small':
					return { width: 96, height: 80, padding: 6 };
			}
		case Demo.SrbijaNekretnine:
			return { width: 156, height: 128, padding: 8 };
		case Demo.CityExpert:
			return { width: 156, height: 128, padding: 8 };
	}
}
