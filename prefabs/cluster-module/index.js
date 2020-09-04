const { Module, quickstrap } = require('../../');
const cluster = require('cluster');
const debug = require('debug')('modularity:cluster:' + (cluster.isMaster ? 'master' : process.pid));

const envModuleNameKey = '_CLUSTER_MODULE_NAME_FORK';
const envModuleIdKey = '_CLUSTER_MODULE_ID_FORK';
const defaultOptions = {
	serializeFn: JSON.stringify,
	deserializeFn: JSON.parse,
	nofork: false,
	signals: true,
	teardownWaitMaxAge: 10000,
	workerRespawnTime: 1000,
};

class ClusterModuleBase extends Module {
	constructor(options, moduleOptions = {}) {
		super(moduleOptions);

		this.options = { ...defaultOptions, ...options };
		this.worker = null;
		this.id = Math.random().toString();

		// Master fields
		this.jobs = {};
	}

	addJobType(name, fn) {
		if (this.moduleWasSetUp()) {
			throw Error('Can only add job types before super.setup is called!');
		}
		if (this.options.nofork) {
			debug(`Registering job type ${name} on ${this.constructor.name} with nofork mode`);
			this[name] = (...args) => {
				// Simple passthrough for compatibility between nofork modes
				debug(`(nofork) passthrough ${this.constructor.name}::${name}`);
				return fn(...this.options.deserializeFn(this.options.serializeFn(args)));
			};
		} else {
			if (!this.constructor.shouldTakeover()) {
				debug(`Registering job method ${name} on ${this.constructor.name}`);
				this[name] = (...args) => {
					// Queue job and resolve or reject result
					if (!this.moduleWasSetUp()) {
						throw Error(`Cannot run the job before setup or during teardown`);
					}
					return new Promise((res, rej) => {
						let jobId;

						while (!jobId || this.jobs[jobId]) {
							jobId = Math.random().toString();
						}

						const serialized = this.options.serializeFn(args);

						this.jobs[jobId] = {
							name,
							id: jobId,
							forkId: this.id,
							args: serialized,
							res,
							rej,
							time: Date.now(),
						};

						if (this.worker) {
							this.sendJobToWorker(jobId);
						} else {
							debug(`Worker is not available at this time, will send the job when ready`);
						}
					});
				};
			} else {
				debug(`Fork listening for job method ${name} of ${this.constructor.name}`);
				// Listen for jobs
				process.on('message', async ({ name, id, forkId, args }) => {
					debug(`Worker received ${this.constructor.name}::${name} job id ${id}`);
					try {
						const deserialized = this.options.deserializeFn(args);
						const result = await fn(...deserialized);

						debug(`Job id ${id} finished successfully`);
						process.send({ id, forkId, result: this.options.serializeFn(result) });
					} catch (err) {
						debug(`Job id ${id} failed`);
						debug(err);

						process.send({ id, forkId, error: err.message || err });
					}
				});
			}
		}
	}

	sendJobToWorker(jobId) {
		const { name, id, forkId, args } = this.jobs[jobId];

		if (this.worker) {
			debug(`Sending job ${this.constructor.name}::${name} to worker thread`);
			this.worker.send({ name, id, forkId, args });
		} else {
			throw Error(`Cannot send job ${jobId} to worker, worker does not exist`);
		}
	}

	spawnWorker() {
		this.worker = cluster.fork({
			[envModuleNameKey]: this.constructor.name,
			[envModuleIdKey]: this.id,
		});
		debug(`Spawned worker of ${this.constructor.name} with pid ${this.worker.process.pid}`);
		this.worker.on('exit', code => {
			if (code != 0) {
				if (this.moduleWasSetUp()) {
					debug(`Worker ${this.worker.process.pid} exited with an error code, will respawn worker`);
					setTimeout(() => this.spawnWorker(), this.options.workerRespawnTime);
					this.worker = null;
				} else {
					debug(`Worker ${this.worker.process.pid} teardown with error, will not respawn`);
				}
			}
		});
		this.worker.on('message', ({ id, forkId, result, error }) => {
			// Only receive compatible messages
			if (id && forkId && (result || error)) {
				// Only receive messages for the fork that we manage
				if (forkId === this.id) {
					// Only receive messages for the jobs that we know
					if (this.jobs[id]) {
						const { res, rej, name, time } = this.jobs[id];
						const t = Math.round(Date.now() - time);

						debug(`Received results on ${this.constructor.name}::${name} id ${id} after ${t} ms`);
						delete this.jobs[id];

						if (result) {
							res(this.options.deserializeFn(result));
						} else {
							rej(error);
						}
					} else {
						debug(`Received a message related to job id ${id} which we don't know`);
					}
				} else {
					debug(`Received a compatible message related to another fork, ignoring`);
				}
			} else {
				debug(`Received an incompatible message, ignoring`);
			}
		});
		// Send pending jobs
		Object.values(this.jobs).forEach(job => this.sendJobToWorker(job.id));
	}

	async setup() {
		super.setup();

		if (!this.options.nofork) {
			if (!this.constructor.shouldTakeover()) {
				// Spawn the fork
				this.spawnWorker();
			} else {
				// Just handle incoming jobs
				debug(`Worker of ${this.constructor.name} started successfully`);
			}
		} else {
			// No-fork mode, handle jobs right away
			debug(`${this.constructor.name} is in nofork mode, no setup required`);
		}
	}

	teardown() {
		super.teardown();
		// Finish all pending jobs
		return new Promise(async res => {
			debug(`Tearing down ${this.constructor.name}, ${Object.keys(this.jobs).length} jobs pending`);
			// Wait until there are no jobs under the waitMaxAge
			while (Object.values(this.jobs).find(({ time }) => Date.now() - time <= this.options.teardownWaitMaxAge)) {
				await new Promise(next => setTimeout(next, 1));
			}
			// Kill the worker, resolve after it's done
			if (this.worker) {
				this.worker.on('exit', () => res);
				this.worker.kill();
			} else {
				// No worker?
				res();
			}
		});
	}

	static shouldTakeover() {
		// eslint-disable-next-line no-process-env
		return !cluster.isMaster && process.env[envModuleNameKey] === this.name;
	}

	static takeover(system, moduleLib = []) {
		if (!this.shouldTakeover()) {
			return;
		}
		return new Promise(async () => {
			try {
				debug(`${this.name} taking over the process`);
				const { system } = await quickstrap({ me: this }, moduleLib);

				['SIGHUP', 'SIGINT', 'SIGTERM'].forEach(id => {
					process.on(id, async () => {
						try {
							debug(`Worker teardown initiated`);
							await system.teardown();
							debug(`Worker teardown finished, bye!`);
							process.exit(0);
						} catch (err) {
							debug(`Worker teardown failed`);
							debug(err);
							process.exit(1);
						}
					});
				});
			} catch (err) {
				debug(`An exception has been thrown during setup`);
				debug(err);
				process.exit(1);
			}
		});
	}
}

module.exports = { ClusterModuleBase };
