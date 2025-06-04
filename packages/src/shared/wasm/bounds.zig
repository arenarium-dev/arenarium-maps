pub const Bounds = struct {
    // Anchor
    x: f32,
    y: f32,
    // Distances from anchor
    left: f32,
    right: f32,
    top: f32,
    bottom: f32,
};

pub fn areOverlaping(bounds1: Bounds, bounds2: Bounds) bool {
    if (bounds1.x - bounds1.left > bounds2.x + bounds2.right) return false;
    if (bounds1.x + bounds1.right < bounds2.x - bounds2.left) return false;
    if (bounds1.y - bounds1.top > bounds2.y + bounds2.bottom) return false;
    if (bounds1.y + bounds1.bottom < bounds2.y - bounds2.top) return false;
    return true;
}

pub fn getZoomWhenTouching(bounds1: Bounds, bounds2: Bounds) f32 {
    const xDistance0 = @fabs(bounds1.x - bounds2.x);
    const xDistanceZ = if (bounds1.x < bounds2.x) bounds1.right + bounds2.left else bounds1.left + bounds2.right;
    const xRatio = xDistanceZ / xDistance0;

    const yDistance0 = @fabs(bounds1.y - bounds2.y);
    const yDistanceZ = if (bounds1.y < bounds2.y) bounds1.bottom + bounds2.top else bounds1.top + bounds2.bottom;
    const yRatio = yDistanceZ / yDistance0;

    const minRatio = @min(xRatio, yRatio);
    const zoom = @log2(minRatio);
    return zoom;
}
