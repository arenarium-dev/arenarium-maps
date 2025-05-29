import { ANIMATION_LIMIT_DEFAULT } from '@workspace/shared/src/constants.js';

interface AnimationCallback {
	id: string;
	priority: number;
	executed: boolean;
	function: () => void;
}

class Animation {
	private animationsStarted = false;
	private animationsCount = 0;
	private animationsLimit = ANIMATION_LIMIT_DEFAULT;
	private animations = new Array<Map<string, AnimationCallback>>();

	private start() {
		window.requestAnimationFrame(this.tick.bind(this));
	}

	private tick() {
		try {
			// Animate animation up to animation limit, first the highest priority
			// Lower number = higher priority
			this.animationsCount = 0;

			for (let i = 0; i < this.animations.length; i++) {
				const animations = this.animations[i];
				if (animations == undefined) continue;

				for (const animation of animations.values()) {
					if (animation.executed) continue;

					animation.executed = true;
					animation.function();

					this.animationsCount++;
					if (this.animationsCount == this.animationsLimit) return;
				}
			}
		} finally {
			window.requestAnimationFrame(this.tick.bind(this));
		}
	}

	public equeue(priority: number, id: string, callback: () => void) {
		let animations = this.animations[priority];
		if (animations == undefined) {
			animations = this.animations[priority] = new Map();
		}

		animations.set(id, { id, priority, executed: false, function: callback });

		if (this.animationsStarted == false) {
			this.animationsStarted = true;
			this.start();
		}
	}

	public clear(priority: number, id: string) {
		const animations = this.animations[priority];
		if (animations == undefined) return;

		const animation = animations.get(id);
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
