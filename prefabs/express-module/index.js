const { Module } = require('../../');
const debug = require('debug')('modularity:express');

const expressMethods = ['get', 'post', 'put', 'delete', 'options', 'head', 'use'];

class ExpressModuleBase extends Module {
	constructor(express, moduleOptions = {}) {
		super(moduleOptions);

		this.express = express;
		this.middlewareRegistrationQueue = [];
		this.server = null;
		this.app = null;

		for (const method of expressMethods) {
			this[method] = (caller, fn, options) => this.addMiddleware(caller, method, fn, options);
		}

		// A dummy middleware that will allow `before` and `each`
		this.use(this, (_, __, next) => next());
	}

	addMiddleware(caller, method, fn, options = {}) {
		const callerName = this.callerName();

		debug(`Caller ${callerName} adding a "${method}" middleware`);
		this.middlewareRegistrationQueue.push({ caller, callerName, fn, options, method });
	}

	callerName(caller) {
		return (
			(caller && caller.constructor && caller.constructor.name) ||
			(caller && caller.name) ||
			caller ||
			'(unknown)'
		);
	}

	getApp() {
		return this.app;
	}

	async setup() {
		super.setup();

		this.app = this.express();
	}

	async postSetup() {
		// Execute middleware queue
		let queue = [...this.middlewareRegistrationQueue];

		debug(`Resolving ${queue.length} middlewares`);
		while (queue.length > 0) {
			let droppedItems = 0;

			for (const k in queue) {
				const item = queue[k];
				const { caller, callerName, fn, options, method } = item;
				let canInit = true;

				if (caller) {
					// If anyone depends on us then we can't init yet
					const dependentModules = queue.filter(
						otherItem =>
							item != otherItem &&
							(Array.isArray(otherItem.options.before)
								? otherItem.options.before.includes(caller)
								: otherItem.options.before == caller)
					);

					if (dependentModules.length > 0) {
						canInit = false;
					}
				}

				if (options.after) {
					let toCheck = options.after;

					if (!Array.isArray(toCheck)) {
						toCheck = [toCheck];
					}
					const dependencyNotReady = toCheck.find(
						// eslint-disable-next-line no-loop-func
						dependency => queue.filter(item => item.caller == dependency).length > 0
					);

					if (dependencyNotReady) {
						canInit = false;
					}
				}

				if (canInit) {
					debug(`Setting up ${callerName} middlewares`);
					this.app[method](fn);
					queue[k].drop = true;
					droppedItems++;
				}
			}

			queue = queue.filter(item => !item.drop);

			if (droppedItems == 0) {
				debug(`Uhoh, no middlewares were set up this time, we might be stuck`);
				throw Error(
					`Could not setup middlewares, please check the following relationships: ${queue
						.map(item => this.callerName(item.caller))
						.join(', ')}`
				);
			}
		}
	}

	listen(port) {
		return new Promise((res, rej) => {
			this.server = this.app.listen(port, err => {
				// istanbul ignore next
				if (err) {
					return rej(err);
				}

				res(this.server);
			});
		});
	}

	async teardown() {
		super.teardown();
		if (this.server) {
			// Server is not created in the setup so we have to check if it's there at all
			this.server.close();
		}
	}
}

module.exports = { ExpressModuleBase };
