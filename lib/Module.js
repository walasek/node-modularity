/**
 * A base class for any module.
 */
class Module {
	constructor(options) {
		this._module = {
			options: {
				exclusive: false, // Create a new instance of this module for each injection
				inject: null, // A function that requests remote dependencies
				...options,
				wasSetup: false, // Was setup() called on this module?
				dependencies: [], // An array of required dependencies requested by inject()
				optionalDependencies: [], // An array of optional dependencies requested by inject()
			},
		};
	}
	/**
	 * Setup this module. Called after all dependencies are set up.
	 * Optional dependencies are not guaranteed to be set up.
	 * Async methods are supported.
	 * As a library user you should define your own `setup` method and call super.setup() (no await needed).
	 */
	setup() {
		this._module.options.wasSetup = true;
	}

	/**
	 * Called after all modules are set up. Useful with some use cases.
	 * Async methods are supported.
	 */
	postSetup() {}

	/**
	 * Teardown this module. Called when everything should be closed and cleaned up.
	 * Starts from the most dependent modules.
	 * Async teardown is supported.
	 * As a library user you should define your own `teardown` method and call super.teardown() (no await needed)
	 */
	teardown() {
		this._module.options.wasSetup = false;
	}

	/**
	 * Return whether this module is exclusive.
	 */
	moduleIsExclusive() {
		return Boolean(this._module.options.exclusive);
	}

	/**
	 * Return whether this module was set up.
	 */
	moduleWasSetUp() {
		return this._module.options.wasSetup;
	}

	/**
	 * Inject objects into this module.
	 * @param {*} requestFn
	 */
	modulePerformInjection(requestFn) {
		if (this._module.options.inject) {
			const dependencies = [],
				optional = [];

			this._module.options.inject(
				(...args) => {
					const mod = requestFn(...args);

					dependencies.push(mod);
					return mod;
				},
				(...args) => {
					const mod = requestFn(...args);

					optional.push(mod);
					return mod;
				}
			);
			this._module.options.dependencies = dependencies;
			this._module.options.optionalDependencies = optional;
		}
	}

	assertDependenciesSetup() {
		const needles = this._module.options.dependencies.filter(dep => !dep.moduleWasSetUp());

		if (needles.length > 0) {
			throw Error(
				`Module's (${this.constructor.name}) dependencies were not set up (${needles.map(
					dep => dep.constructor.name
				)}). ` + `If a circular dependency is required then make sure one of the dependencies are optional.`
			);
		}
	}

	getRequiredDependencies() {
		return [...this._module.options.dependencies];
	}

	getOptionalDependencies() {
		return [...this._module.options.optionalDependencies];
	}
}

module.exports = Module;
