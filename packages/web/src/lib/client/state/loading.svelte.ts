export class Loading {
	count = 0;
	running = $state<boolean>(false);

	start() {
		this.count++;
		this.running = true;
	}

	stop() {
		if (this.count > 0) this.count--;
		if (this.count == 0) this.running = false;
	}
}
