export const MAP_BASE_SIZE = 512;
export const MAP_MIN_ZOOM = 0;
export const MAP_MAX_ZOOM = 18;
export const MAP_ZOOM_SCALE = 10;
export const MAP_MARKERS_ZOOM_DEPTH = 0.5;
export const MAP_MARKERS_Z_INDEX_OFFSET = 1000000;
export const MAP_CIRCLES_ZOOM_DEPTH_BASE = 6;
export const MAP_CIRCLES_ZOOM_DEPTH_COUNT = 128;

export const ANIMATION_LIMIT_DEFAULT = 128;
export const ANIMATION_PRIORITY_LAYER = 1000;

export const MARKER_DEFAULT_ANGLE = 270;
export const MARKER_PADDING = 8;
export const MARKER_DIMENSION_MAX_RATIO = 1 / 3;

export const FEEDBACK_EMAIL = 'arenarium.dev@gmail.com';

export namespace Angles {
	export const COUNT = 12;
	export const DEFAULT = MARKER_DEFAULT_ANGLE;
	export const DEGREES = [0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330];
}
