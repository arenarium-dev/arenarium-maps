interface AnimationCallback {
	id: string;
	priority: number;
	callback: () => void;
}

class Animation {
	private animationsRunning = false;
	private animationsLimit = 128;
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

	public setLimit(limit: number) {
		this.animationsLimit = limit;
	}
}

export const animation = new Animation();
