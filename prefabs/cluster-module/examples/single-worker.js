const { Module, SystemState } = require('../../..');
const { ClusterModuleBase } = require('../');

// eslint-disable-next-line no-console
const { log } = console;

class ExpensiveCalculationModule extends ClusterModuleBase {
	constructor() {
		super({
			nofork: false,
		});
	}

	async setup() {
		this.addJobType('calc1', async ms => {
			log('Performing long calculation ' + ms + ' ms');
			await new Promise(res => setTimeout(res, ms));
			log('Done!');
			return ms;
		});

		super.setup();
	}
}

class CalculatorModule extends Module {
	constructor() {
		super({
			inject: request => {
				this.calc = request(ExpensiveCalculationModule);
			},
		});
	}

	calculate(ms) {
		return this.calc.calc1(ms);
	}
}

(async () => {
	const system = new SystemState();

	system.addModuleClass(ExpensiveCalculationModule);
	system.addModuleClass(CalculatorModule);
	await ExpensiveCalculationModule.takeover(system);

	const { calc } = system.bootstrap({ calc: CalculatorModule });

	await system.setup();

	setTimeout(() => calc.calculate(3000), 2000);
	setTimeout(() => system.teardown(), 3000);
	const r = await calc.calculate(8000);

	log(r);
})();
