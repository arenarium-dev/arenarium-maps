import { error, json } from '@sveltejs/kit';

import { Demo } from '$lib/shared/demo';

import type { RequestHandler } from './$types';

export const GET: RequestHandler = async (event) => {
	switch (event.params.demo) {
		case Demo.SrbijaNekretnine: {
			const dataResponse = await event.fetch('/demo/srbija-nekretnine.json');
			if (!dataResponse.ok) error(500, 'Failed to get data');

			const dataJson = await dataResponse.json<any>();
			const dataEntires = Object.entries(dataJson.propertiesByLatLon);
			const dataEntry = dataEntires[Number(event.params.id)][1] as any;
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
	}

	return new Response(null);
};
