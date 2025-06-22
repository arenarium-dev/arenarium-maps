import { error, json } from '@sveltejs/kit';

import { Demo } from '$lib/shared/demo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	const demo = event.url.searchParams.get('demo');
	const id = event.url.searchParams.get('id');

	if (!demo || !id) return new Response(null);

	const dataAssetsFetch = (url: string) => {
		if (event.platform?.env?.ASSETS?.fetch) {
			return event.platform.env.ASSETS.fetch(event.url.origin + url);
		} else {
			return event.fetch(url);
		}
	};

	switch (demo) {
		case Demo.SrbijaNekretnine: {
			const dataResponse = await dataAssetsFetch('/demo/srbija-nekretnine.json');
			if (!dataResponse?.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any>();
			const dataEntires = Object.entries(dataJson.propertiesByLatLon);
			const dataEntry = dataEntires[Number(id)][1] as any;
			const dataProperties = dataEntry.popupProperties[0];

			const data = {
				url: dataEntry.url,
				premium: dataEntry.premium,
				image: dataProperties.mainImageURL,
				price: `${dataProperties.price}${dataProperties.currencySymbol}`,
				priceTime: dataProperties.perMonth,
				title: dataProperties.basicTitleLabel,
				baths: dataProperties.noOfBathrooms,
				beds: dataProperties.rooms
			};

			return json(data);
		}
		case Demo.CityExpert: {
			const dataResponse = await event.fetch(`https://cityexpert.rs/api/propertyView/${id}/r`);
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any>();
			const data = {
				id: dataJson.propId,
				price: dataJson.price,
				type: dataJson.ptId,
				location: `${dataJson.street}, ${dataJson.municipality}`,
				size: dataJson.size,
				structure: dataJson.structure,
				images: dataJson.onsite?.imgFiles ?? []
			};
			return json(data);
		}
	}

	return new Response(null);
};
