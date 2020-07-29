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
};
