const { Module, SystemState } = require('../..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('Basic case - A requires two exclusive Bs which require a common C', async t => {
		const bConstructorSpy = sinon.spy();
		const cConstructorSpy = sinon.spy();

		class C extends Module {
			constructor() {
				super();
				cConstructorSpy();
			}
		}

		class B extends Module {
			constructor() {
				super({
					exclusive: true,
					inject: request => {
						this.c = request(C);
					},
				});
				bConstructorSpy();
			}
		}

		class A extends Module {
			constructor() {
				super({
					inject: request => {
						this.b1 = request(B);
						this.b2 = request(B);
					},
				});
			}
		}

		const system = new SystemState();
		let state;

		system.addModuleClass(A);
		system.addModuleClass(B);
		system.addModuleClass(C);

		await t.test('Bootstrap', t => {
			state = system.bootstrap({ a: A, c: C });

			t.ok(state.a instanceof A, 'State bootstrap result holds an instance of A');
			t.ok(state.c instanceof C, 'State bootstrap result holds an instance of C');

			t.equal(cConstructorSpy.callCount, 1, 'C was constructed once');
			t.equal(bConstructorSpy.callCount, 2, 'B was constructed twice for A');
		});

		await t.test('Setup', async t => {
			sinon.spy(state.a, 'setup');
			sinon.spy(state.c, 'setup');
			sinon.spy(state.a.b1, 'setup');
			sinon.spy(state.a.b2, 'setup');

			await system.setup();

			t.equal(state.a.setup.callCount, 1, 'Expected A setup to be called once');
			t.equal(state.a.b1.setup.callCount, 1, 'Expected A.b1 setup to be called once');
			t.equal(state.a.b2.setup.callCount, 1, 'Expected A.b2 setup to be called once');
			t.equal(state.c.setup.callCount, 1, 'Expected C setup to be called once');
			t.ok(state.c.setup.calledBefore(state.a.setup), 'Expected C setup to be called before A');
			t.ok(state.c.setup.calledBefore(state.a.b1.setup), 'Expected C setup to be called before A.b1');
			t.ok(state.c.setup.calledBefore(state.a.b2.setup), 'Expected C setup to be called before A.b2');
			t.ok(state.a.b1.setup.calledBefore(state.a.setup), 'Expected A.b1 setup to be called before A');
			t.ok(state.a.b2.setup.calledBefore(state.a.setup), 'Expected A.b1 setup to be called before A');
		});

		await t.test('Teardown', async t => {
			sinon.spy(state.a, 'teardown');
			sinon.spy(state.c, 'teardown');
			sinon.spy(state.a.b1, 'teardown');
			sinon.spy(state.a.b2, 'teardown');

			await system.teardown();

			t.equal(state.a.teardown.callCount, 1, 'Expected A teardown to be called once');
			t.equal(state.c.teardown.callCount, 1, 'Expected C teardown to be called once');
			t.equal(state.a.b1.teardown.callCount, 1, 'Expected A.b1 teardown to be called once');
			t.equal(state.a.b2.teardown.callCount, 1, 'Expected A.b2 teardown to be called once');
		});
	});
};
