const { visualize, Module, SystemState } = require('..');

class A extends Module {}
class B extends Module {
	constructor() {
		super({
			exclusive: true,
		});
	}
}
class C extends Module {
	constructor() {
		super({
			inject: request => {
				request(A);
				request(B);
			},
		});
	}
}

module.exports = test => {
	test('System visualization', t => {
		t.test('Returns a string when provided with a bootstrapped system', t => {
			const system = new SystemState();

			system.addModuleClass(A);
			system.addModuleClass(B);
			system.addModuleClass(C);
			system.bootstrap([A, B, C]);

			const render = visualize(system);

			t.equal(typeof render, 'string');
			t.ok(render.includes('<body>'));
		});
	});
};
