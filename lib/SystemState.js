const debug = require('debug')('modularity');
const Module = require('./Module');

/**
 * A container for modules. Holds system state. It's a module itself.
 */
class SystemState extends Module {
	constructor() {
		super();
		this.knownClasses = {};
		this.setupQueue = [];
	}

	/**
	 * Add a module to the known classes library.
	 * @param classObject The class
	 * @param [overrideName] Class name override if encountering issues with transpiled solutions.
	 */
	addModuleClass(classObject, overrideName = null) {
		this.knownClasses[overrideName || classObject.name] = classObject;
	}

	/**
	 * Prepare module instances but don't initialize them.
	 */
	bootstrap(requirements) {
		debug('Bootstrapping system');
		const result = {};
		const createdNonExclusiveObjects = [];
		const setupQueue = [];
		const ops = Object.keys(requirements).map(prop => ['resolve', requirements[prop], prop]);

		while (ops.length > 0) {
			const [op, ...args] = ops.shift();

			switch (op) {
				case 'resolve':
					debug('Resolving bootstrap subject ' + args[1]);
					const instance = this.constructModule(args[0]);

					if (!instance.moduleIsExclusive()) {
						createdNonExclusiveObjects.push(instance);
					}

					result[args[1]] = instance;
					setupQueue.push(instance);
					ops.push(['inject', instance]);
					break;
				case 'inject':
					// TODO: Ability to request unique?
					const dependencies = [];
					const requestFn = nameOrClassObject => {
						// Must return an instance
						// Check if already have an instance
						const ResolvedClass = this.resolveClass(nameOrClassObject);

						debug(`Requested an instance of ${ResolvedClass.name}`);
						const existing = createdNonExclusiveObjects.find(obj => obj instanceof ResolvedClass);

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
							createdNonExclusiveObjects.push(created);
						}
						setupQueue.push(created);

						ops.push(['inject', created]);
						dependencies.push(created);
						return created;
					};

					args[0].modulePerformInjection(requestFn);
					args[0].hintModuleDependencies(dependencies);
					break;
				default:
					throw Error('Internal error - unknown op: ' + op);
			}
		}
		debug('Done Bootstrapping, ready to set up');
		this.setupQueue = setupQueue;
		this.invertSetupModulesList();
		if (Array.isArray(requirements)) {
			return Object.values(result);
		}
		return result;
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
		let leftovers = [...this.setupQueue];

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
				await mod.setup();
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
					`Failed to initialize ${newLeftovers.length} modules. The error messages were:\n${errs.join('\n')}`
				);
			}

			leftovers = newLeftovers;
		}
	}

	/**
	 * Teardown all modules.
	 */
	async teardown() {
		this.invertSetupModulesList();
		for (const mod of this.setupQueue) {
			debug('Teardown of module ' + mod.constructor.name);
			await mod.teardown();
		}
	}

	invertSetupModulesList() {
		this.setupQueue = this.setupQueue.map((_, i, self) => self[self.length - i - 1]); // Invert
	}
}

module.exports = SystemState;
