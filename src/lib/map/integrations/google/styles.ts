export const GoogleMapLightStyle = [
	{
		elementType: 'labels.icon',
		stylers: [
			{
				visibility: 'off'
			}
		]
	},
	{
		stylers: [
			{
				saturation: -100
			},
			{
				lightness: -10
			}
		]
	},
	{
		featureType: 'landscape',
		stylers: [
			{
				lightness: 30
			}
		]
	},
	{
		featureType: 'road',
		elementType: 'geometry',
		stylers: [
			{
				saturation: -100
			}
		]
	}
];

export const GoogleMapDarkStyle = [
	{
		elementType: 'labels.icon',
		stylers: [
			{
				visibility: 'off'
			}
		]
	},
	{
		stylers: [
			{
				saturation: -100
			}
		]
	},
	{
		elementType: 'geometry',
		stylers: [
			{
				lightness: -45
			}
		]
	},
	{
		elementType: 'labels.text.fill',
		stylers: [
			{
				lightness: -100
			}
		]
	},
	{
		elementType: 'labels.text.stroke',
		stylers: [
			{
				lightness: -15
			}
		]
	},
	{
		featureType: 'water',
		elementType: 'geometry',
		stylers: [
			{
				lightness: -50
			}
		]
	}
];
