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
				dependencies: [], // An array of dependencies requested by inject()
			},
		};
	}
	/**
	 * Setup this module. Called after all dependencies are set up.
	 * Optional dependencies are not guaranteed to be set up.
	 * Async methods are supported.
	 */
	setup() {
		this._module.options.wasSetup = true;
	}

	/**
	 * Teardown this module. Called when everything should be closed and cleaned up.
	 * Starts from the most dependent modules.
	 * Async teardown is supported.
	 */
	teardown() {}

	/**
	 * Return whether this module is exclusive
	 */
	moduleIsExclusive() {
		return Boolean(this._module.options.exclusive);
	}

	moduleWasSetUp() {
		return this._module.options.wasSetup;
	}

	/**
	 * Inject objects into this module.
	 * @param {*} requestFn
	 */
	modulePerformInjection(requestFn) {
		if (this._module.options.inject) {
			this._module.options.inject(requestFn);
		}
	}

	hintModuleDependencies(list) {
		this._module.options.dependencies = list;
	}

	assertDependenciesSetup() {
		const needles = this._module.options.dependencies.filter(dep => !dep.moduleWasSetUp());

		if (needles.length > 0) {
			throw Error(
				`Module's dependencies were not set up (${needles.map(dep => dep.constructor.name)}). ` +
					`If a circular dependency is required then make sure one of the dependencies are optional.`
			);
		}
	}
}

module.exports = Module;
