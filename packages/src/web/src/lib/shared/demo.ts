import { app } from '$lib/client/state/app.svelte';

import type { MapConfiguration } from '@arenarium/maps';

export enum Demo {
	Basic = 'basic',
	Rentals = 'rentals',
	Bookings = 'bookings',
	Events = 'events',
	News = 'news',
	SrbijaNekretnine = 'srbija-nekretnine',
	CityExpert = 'cityexpert'
}

export type DemoMap = 'maplibre' | 'google';
export type DemoSize = 'small' | 'large';
export type DemoStyle = 'website' | 'light' | 'dark' | 'default';

export function getDemoName(demo: Demo) {
	switch (demo) {
		default:
			return 'Basic';
		case Demo.Rentals:
			return 'Rentals';
		case Demo.Bookings:
			return 'Bookings';
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

export function getDemoColors(demo: Demo, style: DemoStyle): { background: string; primary: string; text: string } {
	switch (demo) {
		case Demo.Bookings: {
			switch (style) {
				case 'website': {
					return app.theme.get() == 'dark'
						? { background: 'black', primary: 'black', text: 'white' }
						: { background: 'white', primary: 'white', text: 'black' };
				}
				case 'light': {
					return { background: 'white', primary: 'white', text: 'black' };
				}
				case 'dark': {
					return { background: 'black', primary: 'black', text: 'white' };
				}
				default: {
					return { background: 'white', primary: 'white', text: 'black' };
				}
			}
		}
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
						: { background: 'var(--surface)', primary: 'darkgreen', text: 'var(--on-surface)' };
				}
				case 'light': {
					return { background: 'white', primary: 'darkgreen', text: 'black' };
				}
				case 'dark': {
					return { background: 'black', primary: 'lightgreen', text: 'white' };
				}
				case 'default': {
					return { background: 'white', primary: 'purple', text: 'black' };
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
		case Demo.Bookings: {
			return {
				pin: {
					fade: false
				},
				states: {
					api: '/api/popup/states'
				}
			};
		}
		case Demo.CityExpert: {
			return {
				pin: {
					fade: false
				},
				states: {
					api: '/api/popup/states'
				}
			};
		}
		default: {
			return {
				pin: {
					fade: true
				},
				states: {
					api: '/api/popup/states'
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
		case Demo.Bookings:
			switch (size) {
				case 'large':
					return { width: 140, height: 104, padding: 8 };
				case 'small':
					return { width: 120, height: 90, padding: 6 };
			}
		case Demo.SrbijaNekretnine:
			return { width: 156, height: 128, padding: 8 };
		case Demo.CityExpert:
			return { width: 156, height: 128, padding: 8 };
	}
}

export function isDemoCustom(demo: Demo) {
	return demo == Demo.CityExpert || demo == Demo.SrbijaNekretnine;
}

export const rentalImages = [
	'https://images.unsplash.com/photo-1618221195710-dd6b41faaea6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1613545325278-f24b0cae1224?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1503174971373-b1f69850bded?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1502672023488-70e25813eb80?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1615529182904-14819c35db37?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1615873968403-89e068629265?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1618219740975-d40978bb7378?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1609347744425-175ecbd3cc0e?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1727706572437-4fcda0cbd66f?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1650137959510-d64eef290e86?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1600210491369-e753d80a41f3?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1637747018746-bece2b8a0309?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1567767292278-a4f21aa2d36e?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1505873242700-f289a29e1e0f?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1617104611622-d5f245d317f0?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1558882224-dda166733046?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1556228453-efd6c1ff04f6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1560185127-6ed189bf02f4?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1560185007-5f0bb1866cab?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1534595038511-9f219fe0c979?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1618221469555-7f3ad97540d6?q=80&w=200&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D',
	'https://images.unsplash.com/photo-1675279200694-8529c73b1fd0?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1613575831056-0acd5da8f085?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8M3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1484154218962-a197022b5858?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1665249934445-1de680641f50?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8Nnx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8NXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8N3x8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1667510436110-79d3dabc2008?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1612320648993-61c1cd604b71?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OHx8YXBhcnRtZW50JTIwaW50ZXJpb3J8ZW58MHwwfDB8fHwy',
	'https://images.unsplash.com/photo-1493809842364-78817add7ffb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTB8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1554995207-c18c203602cb?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTJ8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1585670149967-b4f4da88cc9f?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTF8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1502672260266-1c1ef2d93688?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTN8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1617201929478-8eedff7508f9?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTR8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1536376072261-38c75010e6c9?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTh8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D',
	'https://images.unsplash.com/photo-1650137938625-11576502aecd?w=200&auto=format&fit=crop&q=60&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MTl8fGFwYXJ0bWVudCUyMGludGVyaW9yfGVufDB8MHwwfHx8Mg%3D%3D'
];
