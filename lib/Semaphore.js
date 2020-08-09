class Semaphore {
	constructor(name) {
		this.name = name;
		this.state = false;
	}

	checkState() {
		if (this.state) {
			throw Error(
				`Cannot execute multiple operations in parallel in a ${this.name}. ` +
					`Check stack trace to identify the recursion.`
			);
		}
	}

	oneAtATimeSync(fn) {
		this.checkState();
		this.state = true;
		try {
			return fn();
		} finally {
			this.state = false;
		}
	}

	async oneAtATime(fn) {
		this.checkState();
		this.state = true;
		try {
			return fn();
		} finally {
			this.state = false;
		}
	}
}

module.exports = Semaphore;
