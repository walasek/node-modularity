const debug = require('debug')('modularity');
const Module = require('./Module');
const Semaphore = require('./Semaphore');

/**
 * A container for modules. Holds system state. It's a module itself.
 */
class SystemState extends Module {
	constructor() {
		super();
		this.knownClasses = {};
		this.setupQueue = [];
		this.createdNonExclusiveObjects = [];

		this.semaphore = new Semaphore('SystemState');
	}

	/**
	 * Add a module to the known classes library.
	 * @param classObject The class
	 * @param [overrideName] Class name override if encountering issues with transpiled solutions.
	 */
	addModuleClass(classObject, overrideName = null) {
		const name = overrideName || classObject.name;

		if (this.knownClasses[name]) {
			throw Error(`Tried to addModuleClass for an already known class or alias (${name}).`);
		}
		this.knownClasses[name] = classObject;
	}

	/**
	 * Prepare module instances but don't initialize them.
	 */
	bootstrap(requirements) {
		debug('Bootstrapping system');
		return this.semaphore.oneAtATimeSync(() => {
			const result = {};
			const setupQueue = [];
			const ops = Object.keys(requirements).map(prop => ['resolve', requirements[prop], prop]);

			while (ops.length > 0) {
				const [op, ...args] = ops.shift();

				switch (op) {
					case 'resolve':
						debug('Resolving bootstrap subject ' + args[1]);
						const instance = this.constructModule(args[0]);

						if (!instance.moduleIsExclusive()) {
							this.createdNonExclusiveObjects.push(instance);
						}

						result[args[1]] = instance;
						setupQueue.push(instance);
						ops.push(['inject', instance]);
						break;
					case 'inject':
						// TODO: Ability to request unique?
						const dependencies = [];
						let requestFnLegal = true;
						const requestFn = nameOrClassObject => {
							if (!requestFnLegal) {
								throw Error(`Invalid injection request call. Bootstrap was finished.`);
							}
							// Must return an instance
							// Check if already have an instance
							const ResolvedClass = this.resolveClass(nameOrClassObject);

							debug(`Requested an instance of ${ResolvedClass.name}`);
							const existing = this.createdNonExclusiveObjects.find(obj => obj instanceof ResolvedClass);

							if (existing && !existing.moduleIsExclusive()) {
								debug(`Requested instance is already built and non-exclusive`);
								dependencies.push(existing);
								return existing;
							}

							// Build
							const created = this.constructModule(ResolvedClass);

							if (created.moduleIsExclusive()) {
								debug(`Created instance of ${ResolvedClass.name} is exclusive and will not be reused`);
							} else {
								this.createdNonExclusiveObjects.push(created);
							}
							setupQueue.push(created);

							ops.push(['inject', created]);
							dependencies.push(created);
							return created;
						};

						args[0].modulePerformInjection(requestFn);
						requestFnLegal = false;
						break;
					/* istanbul ignore next */
					default:
						throw Error('Internal error - unknown op: ' + op);
				}
			}
			debug('Done Bootstrapping, ready to set up');
			this.setupQueue = [...this.setupQueue, ...setupQueue];
			this.invertSetupModulesList();
			if (Array.isArray(requirements)) {
				return Object.values(result);
			}
			return result;
		});
	}

	constructModule(nameOrClassObject) {
		const ResolvedClass = this.resolveClass(nameOrClassObject);

		debug(`Attempting construction of class ${ResolvedClass.name}`);
		return new ResolvedClass();
	}

	/**
	 * Return the class of a given name. If the argument is already a class then return it.
	 * @param {*} nameOrClassObject
	 */
	resolveClass(nameOrClassObject) {
		if (typeof nameOrClassObject === 'function') {
			// Must check if we know it
			if (!Object.values(this.knownClasses).find(obj => obj === nameOrClassObject)) {
				throw Error('Attempted to resolve an unknown class ' + nameOrClassObject.name);
			}
			return nameOrClassObject;
		} else if (typeof nameOrClassObject === 'string') {
			const translated = this.knownClasses[nameOrClassObject];

			if (translated) {
				return translated;
			}
			throw Error('Unable to resolve class ' + nameOrClassObject);
		} else {
			throw Error('Unable to resolve class of a name that is not a string');
		}
	}

	/**
	 * Setup bootstrapped modules.
	 */
	async setup() {
		debug('Setup starting');
		return this.semaphore.oneAtATime(async () => {
			let leftovers = [...this.setupQueue];
			const newSetupQueue = [];

			while (leftovers.length > 0) {
				const newLeftovers = [];

				for (const mod of leftovers) {
					debug('Setup of module ' + mod.constructor.name);
					try {
						mod.assertDependenciesSetup();
					} catch (err) {
						newLeftovers.push(mod);
						continue;
					}
					if (!mod.moduleWasSetUp()) {
						await mod.setup();
					}
					newSetupQueue.push(mod);
					if (!mod.moduleWasSetUp()) {
						throw Error(
							`Module ${mod.constructor.name} does not properly implement the setup method. ` +
								`Make sure you're calling super.setup()`
						);
					}
				}

				if (newLeftovers.length >= leftovers.length) {
					const errs = [];

					for (const mod of newLeftovers) {
						try {
							mod.assertDependenciesSetup();
						} catch (err) {
							errs.push(err);
						}
					}
					throw Error(
						`Failed to initialize ${newLeftovers.length} modules. The error messages were:\n${errs.join(
							'\n'
						)}`
					);
				}

				leftovers = newLeftovers;
			}

			this.setupQueue = newSetupQueue;
		});
	}

	/**
	 * Teardown all modules. Cleans up references.
	 * Must call bootstrap to use setup again.
	 */
	async teardown() {
		return this.semaphore.oneAtATime(async () => {
			this.invertSetupModulesList();
			for (const mod of this.setupQueue) {
				debug('Teardown of module ' + mod.constructor.name);
				await mod.teardown();
			}
			this.setupQueue = [];
			this.createdNonExclusiveObjects = [];
		});
	}

	invertSetupModulesList() {
		this.setupQueue = this.setupQueue.map((_, i, self) => self[self.length - i - 1]); // Invert
	}
}

module.exports = SystemState;
