import { Tween } from 'svelte/motion';

interface TransitionOptions {
	duration?: number;
	easing?: (t: number) => number;
}

export class Transition<T> {
	public value: T;
	public motion: Tween<T>;

	constructor(value: T, options?: TransitionOptions) {
		this.value = value;
		this.motion = new Tween<T>(value, options);
	}

	public set(value: T, options?: TransitionOptions) {
		this.value = value;
		this.motion.set(value, options);
	}

	public update(options: TransitionOptions) {
		this.motion.set(this.value, options);
	}

	public snap() {
		this.motion.set(this.value, { duration: 0 });
	}
}
