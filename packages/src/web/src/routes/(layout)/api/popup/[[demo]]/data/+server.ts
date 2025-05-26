import { error, json } from '@sveltejs/kit';

import { type MapPopupData } from '@arenarium/maps';

import type { RequestHandler } from '../$types';
import { Demo } from '$lib/shared/demo';

export const GET: RequestHandler = async (event) => {
	const total = Number(event.url.searchParams.get('total'));
	const width = Number(event.url.searchParams.get('width'));
	const height = Number(event.url.searchParams.get('height'));
	const swlat = Number(event.url.searchParams.get('swlat'));
	const swlng = Number(event.url.searchParams.get('swlng'));
	const nelat = Number(event.url.searchParams.get('nelat'));
	const nelng = Number(event.url.searchParams.get('nelng'));

	if (isNaN(total) || isNaN(swlat) || isNaN(swlng) || isNaN(nelat) || isNaN(nelng)) {
		return error(400, 'Invalid parameters');
	}

	const data = new Array<MapPopupData>();

	switch (event.params.demo) {
		default: {
			const coordinatesResponse = await event.fetch('/demo/basic.json');
			if (!coordinatesResponse.ok) error(500, 'Failed to get coordinates');

			const coordinatesJson = await coordinatesResponse.json<any>();
			const coordinates = coordinatesJson.coordinates;

			let count = 0;
			for (let i = 0; i < coordinates.length; i++) {
				const lat = coordinates[i % coordinates.length].lat;
				const lng = coordinates[i % coordinates.length].lng;
				if (lat < swlat || nelat < lat || lng < swlng || nelng < lng) continue;

				count++;
				if (count > total) break;

				data.push({
					id: i.toString(),
					rank: i,
					lat: lat,
					lng: lng,
					height: height,
					width: width
				});
			}

			break;
		}
		case Demo.SrbijaNekretnine: {
			const dataResponse = await event.fetch('/demo/srbija-nekretnine.json');
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any>();
			const dataEntires = Object.entries(dataJson.propertiesByLatLon);

			let count = 0;
			for (let i = 0; i < dataEntires.length; i++) {
				const object = dataEntires[i][1] as any;
				const lat = object.latitude;
				const lng = object.longitude;

				count++;
				if (count > total) break;

				data.push({
					id: i.toString(),
					rank: object.price ? Number.parseInt(object.price) : 0,
					lat: lat,
					lng: lng,
					height: height,
					width: width
				});
			}

			break;
		}
		case Demo.CityExpert: {
			const dataSearchParams = new URLSearchParams();
			dataSearchParams.set('req', '{"ptId":[1,2,5],"cityId":1,"rentOrSale":"r","searchSource":"regular","sort":"pricedsc","furnished":[1]}');

			const dataResponse = await event.fetch('https://cityexpert.rs/api/Search/Map?' + dataSearchParams.toString());
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any[]>();

			for (let i = 0; i < dataJson.length; i++) {
				const item = dataJson[i];

				const any: any = {
					id: item.propId.toString(),
					rank: dataJson.length - i,
					lat: item.mapLat,
					lng: item.mapLng,
					type: item.ptId,
					height: height,
					width: width
				};
				data.push(any as MapPopupData);
			}

			break;
		}
	}

	return json(data);
};
