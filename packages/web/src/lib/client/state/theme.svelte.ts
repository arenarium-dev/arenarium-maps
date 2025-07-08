export class Theme {
	public static readonly Light = 'light';
	public static readonly Dark = 'dark';

	private state = $state<'light' | 'dark'>('dark');

	get() {
		return this.state;
	}

	initialize(): void {
		this.state = window.document.documentElement.className === 'light' ? 'light' : 'dark';
	}

	set(value: 'light' | 'dark') {
		switch (value) {
			case 'light': {
				window.document.documentElement.className = 'light';
				window.localStorage.setItem('theme', 'light');
				break;
			}
			case 'dark': {
				window.document.documentElement.className = 'dark';
				window.localStorage.setItem('theme', 'dark');
				break;
			}
		}

		this.state = value;
	}
}
