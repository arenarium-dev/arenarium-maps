const std = @import("std");

const bounds = @import("bounds.zig");

pub fn main() void {
    std.debug.print("Hello, {s}!\n", .{"World"});

    var bounds1 = bounds.Bounds{
        .x = 0,
        .y = 0,
        .left = 0,
        .right = 100,
        .top = 0,
        .bottom = 100,
    };

    var bounds2 = bounds.Bounds{
        .x = 100,
        .y = 0,
        .left = 0,
        .right = 100,
        .top = 0,
        .bottom = 100,
    };

    std.debug.print("bounds1: {any}\n", .{bounds1});
    std.debug.print("bounds2: {any}\n", .{bounds2});

    std.debug.print("getZoomWhenTouching: {any}\n", .{bounds.getZoomWhenTouching(bounds1, bounds2)});
    std.debug.print("areOverlaping: {any}\n", .{bounds.areOverlaping(bounds1, bounds2)});
}
