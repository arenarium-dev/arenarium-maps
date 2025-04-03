import type { StyleSpecification } from 'maplibre-gl';

export const darkStyleSpecification: StyleSpecification = {
	version: 8,
	sources: {
		openmaptiles: {
			type: 'vector',
			url: 'https://tiles.openfreemap.org/planet'
		}
	},
	glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
	layers: [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': 'rgba(120, 120, 120, 1)' }
		},
		{
			id: 'park',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'park',
			filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
			paint: { 'fill-color': 'rgba(128, 128, 128, 1)' }
		},
		{
			id: 'water',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'water',
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['!=', ['get', 'brunnel'], 'tunnel']
			],
			paint: { 'fill-antialias': true, 'fill-color': 'rgba(56, 56, 56, 1)' }
		},
		{
			id: 'landcover_ice_shelf',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			maxzoom: 8,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'subclass'], 'ice_shelf']
			],
			paint: { 'fill-color': 'rgba(128, 128, 128, 1)', 'fill-opacity': 0.7 }
		},
		{
			id: 'landcover_glacier',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			maxzoom: 8,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'subclass'], 'glacier']
			],
			paint: {
				'fill-color': 'rgba(153, 153, 153, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 0.5]
			}
		},
		{
			id: 'landuse_residential',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			maxzoom: 16,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'residential']
			],
			paint: {
				'fill-color': 'rgba(104, 104, 104, 1)',
				'fill-opacity': ['interpolate', ['exponential', 0.6], ['zoom'], 8, 0.8, 9, 0.6]
			}
		},
		{
			id: 'landcover_wood',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			minzoom: 10,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'wood']
			],
			paint: {
				'fill-color': 'rgba(128, 128, 128, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 12, 1]
			}
		},
		{
			id: 'waterway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'waterway',
			filter: ['==', ['geometry-type'], 'LineString'],
			paint: { 'line-color': 'rgba(56, 56, 56, 1)' }
		},
		{
			id: 'building',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'building',
			minzoom: 12,
			paint: {
				'fill-antialias': true,
				'fill-color': 'rgba(136, 136, 136, 1)',
				'fill-outline-color': 'rgba(102, 102, 102, 1)'
			}
		},
		{
			id: 'tunnel_motorway_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'tunnel'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 3, 20, 40]
			}
		},
		{
			id: 'tunnel_motorway_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'tunnel'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(85, 85, 85, 1)',
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'aeroway-taxiway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 12,
			filter: ['match', ['get', 'class'], ['taxiway'], true, false],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(85, 85, 85, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.55], ['zoom'], 13, 1.8, 20, 20]
			}
		},
		{
			id: 'aeroway-runway-casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 11,
			filter: ['match', ['get', 'class'], ['runway'], true, false],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(85, 85, 85, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 6, 17, 55]
			}
		},
		{
			id: 'aeroway-area',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 4,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['match', ['get', 'class'], ['runway', 'taxiway'], true, false]
			],
			paint: {
				'fill-color': 'rgba(128, 128, 128, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1]
			}
		},
		{
			id: 'aeroway-runway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 11,
			filter: ['all', ['match', ['get', 'class'], ['runway'], true, false], ['==', ['geometry-type'], 'LineString']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 4, 17, 50]
			}
		},
		{
			id: 'road_area_pier',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'pier']
			],
			paint: { 'fill-antialias': true, 'fill-color': 'rgba(50, 50, 50, 1)' }
		},
		{
			id: 'road_pier',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['pier'], true, false]],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(52, 52, 52, 1)',
				'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 15, 1, 17, 4]
			}
		},
		{
			id: 'highway_path',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'path']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(88, 88, 88, 1)',
				'line-opacity': 0.9,
				'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 13, 1, 20, 10]
			}
		},
		{
			id: 'highway_minor',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 8,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-opacity': 0.9,
				'line-width': ['interpolate', ['exponential', 1.55], ['zoom'], 13, 1.8, 20, 20],
				'line-color': 'rgba(102, 102, 102, 1)'
			}
		},
		{
			id: 'highway_major_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-dasharray': [12, 0],
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 3, 20, 23],
				'line-color': 'rgba(85, 85, 85, 1)'
			}
		},
		{
			id: 'highway_major_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(102, 102, 102, 1)',
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2, 20, 20]
			}
		},
		{
			id: 'highway_major_subtle',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			maxzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: { 'line-width': 2, 'line-color': 'rgba(85, 85, 85, 1)' }
		},
		{
			id: 'highway_motorway_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-dasharray': [2, 0],
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 3, 20, 40]
			}
		},
		{
			id: 'highway_motorway_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'rgba(102, 102, 102, 1)', 6, 'rgba(85, 85, 85, 1)'],
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'highway_motorway_subtle',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			maxzoom: 6,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'motorway']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(102, 102, 102, 1)',
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3]
			}
		},
		{
			id: 'railway_transit',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'transit'], ['match', ['get', 'brunnel'], ['tunnel'], false, true]]
			],
			layout: { 'line-join': 'round' },
			paint: { 'line-color': 'rgba(85, 85, 85, 1)', 'line-width': 3 }
		},
		{
			id: 'railway_transit_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'transit'], ['match', ['get', 'brunnel'], ['tunnel'], false, true]]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-dasharray': [3, 3],
				'line-width': 2
			}
		},
		{
			id: 'railway_service',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'rail'], ['has', 'service']]
			],
			layout: { 'line-join': 'round' },
			paint: { 'line-color': 'rgba(102, 102, 102, 1)', 'line-width': 3 }
		},
		{
			id: 'railway_service_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'rail'], ['has', 'service']],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(85, 85, 85, 1)',
				'line-dasharray': [3, 3],
				'line-width': 2
			}
		},
		{
			id: 'railway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 13,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['!', ['has', 'service']], ['==', ['get', 'class'], 'rail']]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(85, 85, 85, 1)',
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 16, 3, 20, 7]
			}
		},
		{
			id: 'railway_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 13,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['!', ['has', 'service']], ['==', ['get', 'class'], 'rail']]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-dasharray': [3, 3],
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 16, 2, 20, 6]
			}
		},
		{
			id: 'highway_motorway_bridge_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'bridge'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-dasharray': [2, 0],
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 5, 20, 45]
			}
		},
		{
			id: 'highway_motorway_bridge_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'bridge'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'rgba(102, 102, 102, 1)', 6, 'rgba(85, 85, 85, 1)'],
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'boundary_3',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			minzoom: 8,
			filter: [
				'all',
				['>=', ['get', 'admin_level'], 3],
				['<=', ['get', 'admin_level'], 6],
				['!=', ['get', 'maritime'], 1],
				['!=', ['get', 'disputed'], 1],
				['!', ['has', 'claimed_by']]
			],
			paint: {
				'line-color': 'rgba(68, 68, 68, 1)',
				'line-dasharray': [1, 1],
				'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1, 11, 2]
			}
		},
		{
			id: 'boundary_2',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: [
				'all',
				['==', ['get', 'admin_level'], 2],
				['!=', ['get', 'maritime'], 1],
				['!=', ['get', 'disputed'], 1],
				['!', ['has', 'claimed_by']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(51, 51, 51, 1)',
				'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 4, 1],
				'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 5, 1.2, 12, 3]
			}
		},
		{
			id: 'boundary_disputed',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: ['all', ['!=', ['get', 'maritime'], 1], ['==', ['get', 'disputed'], 1]],
			paint: {
				'line-color': 'rgba(51, 51, 51, 1)',
				'line-dasharray': [1, 2],
				'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 5, 1.2, 12, 3]
			}
		},
		{
			id: 'waterway_line_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'waterway',
			minzoom: 10,
			filter: ['==', ['geometry-type'], 'LineString'],
			layout: {
				'symbol-placement': 'line',
				'symbol-spacing': 350,
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.2,
				'text-max-width': 5,
				'text-size': 14
			},
			paint: {
				'text-color': 'rgba(34, 34, 34, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'water_name_point_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'water_name',
			minzoom: 0,
			filter: ['==', ['geometry-type'], 'Point'],
			layout: { visibility: 'none' }
		},
		{
			id: 'water_name_line_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'water_name',
			filter: ['==', ['geometry-type'], 'LineString'],
			layout: { visibility: 'none' }
		},
		{
			id: 'highway-name-path',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 15.5,
			filter: ['==', ['get', 'class'], 'path'],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(158, 158, 158, 1)',
				'text-halo-color': 'rgba(244, 244, 244, 1)',
				'text-halo-width': 0.5
			}
		},
		{
			id: 'highway-name-minor',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 15,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]
			],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-width': 1,
				'text-halo-color': 'rgba(255, 255, 255, 1)'
			}
		},
		{
			id: 'highway-name-major',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 12.2,
			filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(34, 34, 34, 1)',
				'text-halo-width': 1,
				'text-halo-color': 'rgba(255, 255, 255, 1)'
			}
		},
		{
			id: 'highway-shield-non-us',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 11,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-highway', 'us-interstate', 'us-state'], false, true]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 11, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			},
			paint: {
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-color': 'rgba(255, 255, 255, 1)'
			}
		},
		{
			id: 'highway-shield-us-interstate',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 11,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-interstate'], true, false]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 7, 'line', 8, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			}
		},
		{
			id: 'road_shield_us',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 12,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-highway', 'us-state'], true, false]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 11, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			}
		},
		{
			id: 'airport',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'aerodrome_label',
			minzoom: 11,
			filter: ['all', ['has', 'iata']],
			layout: {
				'icon-size': 1,
				'text-anchor': 'top',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 9,
				'text-offset': [0, 0.6],
				'text-optional': true,
				'text-padding': 2,
				'text-size': 12
			},
			paint: {
				'text-color': 'rgba(51, 51, 51, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_other',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 8,
			filter: ['match', ['get', 'class'], ['city', 'continent', 'country', 'state', 'town', 'village'], false, true],
			layout: {
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.1,
				'text-max-width': 9,
				'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9, 12, 10],
				'text-transform': 'uppercase'
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_village',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 9,
			filter: ['==', ['get', 'class'], 'village'],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.2,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 10, 11, 12]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_town',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 6,
			filter: ['==', ['get', 'class'], 'town'],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.2,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 12, 11, 14]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_state',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 5,
			maxzoom: 8,
			filter: ['==', ['get', 'class'], 'state'],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.2,
				'text-max-width': 9,
				'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 14],
				'text-transform': 'uppercase'
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_city',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 3,
			filter: ['all', ['==', ['get', 'class'], 'city'], ['!=', ['get', 'capital'], 2]],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.4,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-offset': [0, -0.1],
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 4, 11, 7, 13, 11, 18]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_city_capital',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 3,
			filter: ['all', ['==', ['get', 'class'], 'city'], ['==', ['get', 'capital'], 2]],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.5,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 8,
				'text-offset': [0, -0.2],
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 4, 12, 7, 14, 11, 20]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_3',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 2,
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['>=', ['get', 'rank'], 3]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_2',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['==', ['get', 'rank'], 2]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 5, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_1',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['==', ['get', 'rank'], 1]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 1, 9, 4, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		}
	]
};

export const lightStyleSpecification: StyleSpecification = {
	version: 8,
	sources: {
		openmaptiles: {
			type: 'vector',
			url: 'https://tiles.openfreemap.org/planet'
		}
	},
	glyphs: 'https://tiles.openfreemap.org/fonts/{fontstack}/{range}.pbf',
	layers: [
		{
			id: 'background',
			type: 'background',
			paint: { 'background-color': 'rgba(220, 220, 220, 1)' }
		},
		{
			id: 'park',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'park',
			filter: ['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
			paint: { 'fill-color': 'rgba(228, 228, 228, 1)' }
		},
		{
			id: 'water',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'water',
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['!=', ['get', 'brunnel'], 'tunnel']
			],
			paint: { 'fill-antialias': true, 'fill-color': 'rgba(156, 156, 156, 1)' }
		},
		{
			id: 'landcover_ice_shelf',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			maxzoom: 8,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'subclass'], 'ice_shelf']
			],
			paint: { 'fill-color': 'rgba(228, 228, 228, 1)', 'fill-opacity': 0.7 }
		},
		{
			id: 'landcover_glacier',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			maxzoom: 8,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'subclass'], 'glacier']
			],
			paint: {
				'fill-color': 'rgba(253, 253, 253, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 0, 1, 8, 0.5]
			}
		},
		{
			id: 'landuse_residential',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landuse',
			maxzoom: 16,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'residential']
			],
			paint: {
				'fill-color': 'rgba(204, 204, 204, 1)',
				'fill-opacity': ['interpolate', ['exponential', 0.6], ['zoom'], 8, 0.8, 9, 0.6]
			}
		},
		{
			id: 'landcover_wood',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'landcover',
			minzoom: 10,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'wood']
			],
			paint: {
				'fill-color': 'rgba(228, 228, 228, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 8, 0, 12, 1]
			}
		},
		{
			id: 'waterway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'waterway',
			filter: ['==', ['geometry-type'], 'LineString'],
			paint: { 'line-color': 'rgba(156, 156, 156, 1)' }
		},
		{
			id: 'building',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'building',
			minzoom: 12,
			paint: {
				'fill-antialias': true,
				'fill-color': 'rgba(236, 236, 236, 1)',
				'fill-outline-color': 'rgba(202, 202, 202, 1)'
			}
		},
		{
			id: 'tunnel_motorway_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'tunnel'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgb(168, 168, 168)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 3, 20, 40]
			}
		},
		{
			id: 'tunnel_motorway_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'tunnel'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgb(185, 185, 185)',
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'aeroway-taxiway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 12,
			filter: ['match', ['get', 'class'], ['taxiway'], true, false],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(185, 185, 185, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.55], ['zoom'], 13, 1.8, 20, 20]
			}
		},
		{
			id: 'aeroway-runway-casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 11,
			filter: ['match', ['get', 'class'], ['runway'], true, false],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(185, 185, 185, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 6, 17, 55]
			}
		},
		{
			id: 'aeroway-area',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 4,
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['match', ['get', 'class'], ['runway', 'taxiway'], true, false]
			],
			paint: {
				'fill-color': 'rgba(228, 228, 228, 1)',
				'fill-opacity': ['interpolate', ['linear'], ['zoom'], 13, 0, 14, 1]
			}
		},
		{
			id: 'aeroway-runway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'aeroway',
			minzoom: 11,
			filter: ['all', ['match', ['get', 'class'], ['runway'], true, false], ['==', ['geometry-type'], 'LineString']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(168, 168, 168, 1)',
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.5], ['zoom'], 11, 4, 17, 50]
			}
		},
		{
			id: 'road_area_pier',
			type: 'fill',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: [
				'all',
				['in', ['geometry-type'], ['literal', ['Polygon', 'MultiPolygon']]],
				['==', ['get', 'class'], 'pier']
			],
			paint: { 'fill-antialias': true, 'fill-color': 'rgba(150, 150, 150, 1)' }
		},
		{
			id: 'road_pier',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['match', ['get', 'class'], ['pier'], true, false]],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(152, 152, 152, 1)',
				'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 15, 1, 17, 4]
			}
		},
		{
			id: 'highway_path',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'path']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgb(188, 188, 188)',
				'line-opacity': 0.9,
				'line-width': ['interpolate', ['exponential', 1.2], ['zoom'], 13, 1, 20, 10]
			}
		},
		{
			id: 'highway_minor',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 8,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(202, 202, 202, 1)',
				'line-opacity': 0.9,
				'line-width': ['interpolate', ['exponential', 1.55], ['zoom'], 13, 1.8, 20, 20]
			}
		},
		{
			id: 'highway_major_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgb(185, 185, 185)',
				'line-dasharray': [12, 0],
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 3, 20, 23]
			}
		},
		{
			id: 'highway_major_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(202, 202, 202, 1)',
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 10, 2, 20, 20]
			}
		},
		{
			id: 'highway_major_subtle',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			maxzoom: 11,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: { 'line-color': 'rgba(185, 185, 185, 1)', 'line-width': 2 }
		},
		{
			id: 'highway_motorway_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgb(168, 168, 168)',
				'line-dasharray': [2, 0],
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 3, 20, 40]
			}
		},
		{
			id: 'highway_motorway_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['match', ['get', 'brunnel'], ['bridge', 'tunnel'], false, true], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'rgba(202, 202, 202, 1)', 6, 'rgba(185, 185, 185, 1)'],
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'highway_motorway_subtle',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			maxzoom: 6,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'motorway']],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(202, 202, 202, 1)',
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3]
			}
		},
		{
			id: 'railway_transit',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'transit'], ['match', ['get', 'brunnel'], ['tunnel'], false, true]]
			],
			layout: { 'line-join': 'round' },
			paint: { 'line-color': 'rgba(185, 185, 185, 1)', 'line-width': 3 }
		},
		{
			id: 'railway_transit_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'transit'], ['match', ['get', 'brunnel'], ['tunnel'], false, true]]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(168, 168, 168, 1)',
				'line-dasharray': [3, 3],
				'line-width': 2
			}
		},
		{
			id: 'railway_service',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'class'], 'rail'], ['has', 'service']]
			],
			layout: { 'line-join': 'round' },
			paint: { 'line-color': 'rgba(202, 202, 202, 1)', 'line-width': 3 }
		},
		{
			id: 'railway_service_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 16,
			filter: ['all', ['==', ['geometry-type'], 'LineString'], ['==', ['get', 'class'], 'rail'], ['has', 'service']],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(185, 185, 185, 1)',
				'line-dasharray': [3, 3],
				'line-width': 2
			}
		},
		{
			id: 'railway',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 13,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['!', ['has', 'service']], ['==', ['get', 'class'], 'rail']]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(185, 185, 185, 1)',
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 16, 3, 20, 7]
			}
		},
		{
			id: 'railway_dashline',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 13,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['!', ['has', 'service']], ['==', ['get', 'class'], 'rail']]
			],
			layout: { 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(168, 168, 168, 1)',
				'line-dasharray': [3, 3],
				'line-width': ['interpolate', ['exponential', 1.3], ['zoom'], 16, 2, 20, 6]
			}
		},
		{
			id: 'highway_motorway_bridge_casing',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'bridge'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'butt', 'line-join': 'miter' },
			paint: {
				'line-color': 'rgb(168, 168, 168)',
				'line-dasharray': [2, 0],
				'line-opacity': 1,
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 5.8, 0, 6, 5, 20, 45]
			}
		},
		{
			id: 'highway_motorway_bridge_inner',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'transportation',
			minzoom: 6,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['all', ['==', ['get', 'brunnel'], 'bridge'], ['==', ['get', 'class'], 'motorway']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': ['interpolate', ['linear'], ['zoom'], 5.8, 'rgba(202, 202, 202, 1)', 6, 'rgba(185, 185, 185, 1)'],
				'line-width': ['interpolate', ['exponential', 1.4], ['zoom'], 4, 2, 6, 1.3, 20, 30]
			}
		},
		{
			id: 'boundary_3',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			minzoom: 8,
			filter: [
				'all',
				['>=', ['get', 'admin_level'], 3],
				['<=', ['get', 'admin_level'], 6],
				['!=', ['get', 'maritime'], 1],
				['!=', ['get', 'disputed'], 1],
				['!', ['has', 'claimed_by']]
			],
			paint: {
				'line-color': 'rgba(168, 168, 168, 1)',
				'line-dasharray': [1, 1],
				'line-width': ['interpolate', ['linear'], ['zoom'], 7, 1, 11, 2]
			}
		},
		{
			id: 'boundary_2',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: [
				'all',
				['==', ['get', 'admin_level'], 2],
				['!=', ['get', 'maritime'], 1],
				['!=', ['get', 'disputed'], 1],
				['!', ['has', 'claimed_by']]
			],
			layout: { 'line-cap': 'round', 'line-join': 'round' },
			paint: {
				'line-color': 'rgba(151, 151, 151, 1)',
				'line-opacity': ['interpolate', ['linear'], ['zoom'], 0, 0.4, 4, 1],
				'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 5, 1.2, 12, 3]
			}
		},
		{
			id: 'boundary_disputed',
			type: 'line',
			source: 'openmaptiles',
			'source-layer': 'boundary',
			filter: ['all', ['!=', ['get', 'maritime'], 1], ['==', ['get', 'disputed'], 1]],
			paint: {
				'line-color': 'rgba(151, 151, 151, 1)',
				'line-dasharray': [1, 2],
				'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 5, 1.2, 12, 3]
			}
		},
		{
			id: 'waterway_line_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'waterway',
			minzoom: 10,
			filter: ['==', ['geometry-type'], 'LineString'],
			layout: {
				'symbol-placement': 'line',
				'symbol-spacing': 350,
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.2,
				'text-max-width': 5,
				'text-size': 14
			},
			paint: {
				'text-color': 'rgba(34, 34, 34, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1.5
			}
		},
		{
			id: 'water_name_point_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'water_name',
			minzoom: 0,
			filter: ['==', ['geometry-type'], 'Point'],
			layout: { visibility: 'none' }
		},
		{
			id: 'water_name_line_label',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'water_name',
			filter: ['==', ['geometry-type'], 'LineString'],
			layout: { visibility: 'none' }
		},
		{
			id: 'highway-name-path',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 15.5,
			filter: ['==', ['get', 'class'], 'path'],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(158, 158, 158, 1)',
				'text-halo-color': 'rgba(244, 244, 244, 1)',
				'text-halo-width': 0.5
			}
		},
		{
			id: 'highway-name-minor',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 15,
			filter: [
				'all',
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'class'], ['minor', 'service', 'track'], true, false]
			],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-width': 1,
				'text-halo-color': 'rgba(255, 255, 255, 1)'
			}
		},
		{
			id: 'highway-name-major',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 12.2,
			filter: ['match', ['get', 'class'], ['primary', 'secondary', 'tertiary', 'trunk'], true, false],
			layout: {
				'symbol-placement': 'line',
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'map',
				'text-size': ['interpolate', ['linear'], ['zoom'], 13, 12, 14, 13]
			},
			paint: {
				'text-color': 'rgba(34, 34, 34, 1)',
				'text-halo-width': 1,
				'text-halo-color': 'rgba(255, 255, 255, 1)'
			}
		},
		{
			id: 'highway-shield-non-us',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 11,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-highway', 'us-interstate', 'us-state'], false, true]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 11, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			},
			paint: {
				'text-halo-color': 'rgba(0, 0, 0, 1)',
				'text-color': 'rgba(0, 0, 0, 1)'
			}
		},
		{
			id: 'highway-shield-us-interstate',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 11,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-interstate'], true, false]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 7, 'line', 8, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			}
		},
		{
			id: 'road_shield_us',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'transportation_name',
			minzoom: 12,
			filter: [
				'all',
				['<=', ['get', 'ref_length'], 6],
				['==', ['geometry-type'], 'LineString'],
				['match', ['get', 'network'], ['us-highway', 'us-state'], true, false]
			],
			layout: {
				'icon-rotation-alignment': 'viewport',
				'icon-size': 1,
				'symbol-placement': ['step', ['zoom'], 'point', 11, 'line'],
				'symbol-spacing': 200,
				'text-field': ['to-string', ['get', 'ref']],
				'text-font': ['Noto Sans Regular'],
				'text-rotation-alignment': 'viewport',
				'text-size': 10
			}
		},
		{
			id: 'airport',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'aerodrome_label',
			minzoom: 11,
			filter: ['all', ['has', 'iata']],
			layout: {
				'icon-size': 1,
				'text-anchor': 'top',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 9,
				'text-offset': [0, 0.6],
				'text-optional': true,
				'text-padding': 2,
				'text-size': 12
			},
			paint: {
				'text-color': 'rgba(51, 51, 51, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_other',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 8,
			filter: ['match', ['get', 'class'], ['city', 'continent', 'country', 'state', 'town', 'village'], false, true],
			layout: {
				'text-field': ['get', 'name:latin'],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.1,
				'text-max-width': 9,
				'text-size': ['interpolate', ['linear'], ['zoom'], 8, 9, 12, 10],
				'text-transform': 'uppercase'
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_village',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 9,
			filter: ['==', ['get', 'class'], 'village'],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.2,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 10, 11, 12]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_town',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 6,
			filter: ['==', ['get', 'class'], 'town'],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.2,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 7, 12, 11, 14]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_state',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 5,
			maxzoom: 8,
			filter: ['==', ['get', 'class'], 'state'],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-letter-spacing': 0.2,
				'text-max-width': 9,
				'text-size': ['interpolate', ['linear'], ['zoom'], 5, 10, 8, 14],
				'text-transform': 'uppercase'
			},
			paint: {
				'text-color': 'rgba(17, 17, 17, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_city',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 3,
			filter: ['all', ['==', ['get', 'class'], 'city'], ['!=', ['get', 'capital'], 2]],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.4,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Regular'],
				'text-max-width': 8,
				'text-offset': [0, -0.1],
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 4, 11, 7, 13, 11, 18]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_city_capital',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 3,
			filter: ['all', ['==', ['get', 'class'], 'city'], ['==', ['get', 'capital'], 2]],
			layout: {
				'icon-allow-overlap': true,
				'icon-optional': false,
				'icon-size': 0.5,
				'text-anchor': 'bottom',
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 8,
				'text-offset': [0, -0.2],
				'text-size': ['interpolate', ['exponential', 1.2], ['zoom'], 4, 12, 7, 14, 11, 20]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_3',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			minzoom: 2,
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['>=', ['get', 'rank'], 3]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 3, 9, 7, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_2',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['==', ['get', 'rank'], 2]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 2, 9, 5, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		},
		{
			id: 'label_country_1',
			type: 'symbol',
			source: 'openmaptiles',
			'source-layer': 'place',
			maxzoom: 9,
			filter: ['all', ['==', ['get', 'class'], 'country'], ['==', ['get', 'rank'], 1]],
			layout: {
				'text-field': ['coalesce', ['get', 'name_en'], ['get', 'name:latin']],
				'text-font': ['Noto Sans Bold'],
				'text-max-width': 6.25,
				'text-size': ['interpolate', ['linear'], ['zoom'], 1, 9, 4, 17]
			},
			paint: {
				'text-color': 'rgba(0, 0, 0, 1)',
				'text-halo-color': 'rgba(255, 255, 255, 1)',
				'text-halo-width': 1
			}
		}
	]
};
