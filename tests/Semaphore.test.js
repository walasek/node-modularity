const Semaphore = require('../lib/Semaphore');

module.exports = async function (test) {
	await test('Semaphore', async t => {
		t.test('Sync', t => {
			const s = new Semaphore();

			t.test('Allows normal calls', t => {
				const result = s.oneAtATimeSync(() => 123);

				t.is(result, 123);
			});

			t.test('Prevents recursive calls', t => {
				t.throws(() => {
					s.oneAtATimeSync(() => s.oneAtATimeSync(() => 'nope'));
				});

				t.test('Allows normal calls after throw', () => {
					t.is(
						s.oneAtATimeSync(() => 123),
						123
					);
				});
			});
		});

		await t.test('Async', async t => {
			const s = new Semaphore();

			await t.test('Allows normal calls', async t => {
				const result = await s.oneAtATime(() => 123);

				t.is(result, 123);
			});

			await t.test('Prevents recursive calls', async t => {
				try {
					await s.oneAtATime(() => s.oneAtATime(() => 'nope'));
					return t.fail('Should have thrown');
				} catch (err) {
					t.ok(err.message.includes('recursion'));
				}

				await t.test('Allows normal calls after throw', async () => {
					t.is(await s.oneAtATime(() => 123), 123);
				});
			});
		});
	});
};
