export class Timer {
	private times: Map<string, number> = new Map();

	time<T>(action: (...args: any[]) => T, name: string) {
		// If the name is not in the map, add it
		if (!this.times.has(name)) this.times.set(name, 0);

		const start = performance.now();
		try {
			return action();
		} finally {
			const end = performance.now();
			const sum = this.times.get(name) ?? 0;
			const add = end - start;
			this.times.set(name, sum + add);
		}
	}

	print(prefix: string) {
		console.log(`${prefix}`);
		for (let [name, time] of this.times) {
			console.log(`${prefix} ${name}: ${time}`);
		}
		console.log(`${prefix} total: ${Array.from(this.times.values()).reduce((a, b) => a + b, 0)}`);
	}
}
