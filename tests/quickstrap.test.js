const quickstrap = require('../lib/quickstrap');
const Module = require('../lib/Module');
const sinon = require('sinon');
const SystemState = require('../lib/SystemState');

class C extends Module {}
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
				this.b = request(B);
			},
		});
	}
}

module.exports = async test => {
	await test('quickstrap sets up modules with an array of known modules', async t => {
		const {
			state: { a },
			system,
		} = await quickstrap({ a: A }, [A, B, C]);

		t.ok(a instanceof A);
		t.ok(system instanceof SystemState);
	});

	await test('quickstrap sets up modules with a map of modules and aliases', async t => {
		const cMockConstructorSpy = sinon.stub();

		class CMock extends Module {
			constructor() {
				super();
				cMockConstructorSpy();
			}
		}

		const {
			state: { x },
			system,
		} = await quickstrap({ x: A }, { A, B, C: CMock });

		t.is(cMockConstructorSpy.callCount, 1);
		t.ok(x instanceof A);
		t.ok(x.b.c instanceof CMock);
		t.ok(system instanceof SystemState);
	});
};
