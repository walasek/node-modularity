const { ExpressModuleBase } = require('../../prefabs/express-module');
const { quickstrap, SystemState, Module } = require('../..');
const sinon = require('sinon');

module.exports = async function (test) {
	await test('express-module prefab', async t => {
		class MyWebServer extends ExpressModuleBase {
			constructor() {
				super(() => ({
					listen: sinon.stub().callsFake((_, cb) => {
						setTimeout(() => cb(null), 100);
						return { close: sinon.stub() };
					}),
					use: sinon.stub(),
					get: sinon.stub(),
					post: sinon.stub(),
				}));
			}
		}

		class MyMiddleware extends Module {
			constructor() {
				super({
					inject: request => {
						this.web = request(MyWebServer);
					},
				});

				this.middleware = sinon.stub();
			}

			async setup() {
				super.setup();
				this.web.use(this, this.middleware);
			}
		}

		await t.test('Sets up and tears down properly', async () => {
			const { system } = await quickstrap({ web: MyWebServer }, [MyWebServer]);

			await system.setup();
			await system.teardown();
		});

		await t.test('Allows middleware registration', async t => {
			const system = new SystemState();

			system.addModuleClass(MyWebServer);

			const { web } = system.bootstrap({ web: MyWebServer });

			const middlewareSpy = sinon.stub();

			web.use('test', () => {
				middlewareSpy();
			});

			web.get('test', '/', () => {});

			await system.setup();
			const app = web.getApp();

			t.is(app.use.callCount, 2, 'Expected middleware to be called once on the express object');
			t.is(app.get.callCount, 1, 'Expected get to be called once on the express object');

			await system.teardown();
		});

		await t.test('Allows middleware registration ordering', async t => {
			await t.test('Case 1', async t => {
				class MyEndpoint extends Module {
					constructor() {
						super({
							inject: request => {
								this.web = request(MyWebServer);
								this.middleware = request(MyMiddleware);
							},
						});

						this.endpoint = sinon.stub();
					}

					async setup() {
						super.setup();
						this.web.get(this, '/', this.endpoint, { after: this.middleware });
					}
				}

				const system = new SystemState();

				system.addModuleClass(MyWebServer);
				system.addModuleClass(MyEndpoint);
				system.addModuleClass(MyMiddleware);

				const { web } = system.bootstrap({
					web: MyWebServer,
					endpoint: MyEndpoint,
					middleware: MyMiddleware,
				});

				await system.setup();
				const app = web.getApp();

				t.is(app.use.callCount, 2, 'Expected middleware to be called once on the express object');
				t.is(app.get.callCount, 1, 'Expected get to be called once on the express object');
				t.ok(app.use.calledBefore(app.get), 'Use should be registered first');

				await system.teardown();
			});

			await t.test('Case 1 - reversed', async t => {
				class MyEndpoint extends Module {
					constructor() {
						super({
							inject: request => {
								this.web = request(MyWebServer);
								this.middleware = request(MyMiddleware);
							},
						});

						this.endpoint = sinon.stub();
					}

					async setup() {
						super.setup();
						this.web.get(this, '/', this.endpoint, { before: this.middleware });
					}
				}

				const system = new SystemState();

				system.addModuleClass(MyWebServer);
				system.addModuleClass(MyEndpoint);
				system.addModuleClass(MyMiddleware);

				const { web } = system.bootstrap({
					web: MyWebServer,
					endpoint: MyEndpoint,
					middleware: MyMiddleware,
				});

				await system.setup();
				const app = web.getApp();

				t.is(app.use.callCount, 2, 'Expected middleware to be called once on the express object');
				t.is(app.get.callCount, 1, 'Expected get to be called once on the express object');
				t.ok(app.use.calledAfter(app.get), 'Get should be registered first');

				await system.teardown();
			});

			await t.test('Case 1 - impossible', async t => {
				class MyEndpoint extends Module {
					constructor() {
						super({
							inject: request => {
								this.web = request(MyWebServer);
								this.middleware = request(MyMiddleware);
							},
						});

						this.endpoint = sinon.stub();
					}

					async setup() {
						super.setup();
						this.web.get(this, '/', this.endpoint, { before: this.middleware, after: this.middleware });
					}
				}

				const system = new SystemState();

				system.addModuleClass(MyWebServer);
				system.addModuleClass(MyEndpoint);
				system.addModuleClass(MyMiddleware);

				system.bootstrap({
					web: MyWebServer,
					endpoint: MyEndpoint,
					middleware: MyMiddleware,
				});

				try {
					await system.setup();
				} catch (err) {
					t.ok(err.message.indexOf('relationships') !== -1);
				}
			});
		});

		await t.test('Closes on teardown if listen was called', async t => {
			const {
				state: { web },
				system,
			} = await quickstrap({ web: MyWebServer }, [MyWebServer]);
			const app = web.getApp();

			t.is(app.listen.callCount, 0);

			await web.listen(123);

			t.is(app.listen.callCount, 1);
			t.is(web.server.close.callCount, 0);

			await system.teardown();

			t.is(web.server.close.callCount, 1);
		});
	});
};
