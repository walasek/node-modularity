const { Module, SystemState } = require('../..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('Circular dependency - A->B B->C C->A is prevented', async t => {
		const aConstructorSpy = sinon.spy();
		const bConstructorSpy = sinon.spy();
		const cConstructorSpy = sinon.spy();

		// eslint-disable-next-line prefer-const
		let A;

		class C extends Module {
			constructor() {
				super({
					inject: request => {
						this.a = request(A);
					},
				});
				cConstructorSpy();
			}
		}

		class B extends Module {
			constructor() {
				super({
					inject: request => {
						this.c = request(C);
					},
				});
				bConstructorSpy();
			}
		}

		A = class extends Module {
			constructor() {
				super({
					inject: request => {
						this.b = request(B);
					},
				});
				aConstructorSpy();
			}
		};

		const system = new SystemState();
		let state;

		system.addModuleClass(A);
		system.addModuleClass(B);
		system.addModuleClass(C);

		t.test('Bootstrap', t => {
			state = system.bootstrap({ a: A, b: B });

			t.ok(state.a instanceof A, 'State bootstrap result holds an instance of A');
			t.ok(state.b instanceof B, 'State bootstrap result holds an instance of B');

			t.equal(aConstructorSpy.callCount, 1, 'A was constructed once');
			t.equal(bConstructorSpy.callCount, 1, 'B was constructed once');
			t.equal(cConstructorSpy.callCount, 1, 'C was constructed once');
		});

		await t.test('Setup', async t => {
			sinon.spy(state.a, 'setup');
			sinon.spy(state.b, 'setup');

			try {
				await system.setup();
				t.fail('Setup should throw');
			} catch (err) {
				t.ok(true);
			}
		});
	});

	await test('Circular dependency - A->B B->C C?>A is allowed', async t => {
		const aConstructorSpy = sinon.spy();
		const bConstructorSpy = sinon.spy();
		const cConstructorSpy = sinon.spy();
		const cSetupSpy = sinon.spy();

		// eslint-disable-next-line prefer-const
		let A;

		class C extends Module {
			constructor() {
				super({
					inject: (_, requestOptional) => {
						this.a = requestOptional(A);
					},
				});
				cConstructorSpy();
			}

			async setup() {
				super.setup();
				cSetupSpy(this.a.moduleWasSetUp());
			}
		}

		class B extends Module {
			constructor() {
				super({
					inject: request => {
						this.c = request(C);
					},
				});
				bConstructorSpy();
			}
		}

		A = class extends Module {
			constructor() {
				super({
					inject: request => {
						this.b = request(B);
					},
				});
				aConstructorSpy();
			}
		};

		const system = new SystemState();
		let state;

		system.addModuleClass(A);
		system.addModuleClass(B);
		system.addModuleClass(C);

		t.test('Bootstrap', t => {
			state = system.bootstrap({ a: A, b: B });

			t.ok(state.a instanceof A, 'State bootstrap result holds an instance of A');
			t.ok(state.b instanceof B, 'State bootstrap result holds an instance of B');

			t.equal(aConstructorSpy.callCount, 1, 'A was constructed once');
			t.equal(bConstructorSpy.callCount, 1, 'B was constructed once');
			t.equal(cConstructorSpy.callCount, 1, 'C was constructed once');
		});

		await t.test('Setup', async t => {
			sinon.spy(state.a, 'setup');
			sinon.spy(state.b, 'setup');
			sinon.spy(state.b.c, 'setup');

			await system.setup();

			t.is(state.a.setup.callCount, 1);
			t.is(state.b.setup.callCount, 1);
			t.is(state.b.c.setup.callCount, 1);

			t.ok(state.b.c.setup.calledBefore(state.b.setup));
			t.ok(state.b.setup.calledBefore(state.a.setup));

			t.deepEqual(cSetupSpy.firstCall.args, [false]);
		});

		await t.test('Teardown', async t => {
			sinon.spy(state.a, 'teardown');
			sinon.spy(state.b, 'teardown');
			sinon.spy(state.b.c, 'teardown');

			await system.teardown();

			t.is(state.a.teardown.callCount, 1);
			t.is(state.b.teardown.callCount, 1);
			t.is(state.b.c.teardown.callCount, 1);

			t.ok(state.a.teardown.calledBefore(state.b.teardown));
			t.ok(state.b.teardown.calledBefore(state.b.c.teardown));
		});
	});
};
