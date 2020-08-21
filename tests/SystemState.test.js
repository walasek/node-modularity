const { SystemState, Module } = require('..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('SystemState', async t => {
		const system = new SystemState();

		t.test('Class resolving', t => {
			t.test('Prevents use of invalid types as class names', t => {
				t.throws(() => system.resolveClass(123), /not a string/);
				t.throws(() => system.resolveClass({}), /not a string/);
				t.throws(() => system.resolveClass([]), /not a string/);
			});

			class MyModule extends Module {}

			t.test('Throws if trying to resolve an unknown class', t => {
				t.throws(() => system.resolveClass(MyModule), /MyModule/);
			});

			system.addModuleClass(MyModule);

			t.test('Resolves if provided a class or class name', t => {
				t.ok(system.resolveClass(MyModule) == MyModule);
				t.ok(system.resolveClass('MyModule') == MyModule);
			});

			system.addModuleClass(MyModule, 'Alias');

			t.test('Resolves if used an alias', t => {
				t.ok(system.resolveClass('Alias') == MyModule);
			});

			t.test('Throws if used an unknown alias or name', t => {
				t.throws(() => system.resolveClass('SomeModule'), /SomeModule/);
			});
		});

		t.test('Bootstrap with an array', t => {
			class SomeModule extends Module {}
			class AnotherModule extends Module {}

			system.addModuleClass(SomeModule);
			system.addModuleClass(AnotherModule);

			const [a, b] = system.bootstrap([SomeModule, AnotherModule]);

			t.ok(a instanceof SomeModule);
			t.ok(b instanceof AnotherModule);
		});

		t.test('Bootstrap aliased', t => {
			class SomeModule extends Module {}

			system.addModuleClass(SomeModule, 'Aliased');

			const [a] = system.bootstrap(['Aliased']);

			t.ok(a instanceof SomeModule);
		});

		await t.test('Multi bootstrap, setup and teardown support', async t => {
			const aConstructs = sinon.spy();

			class ModuleA extends Module {
				constructor() {
					super();
					aConstructs();
				}
			}
			class ModuleB extends Module {
				constructor() {
					super({
						inject: request => {
							this.a = request(ModuleA);
						},
					});
				}
			}

			system.addModuleClass(ModuleA);
			system.addModuleClass(ModuleB);

			const [a, b] = system.bootstrap([ModuleA, ModuleB]);

			sinon.spy(a, 'setup');
			sinon.spy(b, 'setup');

			await system.setup();

			t.is(a.setup.callCount, 1);
			t.is(b.setup.callCount, 1);
			t.is(aConstructs.callCount, 1);

			const [b2] = system.bootstrap([ModuleB]);

			sinon.spy(b2, 'setup');

			await system.setup();

			t.is(a.setup.callCount, 1);
			t.is(aConstructs.callCount, 1, 'A dependent module should not be constructed since its already made');
			t.is(b.setup.callCount, 1);
			t.is(b2.setup.callCount, 1);

			t.ok(b2 instanceof ModuleB);
			t.ok(b2 != b);
			t.is(b2.a, a);

			sinon.spy(a, 'teardown');
			sinon.spy(b, 'teardown');
			sinon.spy(b2, 'teardown');

			await system.teardown();

			t.is(a.teardown.callCount, 1);
			t.is(b.teardown.callCount, 1);
			t.is(b2.teardown.callCount, 1);
			t.ok(b2.teardown.calledBefore(b));
			t.ok(b.teardown.calledBefore(a));

			const [secondA, secondB] = system.bootstrap([ModuleA, ModuleB]);

			t.is(aConstructs.callCount, 2);

			sinon.spy(secondA, 'setup');
			sinon.spy(secondB, 'setup');

			await system.setup();

			t.is(a.setup.callCount, 1);
			t.is(b.setup.callCount, 1);
			t.is(b2.setup.callCount, 1);
			t.is(secondA.setup.callCount, 1);
			t.is(secondB.setup.callCount, 1);
			t.is(secondB.a, secondA);

			sinon.spy(secondA, 'teardown');
			sinon.spy(secondB, 'teardown');

			await system.teardown();

			t.is(secondA.teardown.callCount, 1);
			t.is(secondB.teardown.callCount, 1);
			t.is(a.teardown.callCount, 1);
			t.is(b.teardown.callCount, 1);
			t.is(b2.teardown.callCount, 1);
		});

		await t.test('Guards proper super.setup', async t => {
			class SomeInvalidModule extends Module {
				setup() {} // missing super
			}

			system.addModuleClass(SomeInvalidModule);
			system.bootstrap([SomeInvalidModule]);

			try {
				await system.setup();
				t.fail('Should have thrown');
			} catch (err) {
				t.ok(err.message.indexOf('super.setup') !== -1);
			}
		});

		await t.test('Guards deferred bootstrap injections', async t => {
			let done;
			const p = new Promise(res => {
				done = sinon.stub().callsFake(() => res());
			});

			class SomeInvalidBootstrapModule extends Module {
				constructor() {
					super({
						inject: request => {
							setTimeout(() => {
								try {
									this.a = request('Something');
								} catch (err) {
									done(err);
								}
							}, 10);
						},
					});
				}
			}

			system.addModuleClass(SomeInvalidBootstrapModule);
			system.bootstrap([SomeInvalidBootstrapModule]);
			await p;
			t.is(done.callCount, 1);
			t.ok(done.firstCall.args, ['Invalid injection request call. Bootstrap was finished.']);
		});

		t.test('Module registration', t => {
			t.test('Cannot register the same classname twice', t => {
				class SomeModuleOnceAgain extends Module {}

				const a = SomeModuleOnceAgain;
				const b = SomeModuleOnceAgain;

				system.addModuleClass(a);
				t.throws(() => system.addModuleClass(b));
			});

			t.test('Handles undefined registration attempts', t => {
				t.throws(() => system.addModuleClass(undefined));
				t.throws(() => system.addModuleClass(null));
			});

			t.test('Handles attempts of null class names', t => {
				t.throws(() => system.addModuleClass({}));
			});
		});
	});
};
