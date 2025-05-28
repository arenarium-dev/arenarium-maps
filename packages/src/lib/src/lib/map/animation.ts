import { ANIMATION_LIMIT_DEFAULT } from '@workspace/shared/src/constants.js';

interface AnimationCallback {
	id: string;
	priority: number;
	callback: () => void;
}

class Animation {
	private animationsRunning = false;
	private animationsLimit = ANIMATION_LIMIT_DEFAULT;
	private animations = new Map<string, AnimationCallback>();

	private start() {
		window.requestAnimationFrame(this.tick.bind(this));
	}

	private tick() {
		const animationValues = Array.from(this.animations.values()).sort((a, b) => b.priority - a.priority);

		for (let i = 0; i < animationValues.length; i++) {
			const animation = animationValues[i];

			try {
				animation.callback();
			} catch (e) {
				console.error(e);
			} finally {
				this.animations.delete(animation.id);
			}

			if (i == this.animationsLimit) break;
		}

		window.requestAnimationFrame(this.tick.bind(this));
	}

	public equeue(id: string, priority: number, callback: () => void) {
		this.animations.set(id, { id, priority, callback });

		if (this.animationsRunning == false) {
			this.animationsRunning = true;
			this.start();
		}
	}

	public speed() {
		return Math.pow(2, this.animations.size / this.animationsLimit);
	}

	public stacked() {
		return this.animations.size > this.animationsLimit;
	}

	public setLimit(limit: number) {
		this.animationsLimit = limit;
	}
}

export const animation = new Animation();
