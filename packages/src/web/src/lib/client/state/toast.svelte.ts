import { page } from '$app/state';

export interface ToastData {
	path: string;
	text: string;
	seconds?: number;
	severity?: 'info' | 'error';
	callback?: {
		name: string;
		function: () => void;
	};
}

export class Toast {
	private state = $state<ToastData | null>();

	set(value: ToastData | null): void {
		this.state = value;
	}

	valid() {
		return this.state?.path == page.url.pathname;
	}

	get() {
		return this.state;
	}
}
