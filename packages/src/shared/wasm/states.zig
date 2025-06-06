const std = @import("std");

// Use the WASM-specific general purpose allocator. This allocator
// manages memory on the WebAssembly linear memory.
const allocator = std.heap.wasm_allocator;

const PI: f32 = std.math.pi;
const MAP_BASE_SIZE: u32 = 512;
const MAP_POPUP_BOUNDS_PADDING: u32 = 16;

const Point = struct {
    x: f32,
    y: f32,
};

pub const Projection = struct {
    pub fn getPoint(lat: f32, lng: f32) Point {
        var siny = std.math.sin((lat * PI) / 180);

        // Truncating to 0.9999 effectively limits latitude to 89.189. This is
        // about a third of a tile past the edge of the world tile.
        siny = @min(@max(siny, -0.9999), 0.9999);

        return Point{
            .x = MAP_BASE_SIZE * (0.5 + lng / 360),
            .y = MAP_BASE_SIZE * (0.5 - std.math.log(f32, 2, (1 + siny) / (1 - siny)) / (4 * std.math.pi)),
        };
    }
};

pub const Rectangle = struct {
    pub fn getOffsets(width: f32, height: f32, angleDeg: f32) Point {
        const angleRad: f32 = angleDeg * (PI / 180);

        const widthHalf: f32 = width / 2;
        const heightHalf: f32 = height / 2;
        const diagonalHalf: f32 = std.math.sqrt(widthHalf * widthHalf + heightHalf * heightHalf);
        const aspectDeg: f32 = std.math.atan(heightHalf / widthHalf) * (180 / PI);

        const brDeg: f32 = aspectDeg;
        const blDeg: f32 = 180 - aspectDeg;
        const trDeg: f32 = 180 + aspectDeg;
        const tlDeg: f32 = 360 - aspectDeg;

        // Quadrant bottom
        if (brDeg <= angleDeg and angleDeg <= blDeg) {
            return Point{
                .x = diagonalHalf * std.math.cos(angleRad) - widthHalf,
                .y = 0,
            };
        }
        // Quadrant left
        else if (blDeg <= angleDeg and angleDeg <= trDeg) {
            return Point{
                .x = -width,
                .y = diagonalHalf * std.math.sin(angleRad) - heightHalf,
            };
        }
        // Quadrant top
        else if (trDeg <= angleDeg and angleDeg <= tlDeg) {
            return Point{
                .x = diagonalHalf * std.math.cos(angleRad) - widthHalf,
                .y = -height,
            };
        }
        // Quadrant right
        else {
            return Point{
                .x = 0,
                .y = diagonalHalf * std.math.sin(angleRad) - heightHalf,
            };
        }
    }
};

pub const Bounds = struct {
    // Anchor
    x: f32,
    y: f32,
    // Distances from anchor
    left: f32,
    right: f32,
    top: f32,
    bottom: f32,

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
};

pub const Angles = struct {
    pub const LENGTH: u16 = 12;
    pub const DEFAULT: f32 = 270;
    pub const DEGREES = [_]f32{ 0, 30, 60, 90, 120, 150, 180, 210, 240, 270, 300, 330 };

    pub const RADIANS_COS = blk: {
        var cos_vals: [LENGTH]f32 = undefined;
        for (DEGREES, 0..) |degree, i| {
            cos_vals[i] = std.math.sin(degree * std.math.pi / 180);
        }
        break :blk cos_vals;
    };

    pub const RADIANS_SIN = blk: {
        var sin_vals: [LENGTH]f32 = undefined;
        for (DEGREES, 0..) |degree, i| {
            sin_vals[i] = std.math.cos(degree * std.math.pi / 180);
        }
        break :blk sin_vals;
    };

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

    pub fn getAngleIndex(forceX: f32, forceY: f32) u16 {
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
};

pub const Simulation = struct {
    pub const Particle = struct {
        center: Point,
        width: f32,
        height: f32,
        index: u16,
    };

    pub const ParticleForces = struct {
        particle: *Particle,
        forces: []const Particle,
    };

    pub fn getIndex(index: u16, direction: i16) u16 {
        if (direction == 0) return index;
        return (((index + direction) % Angles.LENGTH) + Angles.LENGTH) % Angles.LENGTH;
    }

    pub fn initializePointIndexes(data: []const ParticleForces) void {
        for (data) |item| {
            const particle = item.particle;
            const center = particle.center;

            var forceX: f32 = 0;
            var forceY: f32 = 0;

            for (item.forces) |fParticle| {
                const fCenter = fParticle.center;
                const dx = center.x - fCenter.x;
                const dy = center.y - fCenter.y;
                if (dx == 0 and dy == 0) continue;

                const distance_sq = (dx * dx) + (dy * dy);
                const distance = std.math.sqrt(distance_sq);
                const force = 1 / distance_sq; // Using distance_sq for 1/r^2 force

                // X axis is regular
                forceX += (force * dx) / distance;
                // Y axis is inverted
                forceY += -(force * dy) / distance;
            }

            particle.index = Angles.getAngleIndex(forceX, forceY);
        }
    }

    pub fn updatePointIndexes(data: []const ParticleForces) bool {
        var stable = true;

        for (data) |item| {
            const particle = item.particle;
            const index = particle.index;
            const center = particle.center;
            const width = particle.width;
            const height = particle.height;

            const prevIndex = getIndex(index, -1);
            const nextIndex = getIndex(index, 1);

            const prevPointX = center.x + width * Angles.RADIANS_COS[prevIndex];
            const prevPointY = center.y + height * Angles.RADIANS_SIN[prevIndex];
            const currPointX = center.x + width * Angles.RADIANS_COS[index];
            const currPointY = center.y + height * Angles.RADIANS_SIN[index];
            const nextPointX = center.x + width * Angles.RADIANS_COS[nextIndex];
            const nextPointY = center.y + height * Angles.RADIANS_SIN[nextIndex];

            var prevPointForce: f32 = 0;
            var currPointForce: f32 = 0;
            var nextPointForce: f32 = 0;

            for (item.forces) |fParticle| {
                const fIndex = fParticle.index;
                const fCenter = fParticle.center;
                const fWidth = fParticle.width;
                const fHeight = fParticle.height;

                const fPointX = fCenter.x + fWidth * Angles.RADIANS_COS[fIndex];
                const fPointY = fCenter.y + fHeight * Angles.RADIANS_SIN[fIndex];

                // Add a small epsilon to prevent division by zero if points overlap.
                const epsilon: f32 = 1e-6;

                const prevDx = prevPointX - fPointX;
                const prevDy = prevPointY - fPointY;
                prevPointForce += 1 / ((prevDx * prevDx + prevDy * prevDy) + epsilon);

                const currDx = currPointX - fPointX;
                const currDy = currPointY - fPointY;
                currPointForce += 1 / ((currDx * currDx + currDy * currDy) + epsilon);

                const nextDx = nextPointX - fPointX;
                const nextDy = nextPointY - fPointY;
                nextPointForce += 1 / ((nextDx * nextDx + nextDy * nextDy) + epsilon);
            }

            var direction: i8 = 0;
            if (prevPointForce < currPointForce and prevPointForce < nextPointForce) direction = -1;
            if (nextPointForce < currPointForce and nextPointForce < prevPointForce) direction = 1;

            particle.index = getIndex(index, direction);

            if (direction != 0) stable = false;
        }

        return stable;
    }
};

pub const Nodes = struct {
    pub const Popup = struct {
        pub const Data = struct {
            index: u32,
            rank: u32,
            lat: f32,
            lng: f32,
            width: f32,
            height: f32,
        };
    };

    pub const Marker = struct {
        zoomAfterExpanded: f32,
        zoomAfterAngleIndexes: std.ArrayList([2]f32),
    };

    pub const Node = struct {
        // PROPERTIES
        /// The index of the node in the nodes array.
        index: u32,
        /// The rank of the marker node.
        rank: u32,
        /// The x coordinate of the marker node.
        x: f32,
        /// The y coordinate of the marker node.
        y: f32,
        /// The width of the marker node.
        width: f32,
        /// The height of the marker node.
        height: f32,

        // STATE
        /// State of the marker expanded or not.
        expanded: bool,
        /// The angle of the marker node.
        angle: f32,
        /// The bounds of the marker node.
        bounds: Bounds,
        /// A marker node has a particle whose position is used to calculate the angle
        particle: Simulation.Particle,
        /// The neighbours of the marker node.
        neighbours: std.ArrayList(Node),

        pub fn create(data: Popup.Data) Node {
            const point = Projection.getPoint(data.lat, data.lng);
            const width = data.width + MAP_POPUP_BOUNDS_PADDING;
            const height = data.height + MAP_POPUP_BOUNDS_PADDING;

            var node = Node{
                .index = data.index,
                .rank = data.rank,
                .x = point.x,
                .y = point.y,
                .width = width,
                .height = height,
                .expanded = true,
                .angle = Angles.DEFAULT,
                .bounds = undefined,
                .particle = Simulation.Particle{
                    .center = point,
                    .width = undefined,
                    .height = undefined,
                    .index = 0,
                },
                .neighbours = std.ArrayList(Node).init(std.heap.page_allocator),
            };

            node.bounds = node.getBounds(1);
            node.particle.width = node.getParticleWidth(1);
            node.particle.height = node.getParticleHeight(1);

            return node;
        }

        pub fn updateBounds(self: Node, scale: f32) void {
            self.bounds = self.getBounds(scale);
        }

        pub fn updateParticle(self: Node, scale: f32) void {
            self.particle.width = self.getParticleWidth(scale);
            self.particle.height = self.getParticleHeight(scale);
        }

        fn getBounds(self: Node, scale: f32) Bounds {
            const offsets = Rectangle.getOffsets(self.width, self.height, self.angle);
            const left = -offsets.x;
            const right = self.width - left;
            const top = -offsets.y;
            const bottom = self.height - top;

            return Bounds{
                .x = self.x,
                .y = self.y,
                .left = left / scale,
                .right = right / scale,
                .top = top / scale,
                .bottom = bottom / scale,
            };
        }

        fn getParticleWidth(self: Node, scale: f32) f32 {
            return self.width / 2 / scale;
        }

        fn getParticleHeight(self: Node, scale: f32) f32 {
            return self.height / 2 / scale;
        }
    };
};

var nodesLenght: u32 = 0;
var nodes: []Nodes.Node = undefined;

export fn createPopupsArray(length: u32) void {
    nodesLenght = length;
    nodes = allocator.alloc(Nodes.Node, length) catch @panic("OOM: Failed to allocate memory");
}

export fn deletePopupsArray() void {
    allocator.free(nodes);
    nodes = undefined;
    nodesLenght = 0;
}

export fn addPopup(index: u32, rank: u32, lat: f32, lng: f32, width: f32, height: f32) void {
    const data = Nodes.Popup.Data{
        .index = index,
        .rank = rank,
        .lat = lat,
        .lng = lng,
        .width = width,
        .height = height,
    };

    nodes[index] = Nodes.Node.create(data);
}

export fn runPopupSimulation() void {}

// export fn getPopupState() void {}
