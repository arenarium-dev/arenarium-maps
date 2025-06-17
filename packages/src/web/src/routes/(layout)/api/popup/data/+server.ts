import { error, json } from '@sveltejs/kit';

import { Demo } from '$lib/shared/demo';

import { type MapPopupData } from '@arenarium/maps';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const demo = event.url.searchParams.get('demo');
	if (!demo) return new Response(null);

	const total = Number(event.url.searchParams.get('total'));
	const width = Number(event.url.searchParams.get('width'));
	const height = Number(event.url.searchParams.get('height'));
	const padding = Number(event.url.searchParams.get('padding'));

	const swlat = Number(event.url.searchParams.get('swlat'));
	const swlng = Number(event.url.searchParams.get('swlng'));
	const nelat = Number(event.url.searchParams.get('nelat'));
	const nelng = Number(event.url.searchParams.get('nelng'));

	if (isNaN(total) || isNaN(swlat) || isNaN(swlng) || isNaN(nelat) || isNaN(nelng)) {
		return error(400, 'Invalid parameters');
	}

	const data = new Array<MapPopupData & { details?: any }>();
	const dataAssetsFetch = (url: string) => {
		if (event.platform?.env?.ASSETS?.fetch) {
			return event.platform.env.ASSETS.fetch(event.url.origin + url);
		} else {
			return event.fetch(url);
		}
	};

	switch (demo) {
		default: {
			const coordinatesResponse = await dataAssetsFetch('/demo/coordinates.json');
			if (!coordinatesResponse?.ok) error(500, 'Failed to get coordinates');

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
					width: width,
					padding: padding
				});
			}

			break;
		}
		case Demo.SrbijaNekretnine: {
			const dataResponse = await dataAssetsFetch('/demo/srbija-nekretnine.json');
			if (!dataResponse?.ok) error(500, 'Failed to get data');

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
					width: width,
					padding: padding
				});
			}

			break;
		}
		case Demo.CityExpert: {
			const dataSearchParams = new URLSearchParams();
			dataSearchParams.set(
				'req',
				'{"ptId":[1,2,5,4],"cityId":1,"rentOrSale":"r","searchSource":"regular","sort":"pricedsc","furnished":[1],"isFeatured":true}'
			);

			const dataResponse = await fetch('https://cityexpert.rs/api/Search/Map?' + dataSearchParams.toString());
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any[]>();

			for (let i = 0; i < dataJson.length; i++) {
				const item = dataJson[i];

				data.push({
					id: item.propId.toString(),
					rank: dataJson.length - i,
					lat: item.mapLat,
					lng: item.mapLng,
					height: height,
					width: width,
					padding: padding,
					details: {
						type: item.ptId
					}
				});
			}

			break;
		}
		case Demo.Bookaweb: {
			const dataSearchParams = new URLSearchParams();
			dataSearchParams.set('city_id', '1');
			dataSearchParams.set('category_id', '1');
			dataSearchParams.set('sort_by', 'price');
			dataSearchParams.set('sort_dir', 'DESC');
			dataSearchParams.set('bounds', `${swlat},${swlng},${nelat},${nelng}`);

			const dataResponse = await fetch('https://bookaweb.com/sr/api/properties?' + dataSearchParams.toString());
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any>();
			const dataList = dataJson.properties.data;

			for (let i = 0; i < dataList.length; i++) {
				const item = dataList[i];

				data.push({
					id: item.id.toString(),
					rank: Number.parseInt(item.price_with_tax),
					lat: Number.parseFloat(item.latitude),
					lng: Number.parseFloat(item.longitude),
					height: height,
					width: width,
					padding: padding,
					details: {
						name: item.name,
						url: item.url,
						category: item.category_const,
						instant: item.instant,
						parking: item.parking,
						area: item.m2,
						guests: item.guests,
						bedrooms: item.bedrooms,
						bathrooms: item.bathrooms,
						price: Number.parseInt(item.price_with_tax),
						photos: item.photos.map((p: any) => p.responsive.at(-1) ?? p.original_url)
					}
				});
			}

			break;
		}
	}

	return json(data);
};
