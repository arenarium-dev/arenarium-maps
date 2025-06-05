const std = @import("std");

export const ANGLE_LENGTH = 12;
export const DEGREES = [_]u16{ 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330 };
export const RADIANS_SIN = getSins();
export const RADIANS_COS = getCoss();

fn getSins() []f32 {
    var allocator = std.heap.page_allocator;
    var sins = try allocator.alloc(f32, DEGREES.len);

    for (DEGREES, 0..) |degree, i| {
        sins[i] = std.math.sin(degree * std.math.pi / 180);
    }

    return sins;
}

fn getCoss() []f32 {
    var allocator = std.heap.page_allocator;
    var coss = try allocator.alloc(f32, DEGREES.len);

    for (DEGREES, 0..) |degree, i| {
        coss[i] = std.math.cos(degree * std.math.pi / 180);
    }

    return coss;
}

fn getQuadrantIndex(forceX: f32, forceY: f32) u16 {
    const ratio = std.math.fabs(forceY / forceX);

    // Rounding to 30 degrees, so binary search is possible
    // tan(45) = 1
    if (ratio < 1) {
        // tan(15) = 0.26795
        if (ratio < 0.26795) {
            return 0; // 0 deg;
        } else {
            return 1; // 30 deg;
        }
    } else {
        // tan(75) = 3.73205
        if (ratio < 3.73205) {
            return 2; // 60 deg;
        } else {
            return 3; // 90 deg;
        }
    }
}

export fn getAngleIndex(forceX: f32, forceY: f32) u16 {
    const index = getQuadrantIndex(forceX, forceY);

    if (forceX > 0) {
        if (forceY > 0) {
            return (12 - index) % 12;
        } else {
            return 0 + index;
        }
    } else {
        if (forceY > 0) {
            return 6 + index;
        } else {
            return 6 - index;
        }
    }
}
