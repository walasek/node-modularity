const Module = require('./lib/Module');
const SystemState = require('./lib/SystemState');

module.exports = {
	Module,
	SystemState,
};

// class ModE extends Module {
// 	someMethod() {
// 		return 'hey!';
// 	}
// }

// class ModESpecial extends Module {
// 	someMethod() {
// 		return 'this is a special override';
// 	}
// }

// /**
//  * Construct unique ModC for each injection
//  */
// class ModD extends Module {
// 	constructor() {
// 		super({
// 			exclusive: true,
// 			inject: request => {
// 				this.e = request('ModE');
// 			},
// 		});
// 	}
// 	someMethod() {
// 		return this.e.someMethod();
// 	}
// }

// class ModB extends Module {
// 	constructor() {
// 		super({
// 			inject: request => {
// 				this.d = request(ModD);
// 			},
// 		});
// 	}
// 	someMethod() {
// 		return this.d.someMethod();
// 	}
// }

// class ModC extends Module {
// 	constructor() {
// 		super({
// 			inject: request => {
// 				this.d = request(ModD);
// 			},
// 		});
// 	}
// }

// class ModA extends Module {
// 	constructor() {
// 		super({
// 			inject: request => {
// 				this.b = request(ModB);
// 				this.c = request(ModC);
// 			},
// 		});
// 	}

// 	myMethod() {
// 		return this.b.someMethod();
// 	}
// }

// const manager = new SystemState();

// manager.addModuleClass(ModA);
// manager.addModuleClass(ModB);
// manager.addModuleClass(ModC);
// manager.addModuleClass(ModD);
// manager.addModuleClass(ModESpecial, 'ModE');

// const state = manager.bootstrap({
// 	a: ModA,
// });

// (async () => {
// 	await manager.setup();

// 	state.a.myMethod(); // ?

// 	await manager.teardown();
// })();
