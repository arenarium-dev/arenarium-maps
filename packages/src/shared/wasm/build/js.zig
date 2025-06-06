const std = @import("std");
const fs = std.fs;
const mem = std.mem;
const testing = std.testing;
const Allocator = mem.Allocator;

pub fn main() !void {
    var gpa = std.heap.GeneralPurposeAllocator(.{}){};
    defer _ = gpa.deinit();
    const allocator = gpa.allocator();

    // --- Configuration ---
    const wsFilePath = "./wasm/output/states.wasm";
    const jsFilePath = "./wasm/compute/states.js";
    // ---------------------

    // 1. Read the Wasm file
    const wasmFile = try fs.cwd().openFile(wsFilePath, .{ .mode = .read_only });
    defer wasmFile.close();

    var wasmFileSize = try wasmFile.getEndPos();
    var wasmBuffer = try allocator.alloc(u8, wasmFileSize);
    defer allocator.free(wasmBuffer);

    _ = try wasmFile.readAll(wasmBuffer);
    std.debug.print("Read {d} bytes from Wasm file.\n", .{wasmBuffer.len});

    // 2. Encode Wasm buffer to Base64
    const base64Encoder = std.base64.standard.Encoder;
    var base64Len = base64Encoder.calcSize(wasmBuffer.len);
    var base64Buffer = try allocator.alloc(u8, base64Len);
    defer allocator.free(base64Buffer);

    _ = base64Encoder.encode(base64Buffer, wasmBuffer);
    std.debug.print("Base64 encoded length: {d}\n", .{base64Buffer.len});

    // 3. Create the JS file content
    const jsContentPrefix = "export const wasm = \"";
    const jsContentSuffix = "\";\n";
    const jsContentLen = jsContentPrefix.len + base64Buffer.len + jsContentSuffix.len;
    const jsContent = try allocator.alloc(u8, jsContentLen);
    defer allocator.free(jsContent);

    var offset: usize = 0;
    @memcpy(jsContent[offset..][0..jsContentPrefix.len], jsContentPrefix);
    offset += jsContentPrefix.len;
    @memcpy(jsContent[offset..][0..base64Buffer.len], base64Buffer);
    offset += base64Buffer.len;
    @memcpy(jsContent[offset..][0..jsContentSuffix.len], jsContentSuffix);

    // 4. Write to the JS file
    const jsFile = try fs.cwd().createFile(jsFilePath, .{ .read = true }); // .read = true is a common default, not strictly needed for write-only here
    defer jsFile.close();

    try jsFile.writeAll(jsContent);
    std.debug.print("Successfully wrote JS file to: {s}\n", .{jsFilePath});
}
