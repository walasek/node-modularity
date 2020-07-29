const { SystemState, Module } = require('..');

module.exports = async function (test) {
	await test('SystemState', t => {
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
	});
};
