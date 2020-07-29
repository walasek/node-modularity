const { Module, SystemState } = require('../..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('Basic case - A and B both require a C exclusively', async t => {
		const cConstructorSpy = sinon.spy();

		class C extends Module {
			constructor() {
				super({
					exclusive: true,
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
			}
		}

		class A extends Module {
			constructor() {
				super({
					inject: request => {
						this.c = request(C);
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
			state = system.bootstrap({ a: A, b: B });

			t.ok(state.a instanceof A, 'State bootstrap result holds an instance of A');
			t.ok(state.b instanceof B, 'State bootstrap result holds an instance of B');

			t.equal(cConstructorSpy.callCount, 2, 'C was constructed twice (once for A and B)');
		});

		await t.test('Setup', async t => {
			sinon.spy(state.a, 'setup');
			sinon.spy(state.b, 'setup');
			sinon.spy(state.a.c, 'setup');
			sinon.spy(state.b.c, 'setup');

			await system.setup();

			t.equal(state.b.c.setup.callCount, 1, 'Expected C setup to be called on B');
			t.equal(state.a.c.setup.callCount, 1, 'Expected C setup to be called on A');
			t.ok(state.b.c.setup.calledBefore(state.b.setup), 'Expected B.c.setup to have been called before B.setup');
			t.ok(state.a.c.setup.calledBefore(state.a.setup), 'Expected A.c.setup to have been called before A.setup');
		});

		await t.test('Teardown', async t => {
			sinon.spy(state.a, 'teardown');
			sinon.spy(state.b, 'teardown');
			sinon.spy(state.a.c, 'teardown');
			sinon.spy(state.b.c, 'teardown');

			await system.teardown();

			t.equal(state.a.c.teardown.callCount, 1, 'Expected C teardown to be called on A');
			t.equal(state.b.c.teardown.callCount, 1, 'Expected C teardown to be called on B');
			t.ok(
				state.a.teardown.calledBefore(state.a.c.teardown),
				'Expected A.teardown to have been called before A.c.teardown'
			);
			t.ok(
				state.b.teardown.calledBefore(state.b.c.teardown),
				'Expected B.teardown to have been called before B.c.teardown'
			);
		});
	});
};
