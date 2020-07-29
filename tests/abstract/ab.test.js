const { Module, SystemState } = require('../..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('Basic case - A requires B', async t => {
		const aConstructorSpy = sinon.spy();
		const bConstructorSpy = sinon.spy();

		class B extends Module {
			constructor() {
				super();
				bConstructorSpy();
			}
		}

		class A extends Module {
			constructor() {
				super({
					inject: request => {
						this.b = request(B);
					},
				});
				aConstructorSpy();
			}
		}

		const system = new SystemState();
		let state;

		system.addModuleClass(A);
		system.addModuleClass(B);

		await t.test('Bootstrap', t => {
			state = system.bootstrap({ a: A, b: B });

			t.ok(state.a instanceof A, 'State bootstrap result holds an instance of A');
			t.ok(state.b instanceof B, 'State bootstrap result holds an instance of B');

			t.equal(aConstructorSpy.callCount, 1, 'A was constructed once');
			t.equal(bConstructorSpy.callCount, 1, 'B was constructed once');
		});

		await t.test('Setup', async t => {
			sinon.spy(state.a, 'setup');
			sinon.spy(state.b, 'setup');

			await system.setup();

			t.equal(state.b.setup.callCount, 1, 'Expected setup to be called on B');
			t.equal(state.a.setup.callCount, 1, 'Expected setup to be called on A');
			t.ok(state.b.setup.calledBefore(state.a.setup), 'Expected B.setup to have been called before A.setup');
		});

		await t.test('Teardown', async t => {
			sinon.spy(state.a, 'teardown');
			sinon.spy(state.b, 'teardown');

			await system.teardown();

			t.equal(state.a.teardown.callCount, 1, 'Expected teardown to be called on A');
			t.equal(state.b.teardown.callCount, 1, 'Expected teardown to be called on B');
			t.ok(
				state.a.teardown.calledBefore(state.b.teardown),
				'Expected A.teardown to have been called before B.teardown'
			);
		});
	});
};
