const SystemState = require('./SystemState');

module.exports = async function (bootstrapMap, knownModules = []) {
	const system = new SystemState();

	if (knownModules) {
		if (Array.isArray(knownModules)) {
			knownModules.forEach(mod => system.addModuleClass(mod));
		} else {
			Object.keys(knownModules).forEach(alias => system.addModuleClass(knownModules[alias], alias));
		}
	}

	const state = system.bootstrap(bootstrapMap);

	await system.setup();
	return { state, system };
};
