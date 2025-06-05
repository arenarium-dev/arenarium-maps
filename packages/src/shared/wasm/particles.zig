const angles = @import("angles.zig");

const Point = struct {
    x: f32,
    y: f32,
};

const Particle = struct {
    center: Point,
    width: f32,
    height: f32,
    index: u16,
};

fn getIndex(index: u16, direction: i16) u16 {
    if (direction == 0) return index;
    return (((index + direction) % angles.ANGLE_LENGTH) + angles.ANGLE_LENGTH) % angles.ANGLE_LENGTH;
}
