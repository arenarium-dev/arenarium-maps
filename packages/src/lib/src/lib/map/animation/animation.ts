export const ANIMATION_LIMIT_DEFAULT = 128;
export const ANIMATION_PRIORITY_LAYER = 0;
export const ANIMATION_MARKER_LAYER = 1;
export const ANIMATION_CIRCLE_LAYER = 2;

interface AnimationItem {
	id: string;
	priority: number;
	executed: boolean;
	function: () => void;
}

interface AnimationLayer {
	animations: Array<Map<string, AnimationItem>>;
}

class Animation {
	private animationsStarted = false;
	private animationsCount = 0;
	private animationsLimit = ANIMATION_LIMIT_DEFAULT;

	private layers = new Array<AnimationLayer>();

	private start() {
		window.requestAnimationFrame(this.tick.bind(this));
	}

	private tick() {
		try {
			// Animate animation up to animation limit,
			// first the highest layer
			// first the highest priority
			// Lower number = higher priority
			this.animationsCount = 0;

			for (let i = 0; i < this.layers.length; i++) {
				const layer = this.layers[i];
				if (layer == undefined) continue;

				const animations = layer.animations;
				if (animations == undefined) continue;

				for (let j = 0; j < animations.length; j++) {
					const animationMap = animations[j];
					if (animationMap == undefined) continue;

					for (const animationItem of animationMap.values()) {
						if (animationItem.executed) continue;

						animationItem.executed = true;
						animationItem.function();

						this.animationsCount++;
						if (this.animationsCount == this.animationsLimit) return;
					}
				}
			}
		} finally {
			window.requestAnimationFrame(this.tick.bind(this));
		}
	}

	public equeue(slice: number, priority: number, id: string, callback: () => void) {
		let layer = this.layers[slice];
		if (layer == undefined) {
			layer = this.layers[slice] = { animations: new Array<Map<string, AnimationItem>>() };
		}

		let animations = layer.animations[priority];
		if (animations == undefined) {
			animations = layer.animations[priority] = new Map<string, AnimationItem>();
		}

		let animationItem: AnimationItem = { id, priority, executed: false, function: callback };
		animations.set(id, animationItem);

		if (this.animationsStarted == false) {
			this.animationsStarted = true;
			this.start();
		}
	}

	public clear(sclice: number, priority: number, id: string) {
		let layer = this.layers[sclice];
		if (layer == undefined) return;

		let animations = layer.animations[priority];
		if (animations == undefined) return;

		let animation = animations.get(id);
		if (animation == undefined) return;
		if (animation.executed == false) return;

		animations.delete(id);
	}

	public speed() {
		return Math.pow(2, (2 * this.animationsCount) / this.animationsLimit);
	}

	public stacked() {
		return this.animationsCount == this.animationsLimit;
	}

	public setLimit(limit: number) {
		this.animationsLimit = limit;
	}
}

export const animation = new Animation();
